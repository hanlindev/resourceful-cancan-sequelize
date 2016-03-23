declare module 'resourceful-cancan-sequelize' {
    import cancan = require('cancan');
    import express = require('express')

    module __resourcefulCancanSequelizeModule {
        interface AbilitySpecs<TUserModel> {
            entity: cancan.ConstructorFunction<TUserModel>;
            config: cancan.ConfigFunction<TUserModel>;
        }

        interface CancanHelper<TReturn> {
            (model: any, action: string, target: any): TReturn;
        }

        /**
         * Make your UserInstance interface extend this to add type definintion
         * to req.user
         */
        export interface IUserModel {}

        /**
        * Extend this interface in a controller module to include all model classes
        * that may be loaded by any action of that controller.
        */
        interface IControllerModels {}

        /**
        * Extend this interface to specify the models in a sequelize db instance.
        */
        interface IDb {}

        interface RequestWithCancan<TDb, TControllerModels, TUserModel>
        extends express.Request {
            db: TDb;
            user: TUserModel;
            cancanConfig: ResourcefulCancanOptions;
            models: TControllerModels;
            can: CancanHelper<boolean>;
            cannot: CancanHelper<boolean>;
            authorize: CancanHelper<void>;
        }

        interface ResourcefulCancanOptions {
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
        function resourcefulCancan<TDb, TUser>(
            db: TDb,
            abilities: AbilitySpecs<TUser>[],
            config?: ResourcefulCancanOptions
        ): express.RequestHandler;

        interface ResourceLoaderConfig {
            idName?: string; // Default name = 'id'
            pageSize?: number; // Default page size = 30
            pageNumberName?: string; // Default page number name = 'page'
        }

        let defaultLoaderConfig: ResourceLoaderConfig;

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
            config?: ResourceLoaderConfig
        ): express.RequestHandler;

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
        export function loadAndAuthorizeResource(
            name: string,
            config?: ResourceLoaderConfig
        ): express.RequestHandler;
    }

    export = __resourcefulCancanSequelizeModule;
}
