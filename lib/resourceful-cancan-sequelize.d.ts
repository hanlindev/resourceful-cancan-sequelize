/// <reference types="express" />
import * as express from 'express';
import { IConditionalFilterCreator } from 'resourceful-router';
import * as Cancan from 'cancan';
import { ClassConstructor, InstanceCreator, ModelType, ActionsType, TargetsType, ConditionType } from 'cancan';
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
export interface IControllerModels {
}
/**
* Make your UserInstance interface extend this to add type definintion
* to req.user
*/
export interface IUserModel {
}
/**
* Extend this interface to specify the models in a sequelize db instance.
*/
export interface IDb {
}
export interface RequestWithCancan<TDb, TControllerModels, TUserModel> extends express.Request {
    user: TUserModel;
    db: TDb;
    cancanConfig: ResourcefulCancanOptions;
    models: TControllerModels;
    can: CancanHelper<boolean>;
    cannot: CancanHelper<boolean>;
    authorize: CancanHelper<void>;
}
export interface ResourcefulCancanOptions {
    userPrimaryKey?: string;
    userForeignKey?: string;
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
export declare function resourcefulCancan<TDb, TUser>(db: TDb, abilities: AbilitySpecs<TUser>[], config?: ResourcefulCancanOptions): express.RequestHandler;
export interface ResourceLoaderConfig {
    idName?: string;
    pageSize?: number;
    pageNumberName?: string;
}
export declare const defaultLoaderConfig: ResourceLoaderConfig;
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
export declare function loadResource(name: string, config?: ResourceLoaderConfig): IConditionalFilterCreator;
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
export declare function loadAndAuthorizeResource(name: string, config?: ResourceLoaderConfig): IConditionalFilterCreator;
