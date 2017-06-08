"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpMocks = require("node-mocks-http");
var sinon = require("sinon");
var chai_1 = require("chai");
var cancan2 = require("../resourceful-cancan-sequelize");
var utils = require("./utils");
var user1 = utils.user1, book1 = utils.book1, unauthorizedUrl = utils.unauthorizedUrl, applyResourcefulCancan = utils.applyResourcefulCancan, applyResourcefulCancanWithRedirects = utils.applyResourcefulCancanWithRedirects;
describe('loadAndAuthorizeResource', function () {
    var req;
    var res;
    var next = function () { };
    var resourceLoader;
    beforeEach(function () {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = function () { };
        resourceLoader = cancan2.loadAndAuthorizeResource('Book');
        req.user = user1;
    });
    describe('without redirect options', function () {
        beforeEach(function () {
            applyResourcefulCancan(req, res, next);
        });
        it('loads the resource when id is in req.params', function (done) {
            req.params['id'] = 1;
            resourceLoader(req, res, function () {
                chai_1.expect(req.models['Book']).to.deep.equal(book1);
                done();
            });
        });
        it("returns 401 unauthorized if resource does't belong to user", function (done) {
            req.params['id'] = 3;
            resourceLoader(req, res, next);
            chai_1.expect(res.statusCode).to.equal(401);
            done();
        });
    });
    describe('with redirect options', function () {
        beforeEach(function () {
            applyResourcefulCancanWithRedirects(req, res, next);
        });
        it('redirects to unauthorized url if resources is not authorized', function (done) {
            req.params['id'] = 3;
            var spy = sinon.spy(res, 'redirect');
            resourceLoader(req, res, next);
            chai_1.expect(spy.calledWith(unauthorizedUrl)).to.be.true;
            done();
        });
    });
});
