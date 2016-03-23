import * as express from 'express';
import * as sinon from 'sinon';
import * as _ from 'lodash';
import * as cancan from 'cancan';

import * as cancan2 from '../resourceful-cancan-sequelize';

export class User {
    public constructor(public name: string, public email: string) {}
}

export class Book {
    public constructor(public id: number, public title: string, public userName: string) {}
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

export type CancanRequest = cancan2.RequestWithCancan<
    IMockDb,
    cancan2.IControllerModels,
    cancan2.IUserModel
>;

export let user1 = new User('test user 1', 'test1@example.com');
export let user2 = new User('test user 2', 'test2@example.com');
export let book1 = new Book(1, 'test book 1', 'test user 1');
export let book2 = new Book(2, 'test book 2', 'test user 1');
export let book3 = new Book(3, 'test book 3', 'test user 2');
let _mockDb: IMockDb = {
    User: {
        findById: sinon.stub(),
        findAll: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction([_.clone(user1), _.clone(user2)]);
            }
        }),
    },
    Book: {
        findById: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction(_.clone(book1));
            }
        }),
        findAll: sinon.stub(),
        build: sinon.stub().returns(_.clone(book1))
    }
}

_mockDb.Book.findById['withArgs'](1).returns({
    then: (resultFunction) => {
        resultFunction(_.clone(book1));
    }
});
_mockDb.Book.findById['withArgs'](3).returns({
    then: (resultFunction) => {
        resultFunction(_.clone(book3));
    }
});
_mockDb.Book.findById['withArgs'](4).returns({
    then: (resultFunction) => {
        resultFunction(null);
    }
});
_mockDb.Book.findAll['withArgs']({
    limit: 30,
    offset: 0,
    where: {
        userName: 'test user 1'
    }
}).returns({
    then: (resultFunction) => {
        resultFunction([_.clone<Book>(book1), _.clone<Book>(book2)]);
    }
});
_mockDb.Book.findAll['withArgs']({
    limit: 30,
    offset: 0,
    where: {
        userName: 'test user 3'
    }
}).returns({
    then: (resultFunction) => {
        resultFunction([]);
    }
});

export let mockDb = _mockDb;

export function applyResourcefulCancan(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    let middleware = cancan2.resourcefulCancan(
        mockDb,
        [{
            entity: User,
            config: function (user: User) {
                let abilities = <cancan.Ability<User>> this;
                abilities.can('manage', Book, {userName: user.name});
            }
        }],
        {
            userPrimaryKey: 'name',
            userForeignKey: 'userName'
        }
    );
    middleware(req, res, next);
}

export let notFoundUrl = 'http://example.com/not-found';
export let unauthorizedUrl = 'http://example.com/unauthorized';
export function applyResourcefulCancanWithRedirects(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    let middleware = cancan2.resourcefulCancan(
        mockDb,
        [{
            entity: User,
            config: function (user: User) {
                let abilities = <cancan.Ability<User>> this;
                abilities.can('manage', Book, {userName: user.name});
            }
        }],
        {
            userPrimaryKey: 'name',
            userForeignKey: 'userName',
            notFoundRedirect: notFoundUrl,
            unauthorizedRedirect: unauthorizedUrl
        }
    );
    middleware(req, res, next);
}
