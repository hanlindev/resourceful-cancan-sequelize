import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import {expect} from 'chai';
import * as cancan from 'cancan';
import * as _ from 'lodash';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {IMockDb, User} from './utils';
import * as utils from './utils';
let {
    user1,
    user2,
    book,
    mockDb,
    applyResourcefulCancan,
    applyResourcefulCancanWithRedirects,
    notFoundUrl,
    unauthorizedUrl
} = utils;

describe('loadResource', () => {
    let req: cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>;
    let res: express.Response;
    let next = function() {};
    let resourceLoader: express.RequestHandler;

    beforeEach(() => {
        req = <cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>>
            httpMocks.createRequest();
        res = httpMocks.createResponse();
    });

    describe('without redirect options', () => {
        beforeEach(() => {
            applyResourcefulCancan(req, res, next);
            resourceLoader = cancan2.loadResource('User');
        });

        describe('non-POST/UPDATE methods', () => {
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

    describe('with redirects', () => {
        beforeEach(() => {
            applyResourcefulCancanWithRedirects(req, res, next);
        });

        describe('Non-POST/UPDATE methods', () => {
            it('redirects to not found url if model is not found', () => {
                let spy = sinon.spy(res, 'redirect');
                req.params['id'] = 2;
                resourceLoader(req, res, next);
                expect(spy.calledWith(notFoundUrl)).to.be.true;
            });
        });
    });
});
