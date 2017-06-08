import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import {expect} from 'chai';
import * as Cancan from 'cancan';
import * as _ from 'lodash';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {IMockDb, CancanRequest} from './utils';
import * as utils from './utils';
let {
    user1,
    user2,
    book1,
    book2,
    book3,
    mockDb,
    applyResourcefulCancan
} = utils;

describe('resourcefulCancan', () => {
    let req: CancanRequest;
    let res: express.Response;
    let next = function() {};

    beforeEach(() => {
        req = (httpMocks.createRequest() as any) as CancanRequest;
        res = httpMocks.createResponse();
        applyResourcefulCancan(req, res, next);
    });

    it('adds db and cancan helpers to req', () => {
        expect(req.db).to.not.null;
        expect(req.can).to.not.null;
        expect(req.cannot).to.not.null;
        expect(req.authorize).to.not.null;
    });

    describe('req.can', () => {
        it('returns true when action is authorized', () => {
            expect(req.can(user1, 'edit', book1)).to.be.true;
        });
        it('returns false when action is not authorized', () => {
            expect(req.can(user2, 'view', book1)).to.be.false;
        })
    });

    describe('req.cannot', () => {
        it('returns false when action is authorized', () => {
            expect(req.cannot(user1, 'edit', book1)).to.be.false;
        });
        it('returns true when action is not authorized', () => {
            expect(req.cannot(user2, 'view', book1)).to.be.true;
        });
    });

    describe('req.authorize', () => {
        it('does not throw when action is authorized', () => {
            expect(() => {req.authorize(user1, 'edit', book1)}).to.not.throw();
        });
        it('throws when action is not authorized', () => {
            expect(() => {req.authorize(user2, 'view', book1)}).to.throw();
        });
    });
});
