"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpMocks = require("node-mocks-http");
var sinon = require("sinon");
var chai_1 = require("chai");
var _ = require("lodash");
var cancan2 = require("../resourceful-cancan-sequelize");
var utils = require("./utils");
var user1 = utils.user1, user2 = utils.user2, book1 = utils.book1, book2 = utils.book2, mockDb = utils.mockDb, applyResourcefulCancan = utils.applyResourcefulCancan, applyResourcefulCancanWithRedirects = utils.applyResourcefulCancanWithRedirects, notFoundUrl = utils.notFoundUrl, unauthorizedUrl = utils.unauthorizedUrl;
describe('loadResource', function () {
    var req;
    var res;
    var next = function () { };
    var resourceLoader;
    beforeEach(function () {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
    });
    describe('without redirect options', function () {
        beforeEach(function () {
            applyResourcefulCancan(req, res, next);
            resourceLoader = cancan2.loadResource('Book');
        });
        describe('non-POST/PUT methods', function () {
            it('set model when id is in param', function (done) {
                req.params['id'] = 1;
                resourceLoader(req, res, function () {
                    chai_1.expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });
            it('set model when id is in query string', function (done) {
                req.query['id'] = 1;
                resourceLoader(req, res, function () {
                    chai_1.expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });
            it('returns 404 not found if model is not found', function (done) {
                req.params['id'] = 4;
                resourceLoader(req, res, next);
                chai_1.expect(res.statusCode).to.equal(404);
                done();
            });
            it('set model collection when id is not in param', function (done) {
                req.user = user1;
                resourceLoader(req, res, function () {
                    chai_1.expect(req.models['Book']).to.deep.equal([book1, book2]);
                    done();
                });
            });
        });
        describe('POST/PUT methods', function () {
            it('set model from content in the request body', function (done) {
                req.method = 'POST';
                req.body['Book'] = _.cloneDeep(book1);
                resourceLoader(req, res, function () {
                    chai_1.expect(req.models['Book']).to.deep.equal(book1);
                    done();
                });
            });
            it('returns 400 bad request if model is not in body', function (done) {
                req.method = 'PUT';
                resourceLoader(req, res, next);
                chai_1.expect(res.statusCode).to.equal(400);
                done();
            });
        });
    });
    describe('with redirects', function () {
        beforeEach(function () {
            applyResourcefulCancanWithRedirects(req, res, next);
        });
        describe('Non-POST/PUT methods', function () {
            it('redirects to not found url if model is not found', function () {
                var spy = sinon.spy(res, 'redirect');
                req.params['id'] = 4;
                resourceLoader(req, res, next);
                chai_1.expect(spy.calledWith(notFoundUrl)).to.be.true;
            });
        });
    });
});
