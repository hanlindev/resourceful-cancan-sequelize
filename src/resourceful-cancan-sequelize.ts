import * as express from 'express';
import * as Sequelize from 'sequelize';
import * as cancan from 'cancan';

interface IModel {
    // TODO
}
export type ModelsCollection = {[key: string]: IModel};
export interface AbilitySpecs<TUser> {
    entity: cancan.ConstructorFunction<TUser>;
    config: cancan.ConfigFunction<TUser>;
}
export interface CancanConfig<TUser> {
    models: ModelsCollection;
    abilities: AbilitySpecs<TUser>[];
}

/**
 * Config the middleware that configs the ability spec of cancan. The middleware
 * will attach the ability spec to the request as well as the helper functions,
 * i.e. can, cannot etc.
 * @param  {CancanConfig} config prperties to configure the abilities.
 * @return {express.RequestHandler}
 */
export function resourcefulCancan<TUser>(config: CancanConfig<TUser>) {
    // TODO
}

export interface ResourceLoaderConfig {
    name: string;
    id_name?: string;
}


type ResourceLoader = express.RequestHandler;

export function loadResource(config: ResourceLoaderConfig): ResourceLoader {
    return (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        // TODO
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
