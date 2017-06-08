"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var _ = require("lodash");
var cancan2 = require("../resourceful-cancan-sequelize");
var User = (function () {
    function User(name, email) {
        this.name = name;
        this.email = email;
    }
    return User;
}());
exports.User = User;
var Book = (function () {
    function Book(id, title, userName) {
        this.id = id;
        this.title = title;
        this.userName = userName;
    }
    return Book;
}());
exports.Book = Book;
exports.user1 = new User('test user 1', 'test1@example.com');
exports.user2 = new User('test user 2', 'test2@example.com');
exports.book1 = new Book(1, 'test book 1', 'test user 1');
exports.book2 = new Book(2, 'test book 2', 'test user 1');
exports.book3 = new Book(3, 'test book 3', 'test user 2');
var _mockDb = {
    User: {
        findById: sinon.stub(),
        findAll: sinon.stub().returns({
            then: function (resultFunction) {
                resultFunction([_.clone(exports.user1), _.clone(exports.user2)]);
            }
        }),
    },
    Book: {
        findById: sinon.stub().returns({
            then: function (resultFunction) {
                resultFunction(_.clone(exports.book1));
            }
        }),
        findAll: sinon.stub(),
        build: sinon.stub().returns(_.clone(exports.book1))
    }
};
_mockDb.Book.findById['withArgs'](1).returns({
    then: function (resultFunction) {
        resultFunction(_.clone(exports.book1));
    }
});
_mockDb.Book.findById['withArgs'](3).returns({
    then: function (resultFunction) {
        resultFunction(_.clone(exports.book3));
    }
});
_mockDb.Book.findById['withArgs'](4).returns({
    then: function (resultFunction) {
        resultFunction(null);
    }
});
_mockDb.Book.findAll['withArgs']({
    limit: 30,
    offset: 0,
    where: {
        userName: 'test user 1'
    }
}).returns({
    then: function (resultFunction) {
        resultFunction([_.clone(exports.book1), _.clone(exports.book2)]);
    }
});
_mockDb.Book.findAll['withArgs']({
    limit: 30,
    offset: 0,
    where: {
        userName: 'test user 3'
    }
}).returns({
    then: function (resultFunction) {
        resultFunction([]);
    }
});
exports.mockDb = _mockDb;
function applyResourcefulCancan(req, res, next) {
    var middleware = cancan2.resourcefulCancan(exports.mockDb, [{
            entity: User,
            configure: function (cancan) {
                cancan.allow(User, 'manage', Book, function (user, book) { return user.name === book.userName; });
            }
        }], {
        userPrimaryKey: 'name',
        userForeignKey: 'userName'
    });
    middleware(req, res, next);
}
exports.applyResourcefulCancan = applyResourcefulCancan;
exports.notFoundUrl = 'http://example.com/not-found';
exports.unauthorizedUrl = 'http://example.com/unauthorized';
function applyResourcefulCancanWithRedirects(req, res, next) {
    var middleware = cancan2.resourcefulCancan(exports.mockDb, [{
            entity: User,
            configure: function (cancan) {
                cancan.allow(User, 'manage', Book, function (user, book) {
                    return user.name === book.userName;
                });
            }
        }], {
        userPrimaryKey: 'name',
        userForeignKey: 'userName',
        notFoundRedirect: exports.notFoundUrl,
        unauthorizedRedirect: exports.unauthorizedUrl
    });
    middleware(req, res, next);
}
exports.applyResourcefulCancanWithRedirects = applyResourcefulCancanWithRedirects;
