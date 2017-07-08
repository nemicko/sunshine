import {Order} from "./models/Order";
import {expect} from "chai";
import {ObjectID} from "mongodb";
import {Customer} from "./models/Customer";

/**
 * Sunshine V1
 *
 * Copyright (c) Michael Hasler
 */
describe('Basic attribute persistence tests', function () {

    it("Creating DocumentModel and extracting Document", async () => {

        let order = new Order();
        order.customer_id = ObjectID.createFromHexString("58f0c0ac235ea70d83e6c672");
        order._customer = new Customer();
        order._customer.firstname = "Michael";

        await order.save();

        let doc = order.toObject(true);

        return;
    });

    it("Testing correct type persistance", async () => {

        let order = new Order();
        order.customer_id = ObjectID.createFromHexString("58f0c0ac235ea70d83e6c672");
        order._customer = new Customer();
        order._customer.firstname = "Michael";
        (order as any).testString = "Hello";
        (order as any).num = 232343.2342342;

        await order.save();

        expect(order.created).to.be.an("Date");
        expect(order.customer_id).to.be.instanceof(ObjectID);
        expect((order as any).testString).to.be.an("string");
        expect((order as any).num).to.be.an("number");

        return;
    });

    it("Properties are updated correctly", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        await customer.save();

        const update = {
            _id: customer._id.toString(),
            firstname: "Markus",
        };

        customer.__elevate(update);

        expect(customer._id).to.be.instanceof(ObjectID);

        await customer.save();

        expect(customer.firstname).to.be.equal("Markus");

        return;
    });

    it("Query non existing documents (handling of empty - null results)", async () => {

        let customer = await Customer.findOne({ _id: "null" });

        expect(customer).to.be.null;

    });

});

