import {Item, Order} from "./models/Order";
import {expect} from "chai";
import {Article} from "./models/Article";

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

    it("Ignored attributes are not persisted", async () => {

        const item = new Item();
        item._article = new Article();
        item.amount = 100;

        const order = new Order();
        order.items.push(item);

        await order.save();

        // load order from DB
        const pOrder = await Order.findOne<Order>(order._id);

        expect(pOrder.items[0]).to.haveOwnProperty("amount");
        expect(pOrder.items[0]).to.not.haveOwnProperty("_article");

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

});
