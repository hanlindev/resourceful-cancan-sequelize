import * as express from 'express';
import * as httpMocks from 'node-mocks-http';
import {expect} from 'chai';
import * as cancan from 'cancan';
import * as _ from 'lodash';

import * as cancan2 from '../resourceful-cancan-sequelize';
import {IMockDb, User} from './utils';
import * as utils from './utils';
let {
    User,
    Book,
    user1,
    user2,
    book,
    mockDb,
    applyResourcefulCancan
} = utils;

describe('resourcefulCancan', () => {
    let req: cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>;
    let res: express.Response;
    let next = function() {};

    beforeEach(() => {
        req = <cancan2.RequestWithCancan<IMockDb, cancan2.IControllerModels>>
            httpMocks.createRequest();
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
