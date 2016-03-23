import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import {expect} from 'chai';
import * as cancan from 'cancan';
import * as _ from 'lodash';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {IMockDb, CancanRequest, Book} from './utils';
import * as utils from './utils';
let {
    user1,
    user2,
    book1,
    book2,
    mockDb,
    applyResourcefulCancan,
    applyResourcefulCancanWithRedirects,
    notFoundUrl,
    unauthorizedUrl
} = utils;

describe('loadResource', () => {
    let req: CancanRequest;
    let res: express.Response;
    let next = function() {};
    let resourceLoader: express.RequestHandler;

    beforeEach(() => {
        req = <CancanRequest> httpMocks.createRequest();
        res = httpMocks.createResponse();
    });

    describe('without redirect options', () => {
        beforeEach(() => {
            applyResourcefulCancan(req, res, next);
            resourceLoader = cancan2.loadResource('Book');
        });

        describe('non-POST/PUT methods', () => {
            it('set model when id is in param', (done) => {
                req.params['id'] = 1;
                resourceLoader(req, res, () => {
                    expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });

            it('set model when id is in query string', (done) => {
                req.query['id'] = 1;
                resourceLoader(req, res, () => {
                    expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });

            it('returns 404 not found if model is not found', (done) => {
                req.params['id'] = 4;
                resourceLoader(req, res, next);
                expect(res.statusCode).to.equal(404);
                done();
            });

            it('set model collection when id is not in param', (done) => {
                req.user = user1;
                resourceLoader(req, res, () => {
                    expect(req.models['Book']).to.deep.equal([book1, book2]);
                    done();
                });
            });
        });

        describe('POST/PUT methods', () => {
            it('set model from content in the request body', (done) => {
                req.method = 'POST';
                req.body['Book'] = _.clone<Book>(book1, true);
                resourceLoader(req, res, () => {
                    expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });

            it('returns 400 bad request if model is not in body', (done) => {
                req.method = 'PUT';
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

        describe('Non-POST/PUT methods', () => {
            it('redirects to not found url if model is not found', () => {
                let spy = sinon.spy(res, 'redirect');
                req.params['id'] = 4;
                resourceLoader(req, res, next);
                expect(spy.calledWith(notFoundUrl)).to.be.true;
            });
        });
    });
});
