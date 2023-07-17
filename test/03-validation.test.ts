/* eslint-disable @typescript-eslint/no-explicit-any */
import * as chai from 'chai';
import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import { Article } from './models/Article';
import { Customer } from './models/Customer';
import * as chaiAsPromised from 'chai-as-promised';
import {
    RequiredFieldError,
    InvalidDateValueError,
    InvalidFieldTypeError,
    InvalidNumberValueError,
    StringNotMatchingRegExpError,
} from '../src';
import { Order } from './models/Order';

chai.use(chaiAsPromised);

describe('Validation tests', () => {
    it('should throw error for missing required data', async () => {
        const article = new Article();

        await chai
            .expect(article.save())
            .to.eventually.be.rejectedWith(RequiredFieldError);
    });

    describe('Number validation tests', () => {
        it('should throw error for invalid objectId type', async () => {
            const order = new Order();
            (order as any).customer_id = '1234adasdas';

            await chai
                .expect(order.save())
                .to.eventually.be.rejectedWith(InvalidFieldTypeError);
        });

        it('should throw error for invalid number type', async () => {
            const article = new Article();
            article.name = 'Validation article name';
            (article as any).price = 'test price';

            await chai
                .expect(article.save())
                .to.eventually.be.rejectedWith(InvalidFieldTypeError);
        });

        it('should throw error value smaller than min', async () => {
            const article = new Article();
            article.name = 'Validation article name';
            article.price = 9;

            await chai
                .expect(article.save())
                .to.eventually.be.rejectedWith(InvalidNumberValueError);
        });

        it('should throw error value bigger than max', async () => {
            const article = new Article();
            article.name = 'Validation article name';
            article.price = 101;

            await chai
                .expect(article.save())
                .to.eventually.be.rejectedWith(InvalidNumberValueError);
        });
    });

    describe('String validation tests', () => {
        it('should throw error for invalid string type', async () => {
            const article = new Article();
            (article as any).name = new ObjectId();

            await chai
                .expect(article.save())
                .to.eventually.be.rejectedWith(InvalidFieldTypeError);
        });

        it('should throw error for not matching RegExp', async () => {
            const article = new Article();
            article.name = 'Test name with numbers 123';

            await chai
                .expect(article.save())
                .to.eventually.be.rejectedWith(StringNotMatchingRegExpError);
        });
    });

    describe('Date validation tests', () => {
        it('should throw error for invalid date type', async () => {
            const customer = new Customer();
            (customer as any).birth_date = 'test';

            await chai
                .expect(customer.save())
                .to.eventually.be.rejectedWith(InvalidFieldTypeError);
        });

        it('should throw error for invalid date format', async () => {
            const customer = new Customer();
            customer.birth_date = new Date('2022-03-36');

            await chai
                .expect(customer.save())
                .to.eventually.be.rejectedWith(InvalidFieldTypeError);
        });

        it('should throw error for date smaller than min value', async () => {
            const customer = new Customer();
            customer.birth_date = new Date('1989-12-31');

            await chai
                .expect(customer.save())
                .to.eventually.be.rejectedWith(InvalidDateValueError);
        });

        it('should throw error for date bigger than max value', async () => {
            const customer = new Customer();
            customer.birth_date = new Date('2011-01-01');

            await chai
                .expect(customer.save())
                .to.eventually.be.rejectedWith(InvalidDateValueError);
        });

        it('should validate date', async () => {
            const customer = new Customer();
            customer.birth_date = new Date('2000-03-31');

            await customer.save();

            expect(customer._id).to.be.instanceOf(ObjectId);
        });
    });

    it('should throw error for invalid boolean type', async () => {
        const article = new Article();
        article.name = 'Validation article name';
        (article as any).active = 1;

        await chai
            .expect(article.save())
            .to.eventually.be.rejectedWith(InvalidFieldTypeError);
    });

    it('should throw error for invalid email type', async () => {
        const customer = new Customer();
        customer.email = 'test';

        await chai
            .expect(customer.save())
            .to.eventually.be.rejectedWith(InvalidFieldTypeError);
    });

    it('should throw error for invalid email length', async () => {
        const customer = new Customer();
        customer.email = 'test.user@gmail.com' + 's'.repeat(256);

        await chai
            .expect(customer.save())
            .to.eventually.be.rejectedWith(InvalidFieldTypeError);
    });

    it('should throw error for invalid email length before @ symbol', async () => {
        const customer = new Customer();
        customer.email = 'test.user'.repeat(10) + '@gmail.com';

        await chai
            .expect(customer.save())
            .to.eventually.be.rejectedWith(InvalidFieldTypeError);
    });

    it('should throw error for invalid email domain length', async () => {
        const customer = new Customer();
        customer.email = 'test.user@gmail.' + 'com'.repeat(23);

        await chai
            .expect(customer.save())
            .to.eventually.be.rejectedWith(InvalidFieldTypeError);
    });

    it('should validate email', async () => {
        const customer = new Customer();
        customer.email = 'test.user@gmail.com';

        await customer.save();

        expect(customer._id).to.be.instanceOf(ObjectId);
    });
});
