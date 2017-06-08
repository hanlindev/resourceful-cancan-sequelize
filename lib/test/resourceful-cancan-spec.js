"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpMocks = require("node-mocks-http");
var chai_1 = require("chai");
var utils = require("./utils");
var user1 = utils.user1, user2 = utils.user2, book1 = utils.book1, book2 = utils.book2, book3 = utils.book3, mockDb = utils.mockDb, applyResourcefulCancan = utils.applyResourcefulCancan;
describe('resourcefulCancan', function () {
    var req;
    var res;
    var next = function () { };
    beforeEach(function () {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        applyResourcefulCancan(req, res, next);
    });
    it('adds db and cancan helpers to req', function () {
        chai_1.expect(req.db).to.not.null;
        chai_1.expect(req.can).to.not.null;
        chai_1.expect(req.cannot).to.not.null;
        chai_1.expect(req.authorize).to.not.null;
    });
    describe('req.can', function () {
        it('returns true when action is authorized', function () {
            chai_1.expect(req.can(user1, 'edit', book1)).to.be.true;
        });
        it('returns false when action is not authorized', function () {
            chai_1.expect(req.can(user2, 'view', book1)).to.be.false;
        });
    });
    describe('req.cannot', function () {
        it('returns false when action is authorized', function () {
            chai_1.expect(req.cannot(user1, 'edit', book1)).to.be.false;
        });
        it('returns true when action is not authorized', function () {
            chai_1.expect(req.cannot(user2, 'view', book1)).to.be.true;
        });
    });
    describe('req.authorize', function () {
        it('does not throw when action is authorized', function () {
            chai_1.expect(function () { req.authorize(user1, 'edit', book1); }).to.not.throw();
        });
        it('throws when action is not authorized', function () {
            chai_1.expect(function () { req.authorize(user2, 'view', book1); }).to.throw();
        });
    });
});
