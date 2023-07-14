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
import {ObjectId} from "mongodb";
import {Customer} from "./Customer";
import {EmbeddedModel} from "../../src";
import {Collection, embedded, Model, objectid} from "../../src";

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
        this.__ignoredAttributes = ['_article', 'articles'];
    }

    _id: ObjectId;

    article_id: ObjectId;
    _article?: Article;
    articles?: Array<Article>;

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

    @embedded()
    items : Array<Item>;
    number: string;

    @objectid()
    customer_id: ObjectId;
    _customer?: Customer;

    paymentDetails: {
        creditCard: number,
        cvc: number
    };

    attributes: any;

    article_ids: ObjectId[];
    _articles?: Article[];

    created: Date;
    updated: Date;

    protected populatable(){
        return {
            customer: {
                type: Customer,
                collection: "customers",
                reference: "customer_id",
                many: false
            },
            articles: {
                type: Article,
                collection: 'articles',
                reference: 'article_ids',
                many: true
            }
        }
    }

}
