import * as express from 'express';
import * as sinon from 'sinon';
import * as _ from 'lodash';
import * as cancan from 'cancan';

import * as cancan2 from '../resourceful-cancan-sequelize';

export class User {
    constructor(
        public name: string,
        public email: string
    ) {}
}

export class Book {
    constructor(
        public title: string
    ) {}
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

export let user1 = new User('test user 1', 'test1@example.com');
export let user2 = new User('test user 2', 'test2@example.com');
export let book = new Book('test book');
let _mockDb: IMockDb = {
    User: {
        findById: sinon.stub(),
        findAll: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction([_.clone(user1), _.clone(user2)]);
            }
        }),
        build: sinon.stub().returns(_.clone(user1))
    },
    Book: {
        findById: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction(_.clone(book));
            }
        })
    }
}

_mockDb.User.findById['withArgs'](1).returns({
    then: (resultFunction) => {
        resultFunction(_.clone(user1));
    }
});
_mockDb.User.findById['withArgs'](2).returns({
    then: (resultFunction) => {
        resultFunction(null);
    }
})

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
                abilities.can('edit', Book);
            }
        }]
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
                abilities.can('edit', Book);
            }
        }],
        {
            notFoundRedirect: notFoundUrl,
            unauthorizedRedirect: unauthorizedUrl
        }
    );
    middleware(req, res, next);
}
