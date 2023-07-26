/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import { ObjectId } from 'mongodb';
import { Document } from './Document';

export class EmbeddedModel extends Document {
    _id: ObjectId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data?: any) {
        super();
        this._id = new ObjectId();
        if (data) this.__elevate(data);
    }
}
