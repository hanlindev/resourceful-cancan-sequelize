import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import {expect} from 'chai';
import * as cancan from 'cancan';
import * as _ from 'lodash';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {User, Book, IMockDb, user1, user2, book, mockDb} from './utils';

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

        describe('none POST/UPDATE methods', () => {
            it('set model when id is in param', (done) => {
                req.params['id'] = 1;
                resourceLoader(req, res, () => {
                    expect(req.models['User']).to.deep.equal(user1);
                    done();
                });
            });

            it('set model when id is in query string', (done) => {
                req.query['id'] = 1;
                resourceLoader(req, res, () => {
                    expect(req.models['User']).to.deep.equal(user1);
                    done();
                });
            });

            it('returns 404 not found if model is not found', (done) => {
                req.params['id'] = 2;
                resourceLoader(req, res, next);
                expect(res.statusCode).to.equal(404);
                done();
            });

            it('set model collection when id is not in param', (done) => {
                resourceLoader(req, res, () => {
                    expect(req.models['User']).to.deep.equal([user1, user2]);
                    done();
                });
            });
        });

        describe('POST/UPDATE methods', () => {
            it('set model from content in the request body', (done) => {
                req.method = 'POST';
                req.body['User'] = _.clone<User>(user1, true);
                resourceLoader(req, res, () => {
                    expect(req.models['User']).to.deep.equal(user1);
                    done();
                });
            });

            it('returns 400 bad request if model is not in body', (done) => {
                req.method = 'UPDATE';
                resourceLoader(req, res, next);
                expect(res.statusCode).to.equal(400);
                done();
            });
        });
    });
});
