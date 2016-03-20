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
    let abilitiesMiddleware: express.RequestHandler;

    beforeEach(() => {
        req = <cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>>
            httpMocks.createRequest();
        res = httpMocks.createResponse();
        abilitiesMiddleware = cancan2.resourcefulCancan(
            mockDb,
            [{
                entity: User,
                config: function (user: User) {
                    let abilities = <cancan.Ability<User>> this;
                    abilities.can('edit', Book);
                }
            }]
        );
        abilitiesMiddleware(req, res, next);
    });

    describe('resourcefulCancan', () => {
        it('adds db and cancan helpers to req', () => {
            expect(req.db).to.not.null;
            expect(req.can).to.not.null;
            expect(req.cannot).to.not.null;
            expect(req.authorize).to.not.null;
        });

        describe('req.can', () => {
            it('returns false when action is not authorized', () => {
                expect(req.can(user1, 'view', book)).to.be.false;
            })
            it('returns true when action is authorized', () => {
                expect(req.can(user1, 'edit', book)).to.be.true;
            });
        });

        describe('req.cannot', () => {
            it('returns true when action is not authorized', () => {
                expect(req.cannot(user1, 'view', book)).to.be.true;
            });

            it('returns false when action is authorized', () => {
                expect(req.cannot(user1, 'edit', book)).to.be.false;
            });
        });

        describe('req.authorize', () => {
            it('throws when action is not authorized', () => {
                expect(() => {req.authorize(user1, 'view', book)}).to.throw();
            });

            it('does not throw when action is authorized', () => {
                expect(() => {req.authorize(user1, 'edit', book)}).to.not.throw();
            });
        });
    });

    describe('loadResource', () => {
        let resourceLoader: express.RequestHandler;

        beforeEach(() => {
            resourceLoader = cancan2.loadResource('User');
        });

        it('set model when id is in param', (done) => {
            req.params['id'] = 1;
            resourceLoader(req, res, () => {
                expect(req.models['User']).to.equal(user1);
                done();
            });
        });
    });
});
