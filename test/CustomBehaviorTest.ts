import {Item, Order} from "./models/Order";
import {expect} from "chai";
import {Article} from "./models/Article";
import {Bytes32} from "./models/Bytes32";

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
describe('Custom behavorial tests', function () {

    it("Ignored (underline-prefix) attributes are not persisted", async () => {

        const item = new Item();
        item._article = new Article();
        item.articles = [new Article()];
        item.amount = 100;

        const order = new Order();
        order.items.push(item);

        await order.save();

        // load order from DB
        const pOrder = await Order.findOne<Order>(order._id);

        expect(pOrder.items[0]).to.haveOwnProperty("amount");
        expect(pOrder.items[0]).to.not.haveOwnProperty("_article");
        expect(pOrder.items[0]).to.not.haveOwnProperty("articles");

        // JSONfiy the created Order
        const json:any = order.toJSON(true);
        expect(json.items[0]).to.haveOwnProperty("amount");
        expect(json.items[0]).to.haveOwnProperty("_article");
        expect(json.items[0]).to.haveOwnProperty("articles");

        // JSONfiy the loaded Order
        const pJson:any = pOrder.toJSON(true);
        expect(pJson.items[0]).to.haveOwnProperty("amount");
        expect(pJson.items[0]).to.not.haveOwnProperty("_article");
        expect(pJson.items[0]).to.not.haveOwnProperty("articles");


        return true;
    });


    it("Hidden attributes are persisted but aren't visible", async () => {

        const order = new Order();
        order.paymentDetails = {
            creditCard: 342343223423423,
            cvc: 123
        };
        await order.save();

        const doc = order.toJSON();
        expect(order).to.haveOwnProperty("paymentDetails");
        expect(doc).to.not.haveOwnProperty("paymentDetails");


        return true;
    });


    it("Test custom Type parsing", async () => {

        const article = new Article();
        article.customType = new Bytes32("test");
        await article.save();

        const articleLoaded = await Article.findOne<Article>({ _id: article._id });
        expect(articleLoaded.customType).to.be.instanceOf(Bytes32);
    });

});
