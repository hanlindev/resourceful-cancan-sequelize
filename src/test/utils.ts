import * as sinon from 'sinon';

export class User {
    constructor(
        public name: string,
        public email: string
    ) {}
}

export class Book {
    constructor(
        public title: string
    ) {}
}

export interface IMockModel<TModel> {
    findById?: (id: any) => TModel;
    findAll?: (options: any) => TModel[];
}

export interface IMockDb {
    User: IMockModel<User>;
    Book: IMockModel<Book>;
}

export let user1 = new User('test user 1', 'test1@example.com');
export let user2 = new User('test user 2', 'test2@example.com');
export let book = new Book('test book');
export let mockDb: IMockDb = {
    User: {
        findById: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction(user1);
            }
        }),
        findAll: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction([user1, user2]);
            }
        })
    },
    Book: {
        findById: sinon.stub().returns({
            then: (resultFunction) => {
                resultFunction(book);
            }
        })
    }
}
