import * as express from 'express';
import * as Sequelize from 'sequelize';
import {conditionalFilter, IConditionalFilterCreator} from 'resourceful-router';
import * as Cancan from 'cancan';
import {ClassConstructor, InstanceCreator, ModelType, ActionsType, TargetsType, ConditionType, CancanOptions} from 'cancan';
import * as _ from 'lodash';

export interface AbilityConfig<TP, TT> {
  model: ModelType<TP>;
  actions: ActionsType;
  targets: TargetsType<TT>;
  condition?: ConditionType<TP, TT>;
}

export interface AbilitySpecs<TUserModel> {
  entity: ClassConstructor<TUserModel> | InstanceCreator<TUserModel>;
  configure: (cancan: Cancan) => any;
}

export interface CancanHelper<TReturn> {
  (model: any, action: string, target: any): TReturn;
}

/**
* Extend this interface in a controller module to include all model classes
* that may be loaded by any action of that controller.
*/
export interface IControllerModels {}

/**
* Make your UserInstance interface extend this to add type definintion
* to req.user
*/
export interface IUserModel {}

/**
* Extend this interface to specify the models in a sequelize db instance.
*/
export interface IDb {}

export interface RequestWithCancan<TDb, TControllerModels, TUserModel>
extends express.Request {
  user: TUserModel;
  db: TDb,
  cancanConfig: ResourcefulCancanOptions,
  models: TControllerModels,
  can: CancanHelper<boolean>;
  cannot: CancanHelper<boolean>;
  authorize: CancanHelper<void>;
}
type BaseRequestWithCancan<TDb> =
RequestWithCancan<TDb, IControllerModels, IUserModel>;

export interface ResourcefulCancanOptions {
  userPrimaryKey?: string; // Default user primary key = 'id'
  userForeignKey?: string; // Default user foreign key = 'userId'
  notFoundRedirect?: string;
  unauthorizedRedirect?: string;
}

/**
* Config the middleware that configs the ability spec of cancan. The middleware
* will attach the ability spec to the request as well as the helper functions,
* i.e. can, cannot etc. In order for unmarshalling POST data to model data,
* you need to use appropriate body-parser middleware.
* @param  {CancanConfig} config prperties to configure the abilities.
* @return {express.RequestHandler}
*/
export function resourcefulCancan<TDb, TUser>(
  db: TDb,
  abilities: AbilitySpecs<TUser>[],
  config: ResourcefulCancanOptions = {}
): express.RequestHandler {
  return (
    req: BaseRequestWithCancan<TDb>,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const cancan = new Cancan();
    abilities.forEach(ability => {
      ability.configure(cancan);
    });

    req.db = db;
    req.cancanConfig = config;
    req.can = cancan.can;
    req.cannot = cancan.cannot;
    req.authorize = cancan.authorize;
    next();
  }
}

export interface ResourceLoaderConfig {
  idName?: string; // Default name = 'id'
  pageSize?: number; // Default page size = 30
  pageNumberName?: string; // Default page number name = 'page'
}

export const defaultLoaderConfig: ResourceLoaderConfig = {
  idName: 'id',
  pageSize: 30,
  pageNumberName: 'page'
};

/**
* Create a RequestHandler to extract the desired model object(s). If an ID is
* in the params or query, a specific model will be loaded. If not found, it
* will return a 404 response. If id is not in params or query, it will return a
* collection of model instances that belong to the current user. POST and
* UPDATE requests are special. The loader will check if body exists in the
* request object. If it is, it will try to find a JSON object keyed by the name
* in the resource loader config and unmarshal it to a Sequelize Model object
* without saving.
*
* @param  {ResourceLoaderConfig} config for the resource loader.
* @return {express.RequestHandler}              a RequestHandler function.
*/
export function loadResource(
  name: string,
  config: ResourceLoaderConfig = defaultLoaderConfig
): IConditionalFilterCreator {
  return conditionalFilter((
    req: BaseRequestWithCancan<IDb>,
    res: express.Response,
    next: express.NextFunction
  ) => {
    loadResourceImpl(name, config, req, res, next);
  });
}

function loadResourceImpl(
  name: string,
  config: ResourceLoaderConfig,
  req: BaseRequestWithCancan<IDb>,
  res: express.Response,
  next: express.NextFunction
) {
  req.models = req.models || {};
  if (req.method === 'POST' || req.method == 'PUT') {
    unmarshalModel(req, res, next, name);
  } else {
    loadFromDb(name, req, res, next, config);
  }
}

function unmarshalModel(
  req: BaseRequestWithCancan<IDb>,
  res: express.Response,
  next: express.NextFunction,
  name: string
) {
  let model = req.body[name];
  if (!model) {
    res.status(400).send(`Model data - ${name} not found in request body.`);
    return;
  }

  if (_.isString(model)) {
    try {
      model = JSON.parse(model);
    } catch (e) {
      res.status(400)
      .send(`Unable to parse model string as JSON string for ${name}`);
      return;
    }
  }

  if (req.method === 'POST') {
    req.models[name] = req.db[name].build(model);
    next();
  } else if (req.method === 'PUT') {
    const id = model.id;
    req.db[name].findById(id).then((existing: Sequelize.Instance<any>) => {
      if (!existing) {
        res.status(404).send(`Model with id ${id} not found`);
        return null;
      } else {
        existing.set(model);
        req.models[name] = existing;
        next();
        return null;
      }
    });
  }
}

function loadFromDb(
  name: string,
  req: RequestWithCancan<IDb, IControllerModels, IUserModel>,
  res: express.Response,
  next: express.NextFunction,
  config: ResourceLoaderConfig
) {
  let idName = config.idName || defaultLoaderConfig.idName;
  let id = req.params[idName] || req.query[idName];
  if (!!id || id == 0) {
    req.db[name].findById(id).then(model => {
      if (_.isNull(model)) {
        if (!!req.cancanConfig.notFoundRedirect) {
          res.redirect(req.cancanConfig.notFoundRedirect);
          res.end();
        } else {
          res.status(404).send(`Model with id ${id} not found`);
        }
      } else {
        req.models[name] = model;
        next();
      }
      return null
    });
  } else {
    let pageSize = config.pageSize || defaultLoaderConfig.pageSize;
    let pageNumberName = config.pageNumberName ||
    defaultLoaderConfig.pageNumberName;
    let pageNumber = req.params[pageNumberName] || 1;
    let userPrimaryKey = req.cancanConfig.userPrimaryKey || 'id';
    let userForeignKey = req.cancanConfig.userForeignKey || 'userId';

    req.db[name].findAll({
      limit: pageSize,
      offset: pageSize * (pageNumber - 1),
      where: {
        [userForeignKey]: req.user[userPrimaryKey]
      }
    }).then(rows => {
      req.models[name] = rows;
      next();
      return null;
    });
  }
}

/**
 * Load and authorize the resource. Resource loading strategy is the same as the
 * loadResource function. After the resource is loaded, it will try to authorize
 * it. If authorization succeeds, the next handler will be invoked otherwise
 * it will return 401 unauthorized response or redirect to the given url.
 *
 * HTTP -> cancan action mapping:
 * GET    -> view
 * POST   -> add
 * PUT    -> edit
 * DELETE -> destroy
 *
 * @param  {string}               name    name of the resource to be loaded.
 * @param  {ResourceLoaderConfig} config
 * @return {express.RequestHandler}       the resource loader middleware.
 */
export function loadAndAuthorizeResource(
  name: string,
  config: ResourceLoaderConfig = defaultLoaderConfig
): IConditionalFilterCreator {
  return conditionalFilter((
    req: RequestWithCancan<IDb, IControllerModels, IUserModel>,
    res: express.Response,
    next: express.NextFunction
  ) => {
    loadResourceImpl(name, config, req, res, () => {
      if (_.isArray(req.models[name]) || req.method === 'POST') {
        next();
      } else if (req.can(req.user, getAction(req), req.models[name])) {
        next();
      } else {
        if (!!req.cancanConfig.unauthorizedRedirect) {
          res.redirect(req.cancanConfig.unauthorizedRedirect);
          res.end();
        } else {
          res.status(401).send('Unauthorized');
        }
      }
    });
  });
}

function getAction(req: express.Request): string {
  let action = '';

  switch(req.method) {
    case 'GET':
      action = 'view';
      break;
    case 'POST':
      action = 'add';
      break;
    case 'PUT':
      action = 'edit';
      break;
    case 'DELETE':
      action = 'destroy';
      break;
    default:
      throw new TypeError('Unknown HTTP method');
  }

  return action;
}
