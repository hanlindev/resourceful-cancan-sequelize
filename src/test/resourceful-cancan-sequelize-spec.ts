import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import {expect} from 'chai';
import * as cancan from 'cancan';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {User, Book, IMockDb, user1, book, mockDb} from './utils';

describe('resourceful-cancan-sequelize', () => {
    let req: cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>;
    let res: express.Response;
    let next = function() {};

    beforeEach(() => {
        req = <cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>>
            httpMocks.createRequest();
        res = httpMocks.createResponse();
    });

    describe('resourcefulCancan', () => {
        let mw: express.RequestHandler;
        beforeEach(() => {
            mw = cancan2.resourcefulCancan(
                mockDb,
                [{
                    entity: User,
                    config: function (user: User) {
                        let abilities = <cancan.Ability<User>> this;
                        abilities.can('edit', Book);
                    }
                }]
            );
            mw(req, res, next);
        })

        it('should add db param to request', () => {
            expect(req.db).to.not.null;
        });

        it('should add cancan helpers to request', () => {
            expect(req.can).to.not.null;
            expect(req.can(user1, 'edit', book)).to.be.true;
            expect(req.can(user1, 'view', book)).to.be.false;
        });
    });
});
