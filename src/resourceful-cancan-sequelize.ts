import * as express from 'express';
import * as Sequelize from 'sequelize';
import * as cancan from 'cancan';
import * as _ from 'lodash';

export interface AbilitySpecs<TUser> {
    entity: cancan.ConstructorFunction<TUser>;
    config: cancan.ConfigFunction<TUser>;
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
 * Extend this interface to specify the models in a sequelize db instance.
 */
export interface IDb {}

export interface RequestWithCancan<TDb, TControllerModels>
    extends express.Request {
    db: TDb,
    models: TControllerModels,
    can: CancanHelper<boolean>;
    cannot: CancanHelper<boolean>;
    authorize: CancanHelper<void>;
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
    abilities: AbilitySpecs<TUser>[]
): express.RequestHandler {
    return (
        req: RequestWithCancan<TDb, IControllerModels>,
        res: express.Response,
        next: express.NextFunction
    ) => {
        abilities.forEach(ability => {
            cancan.configure(ability.entity, ability.config);
        });

        req.db = db;
        req.can = cancan.can;
        req.cannot = cancan.cannot;
        req.authorize = cancan.authorize;
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

type ResourceLoader = express.RequestHandler;

/**
 * Create a RequestHandler to extract the desired model object(s). If an ID is
 * found in the params or query, a specific model will be loaded. If not found
 * will return a 404 response. POST and UPDATE requests are special. The loader
 * will check if body exists in the request object. If it is, it will try to
 * find a JSON object keyed by the name in the resource loader config and
 * unmarshal it to a Sequelize Model object without saving.
 *
 * @param  {ResourceLoaderConfig} config for the resource loader.
 * @return {ResourceLoader}              a RequestHandler function.
 */
export function loadResource(
    name: string,
    config: ResourceLoaderConfig = defaultLoaderConfig
): ResourceLoader {
    return (
        req: RequestWithCancan<IDb, IControllerModels>,
        res: express.Response,
        next: express.NextFunction
    ) => {
        req.models = req.models || {};
        if (req.method === 'POST' || req.method == 'UPDATE') {
            unmarshalModel(req, res, next, name);
        } else {
            loadFromDb(name, req, res, next, config);
        }
    }
}

function unmarshalModel(
    req: RequestWithCancan<IDb, IControllerModels>,
    res: express.Response,
    next: express.NextFunction,
    name: string
) {
    let model = req.body[name];
    if (!model) {
        res.status(400).send('Model data not found in request body.');
        return;
    }

    if (_.isString(model)) {
        try {
            model = JSON.parse(model);
        } catch (e) {
            res.status(400).send('Unable to parse model string as JSON string');
            return;
        }
    }

    req.models[name] = req.db[name].build(model);
    next();
}

function loadFromDb(
    name: string,
    req: RequestWithCancan<IDb, IControllerModels>,
    res: express.Response,
    next: express.NextFunction,
    config: ResourceLoaderConfig
) {
    let idName = config.idName || defaultLoaderConfig.idName;
    let id = req.params[idName] || req.query[idName];
    if (!!id || id == 0) {
        req.db[name].findById(id).then(model => {
            if (_.isNull(model)) {
                res.status(404).send(`Model with id ${id} not found`);
            } else {
                req.models[name] = model;
                next();
            }
        });
    } else {
        let pageSize = config.pageSize || defaultLoaderConfig.pageSize;
        let pageNumberName = config.pageNumberName ||
            defaultLoaderConfig.pageNumberName;
        let pageNumber = req.params[pageNumberName] || 1;
        req.db[name].findAll({
            limit: pageSize,
            offset: pageSize * (pageNumber - 1)
        }).then(rows => {
            req.models[name] = rows;
            next();
        });
    }
}

// TODO just reference. Remove when done
// class User {
//     constructor(public id: number) {}
// }
// class Test {
//     constructor(public userId: number) {}
// }
//
// cancan.configure(User, function(user: User) {
//     (<cancan.Ability<User>> this).can('manage', Test, function(test) {
//         return test.userId === user.id;
//     });
// });
// let user = new User(1);
// console.log(cancan.can(user, 'add', new Test(1)));
// console.log(cancan.can(user, 'add', new Test(2)));
