"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var resourceful_router_1 = require("resourceful-router");
var Cancan = require("cancan");
var _ = require("lodash");
/**
* Config the middleware that configs the ability spec of cancan. The middleware
* will attach the ability spec to the request as well as the helper functions,
* i.e. can, cannot etc. In order for unmarshalling POST data to model data,
* you need to use appropriate body-parser middleware.
* @param  {CancanConfig} config prperties to configure the abilities.
* @return {express.RequestHandler}
*/
function resourcefulCancan(db, abilities, config) {
    if (config === void 0) { config = {}; }
    return function (req, res, next) {
        var cancan = new Cancan();
        abilities.forEach(function (ability) {
            ability.configure(cancan);
        });
        req.db = db;
        req.cancanConfig = config;
        req.can = cancan.can;
        req.cannot = cancan.cannot;
        req.authorize = cancan.authorize;
        next();
    };
}
exports.resourcefulCancan = resourcefulCancan;
exports.defaultLoaderConfig = {
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
function loadResource(name, config) {
    if (config === void 0) { config = exports.defaultLoaderConfig; }
    return resourceful_router_1.conditionalFilter(function (req, res, next) {
        loadResourceImpl(name, config, req, res, next);
    });
}
exports.loadResource = loadResource;
function loadResourceImpl(name, config, req, res, next) {
    req.models = req.models || {};
    if (req.method === 'POST' || req.method == 'PUT') {
        unmarshalModel(req, res, next, name);
    }
    else {
        loadFromDb(name, req, res, next, config);
    }
}
function unmarshalModel(req, res, next, name) {
    var model = req.body[name];
    if (!model) {
        res.status(400).send("Model data - " + name + " not found in request body.");
        return;
    }
    if (_.isString(model)) {
        try {
            model = JSON.parse(model);
        }
        catch (e) {
            res.status(400)
                .send("Unable to parse model string as JSON string for " + name);
            return;
        }
    }
    if (req.method === 'POST') {
        req.models[name] = req.db[name].build(model);
        next();
    }
    else if (req.method === 'PUT') {
        var id_1 = model.id;
        req.db[name].findById(id_1).then(function (existing) {
            if (!existing) {
                res.status(404).send("Model with id " + id_1 + " not found");
                return null;
            }
            else {
                existing.set(model);
                req.models[name] = existing;
                next();
                return null;
            }
        });
    }
}
function loadFromDb(name, req, res, next, config) {
    var idName = config.idName || exports.defaultLoaderConfig.idName;
    var id = req.params[idName] || req.query[idName];
    if (!!id || id == 0) {
        req.db[name].findById(id).then(function (model) {
            if (_.isNull(model)) {
                if (!!req.cancanConfig.notFoundRedirect) {
                    res.redirect(req.cancanConfig.notFoundRedirect);
                    res.end();
                }
                else {
                    res.status(404).send("Model with id " + id + " not found");
                }
            }
            else {
                req.models[name] = model;
                next();
            }
            return null;
        });
    }
    else {
        var pageSize = config.pageSize || exports.defaultLoaderConfig.pageSize;
        var pageNumberName = config.pageNumberName ||
            exports.defaultLoaderConfig.pageNumberName;
        var pageNumber = req.params[pageNumberName] || 1;
        var userPrimaryKey = req.cancanConfig.userPrimaryKey || 'id';
        var userForeignKey = req.cancanConfig.userForeignKey || 'userId';
        req.db[name].findAll({
            limit: pageSize,
            offset: pageSize * (pageNumber - 1),
            where: (_a = {},
                _a[userForeignKey] = req.user[userPrimaryKey],
                _a)
        }).then(function (rows) {
            req.models[name] = rows;
            next();
            return null;
        });
    }
    var _a;
}
/**
* Load and authorize the resource. Resource loading strategy is the same as the
* loadResource function. After the resource is loaded, it will try to authorize
* it. If authorization succeeds, the next handler will be invoked otherwise
* it will return 401 unauthorized response or redirect to the given url.
*
* @param  {string}               name    name of the resource to be loaded.
* @param  {ResourceLoaderConfig} config
* @return {express.RequestHandler}       the resource loader middleware.
*/
function loadAndAuthorizeResource(name, config) {
    if (config === void 0) { config = exports.defaultLoaderConfig; }
    return resourceful_router_1.conditionalFilter(function (req, res, next) {
        loadResourceImpl(name, config, req, res, function () {
            if (_.isArray(req.models[name]) || req.method === 'POST') {
                next();
            }
            else if (req.can(req.user, getAction(req), req.models[name])) {
                next();
            }
            else {
                if (!!req.cancanConfig.unauthorizedRedirect) {
                    res.redirect(req.cancanConfig.unauthorizedRedirect);
                    res.end();
                }
                else {
                    res.status(401).send('Unauthorized');
                }
            }
        });
    });
}
exports.loadAndAuthorizeResource = loadAndAuthorizeResource;
function getAction(req) {
    var action = '';
    switch (req.method) {
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
