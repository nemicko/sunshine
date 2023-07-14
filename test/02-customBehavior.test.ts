import { expect } from 'chai';
import { Article } from './models/Article';
import { Bytes32 } from './models/Bytes32';
import { Item, Order } from './models/Order';

/**
 * Sunshine V1
 *
 * Copyright (c) Michael Hasler
 */

/**
 *  Testing custom behavior of documents
 *  __ignoredAttributes
 *  __hiddenAttributes
 *
 */
describe('Custom behavioral tests', () => {

    it('Ignored (underline-prefix) attributes are not persisted', async () => {

        const item = new Item();
        item._article = new Article();
        item.articles = [new Article()];
        item.amount = 100;

        const order = new Order();
        order.items.push(item);

        await order.save();

        // load order from DB
        const pOrder = await Order.findOne<Order>(order._id);

        expect(pOrder.items[0]).to.haveOwnProperty('amount');
        expect(pOrder.items[0]).to.not.haveOwnProperty('_article');
        expect(pOrder.items[0]).to.not.haveOwnProperty('articles');

        // JSONfiy the created Order
        const json:any = order.toJSON(true);
        expect(json.items[0]).to.haveOwnProperty('amount');
        expect(json.items[0]).to.haveOwnProperty('_article');
        expect(json.items[0]).to.haveOwnProperty('articles');

        // JSONfiy the loaded Order
        const pJson:any = pOrder.toJSON(true);
        expect(pJson.items[0]).to.haveOwnProperty('amount');
        expect(pJson.items[0]).to.not.haveOwnProperty('_article');
        expect(pJson.items[0]).to.not.haveOwnProperty('articles');


        return true;
    });


    it('Hidden attributes are persisted but aren\'t visible', async () => {

        const order = new Order();
        order.paymentDetails = {
            creditCard: 342343223423423,
            cvc: 123
        };
        await order.save();

        const doc = order.toJSON();
        expect(order).to.haveOwnProperty('paymentDetails');
        expect(doc).to.not.haveOwnProperty('paymentDetails');


        return true;
    });


    it('Test custom Type parsing', async () => {

        const article = new Article();
        article.name = 'Test custom type name'
        article.customType = new Bytes32('test');
        await article.save();

        const articleLoaded = await Article.findOne<Article>({ _id: article._id });
        expect(articleLoaded.customType).to.be.instanceOf(Bytes32);
    });

    describe('test indexing', () => {

        it('should create single index', async () => {
            const result = await Article.createIndex({ name: 1 })

            expect(result).to.equal('name_1');

            const indexes = await Article.collection().indexes();
            expect(indexes.length).to.be.greaterThan(0);
            expect(indexes.length).to.equal(2);
        });

        it('should create multiple indexes', async () => {
            const result = await Order.createIndexes([
                { key: { number: 1 } },
                { key: { customer_id: 1 } }
            ])

            expect(result.length).to.equal(2);

            const indexes = await Order.collection().indexes();
            expect(indexes.length).to.be.greaterThan(0);
            expect(indexes.length).to.equal(3);
        })
    })
});
