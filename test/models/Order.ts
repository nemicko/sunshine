/**
 * Sunshine
 *
 * Copyright (c) 2017 Michael Hasler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the right
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH T
 */

import {Article} from "./Article";

import {ObjectID} from "mongodb";
import {Customer} from "./Customer";

import {EmbeddedModel} from "../../src/EmbeddedModel";
import {Collection, Model} from "../../src/Model";

export declare type Log = {
    type: string,
    timestamp: Date,
    success: boolean,
    data: any,
    error: any,
    state?: number
}

export class Item extends EmbeddedModel{

    constructor(data?: any){
        super(data);
        this.__ignoredAttributes = ['_article'];
    }

    _id: ObjectID;

    article_id: ObjectID;
    _article?: Article;

    amount: number;
    netValue: number;
    grossValue: number;

}

@Collection("orders")
export class Order extends Model {

    constructor(){
        super();
        this.items = [] as any;
        this.created = new Date();
        this.updated = new Date();

        this.__hiddenAttributes = ['paymentDetails'];
    }

    items : Array<Item>;
    number: string;

    customer_id: ObjectID;
    _customer?: Customer;

    paymentDetails: {
        creditCard: number,
        cvc: number
    };

    created: Date;
    updated: Date;

    protected populatable(){
        return {
            customer:{
                type: Customer,
                collection: "customers",
                reference: "customer_id",
                many: false
            }
        }
    }

}