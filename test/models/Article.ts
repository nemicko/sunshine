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

import {
    boolean,
    Collection,
    Encrypted,
    Model,
    number,
    Required,
    text,
    Type
} from "../../src/Model"
import {Binary} from "mongodb";
import {Bytes32} from "./Bytes32";

@Collection("articles")
export class Article extends Model {

    @Required()
    @text({ match: /^[^0-9]+$/ })
    name: string;
    description: string | Object;

    binaryField: Binary;

    @number({ min: 10, max: 100 })
    price: number;
    stock: number;

    numberArray: Array<number>;
    arrayOfArrays: Array<Array<any>>;

    numberObjectArray: [{
        data: Array<number>
    }];

    @Encrypted()
    encryptedProperty: string;

    @Type((value) => { return new Bytes32(value); })
    customType: Bytes32;

    @boolean()
    active: boolean;
}

