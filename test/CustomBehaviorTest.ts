import {Order} from "./models/Order";
import {expect} from "chai";

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

        const order = new Order();
        order.paymentDetails = {
            creditCard: 342343223423423,
            cvc: 123
        };

        return true;
    });


    it("Hidden attributes are persited but aren't visible", async () => {


        return true;
    });

});

