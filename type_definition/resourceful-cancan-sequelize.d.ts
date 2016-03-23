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
      * Extend this interface in a controller module to include all model classes
      * that may be loaded by any action of that controller.
      */
      interface IControllerModels {}

      /**
       * Extend this interface to specify the models in a sequelize db instance.
       */
      interface IDb {}

      interface RequestWithCancan<TDb, TControllerModels>
          extends express.Request {
          db: TDb,
          cancanConfig: ResourcefulCancanOptions,
          models: TControllerModels,
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
          config: ResourcefulCancanOptions
      ): express.RequestHandler;

      interface ResourceLoaderConfig {
          idName?: string; // Default name = 'id'
          pageSize?: number; // Default page size = 30
          pageNumberName?: string; // Default page number name = 'page'
      }
  }

  export = __resourcefulCancanSequelizeModule;
}
