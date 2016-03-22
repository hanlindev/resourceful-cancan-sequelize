import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import {expect} from 'chai';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {IMockDb} from './utils';
import * as utils from './utils';

let {
    user1,
    book1,
    unauthorizedUrl,
    applyResourcefulCancan,
    applyResourcefulCancanWithRedirects
} = utils;

describe('loadAndAuthorizeResource', () => {
    let req: cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>;
    let res: express.Response;
    let next = function() {};
    let resourceLoader: express.RequestHandler;

    beforeEach(() => {
        req = <cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>>
            httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = () => {};
        resourceLoader = cancan2.loadAndAuthorizeResource('Book');
        req.user = user1;
    });

    describe('without redirect options', () => {
        beforeEach(() => {
            applyResourcefulCancan(req, res, next);
        });

        it('loads the resource when id is in req.params', (done) => {
            req.params['id'] = 1;
            resourceLoader(req, res, () => {
                expect(req.models['Book']).to.deep.equal(book1);
                done();
            });
        });

        it("returns 401 unauthorized if resource does't belong to user", (done) => {
            req.params['id'] = 3;
            resourceLoader(req, res, next);
            expect(res.statusCode).to.equal(401);
            done();
        });
    });

    describe('with redirect options', () => {
        beforeEach(() => {
            applyResourcefulCancanWithRedirects(req, res, next);
        });

        it(
            'redirects to unauthorized url if resources is not authorized',
            (done) => {
                req.params['id'] = 3;
                let spy = sinon.spy(res, 'redirect');
                resourceLoader(req, res, next);
                expect(spy.calledWith(unauthorizedUrl)).to.be.true;
                done();
            }
        );
    });
});
