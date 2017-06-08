/// <reference types="express" />
import * as express from 'express';
import * as cancan2 from '../resourceful-cancan-sequelize';
export declare class User {
    name: string;
    email: string;
    constructor(name: string, email: string);
}
export declare class Book {
    id: number;
    title: string;
    userName: string;
    constructor(id: number, title: string, userName: string);
}
export interface IMockModel<TModel> {
    findById?: (id: any) => TModel;
    findAll?: (options: any) => TModel[];
    build?: (props: any) => TModel;
}
export interface IMockDb {
    User: IMockModel<User>;
    Book: IMockModel<Book>;
}
export declare type CancanRequest = cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels, cancan2.IUserModel>;
export declare let user1: User;
export declare let user2: User;
export declare let book1: Book;
export declare let book2: Book;
export declare let book3: Book;
export declare let mockDb: IMockDb;
export declare function applyResourcefulCancan(req: express.Request, res: express.Response, next: express.NextFunction): void;
export declare let notFoundUrl: string;
export declare let unauthorizedUrl: string;
export declare function applyResourcefulCancanWithRedirects(req: express.Request, res: express.Response, next: express.NextFunction): void;
