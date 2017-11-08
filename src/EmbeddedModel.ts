/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import {ObjectID} from "mongodb";
import {Document} from "./Document";

export class EmbeddedModel extends Document{

    _id: ObjectID;

    constructor(data?: any){
        super();
        this._id = new ObjectID();
        if (data) this.__elevate(data);
    }

}