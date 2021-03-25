/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import {Document} from "./Document";
import {Sunshine} from "./Sunshine";
import {EmbeddedModel} from "./EmbeddedModel";
import {ObjectID, Collection, FindOneOptions, FilterQuery, DeleteWriteOpResultObject} from "mongodb";

export class Model extends Document{

    // name of collection
    static _collection:string;
    _embedded:Array<string>;

    _id: ObjectID;

    constructor(data?: any){
        super(data);
    }

    save():Promise<boolean>{
        if (this.hasOwnProperty("_id")){
            return new Promise((resolve, reject) => {
                const _doc = this.fetchDocument(this, false, true, false);
                const collection = Sunshine.getConnection().collection((this.constructor as any)._collection);
                const timestamp = new Date();

                if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();
                this.encryptDocument(_doc);
                if (collection.replaceOne) {
                    collection.replaceOne({_id: this._id}, _doc, {upsert: true}, (err, result) => {
                        if (err) reject(err);
                        Model.emit("update", (this.constructor as any)._collection, timestamp);
                        resolve(true);
                    });
                } else {
                    collection.updateOne({_id: this._id}, _doc, {upsert: true}, (err, result) => {
                        if (err) reject(err)
                        Model.emit("update", (this.constructor as any)._collection, timestamp);
                        resolve(true);
                    });
                }
            });
        } else
            return this.create();
    }

    create():Promise<boolean>{
        return new Promise((resolve, reject) => {
            const _doc = this.fetchDocument(this, false, true, false);
            const collection = Sunshine.getConnection().collection((this.constructor as any)._collection);

            const timestamp = new Date();

            if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();

            this.encryptDocument(_doc);
            collection.insertOne(_doc, (err, result) => {
                if (err) reject(err);
                this._id = result.insertedId;
                Model.emit("insert", (this.constructor as any)._collection, timestamp);
                resolve(true);
            });
        });
    }

    static findOneDiscrete<T extends Model>(query, type?: { new() : T }, collection?: string):Promise<T> {
        return new Promise((resolve, reject) => {
            const _collection = (collection)? collection: this._collection;
            const timestamp = new Date();

            Sunshine.getConnection().collection(_collection).findOne(query, (err, result) => {

                Model.emit("query", _collection, timestamp);

                if (err) {
                    reject(err);
                    return;
                }
                if (!result || result === null) {
                    resolve(null);
                    return;
                }
                let t = null;
                if (type)
                    t = (new type()).__elevate(result);
                else
                    t = (new this()).__elevate(result);

                if (t._autoPopulate){
                    t.populateAll().then(success => {
                        resolve(t);
                    });
                } else {
                    resolve(t);
                }

            });
        });
    }


    static findOne<T extends Model>(query, options?: object):Promise<T> {
        const timestamp = new Date();

        return new Promise((resolve, reject) => {
            Sunshine.getConnection().collection(this._collection).findOne(query, options , (err, result) => {

                Model.emit("query", this._collection, timestamp);

                if (err) {
                    reject(err);
                    return;
                }
                if (!result || result === null) {
                    resolve(null);
                    return;
                }
                // parse doc
                const t = <T> (new this()).__elevate(result);

                // parse embedded
                if (this.prototype && this.prototype._embedded) {
                    for (const em of this.prototype._embedded) {
                        if (t[em] instanceof Array) {
                            t[em] = t[em].map(element => {
                                return new EmbeddedModel(element);
                            });
                        }
                    }
                }

                if (t.__autoPopulate){
                    t.populateAll().then(success => {
                        resolve(t);
                    });
                } else {
                    resolve(t);
                }
            });
        });
    }

    static find<T extends Model>(query, fields?: any, collection?: string):QueryPointer<T>{
        let _collection = (collection)? collection: this._collection;

        let queryPointer = Sunshine.getConnection().collection(_collection).find(query, {projection: fields});
        return new QueryPointer<T>(queryPointer, this);
    }

    static aggregate<T extends Model>(query, options?: any):QueryPointer<T>{
        let _collection = this._collection;

        let queryPointer = Sunshine.getConnection().collection(_collection).aggregate(query, options);
        return new QueryPointer<T>(queryPointer, this);
    }

    static group<T extends Model>(query):QueryPointer<T>{
        let _collection = this._collection;

        let queryPointer = (<any>Sunshine.getConnection()).collection(_collection).group(query);
        return new QueryPointer<T>(queryPointer, this);
    }

    static groupT<T extends Model>(query):Promise<Array<T>>{
        let _collection = this._collection;

        return new Promise((resolve, reject) => {
            let queryPointer = (<any>Sunshine.getConnection()).collection(_collection).group(query, {}, {}, results => {
                resolve(results);
            });
        });
    }

    /**
     *
     * @deprecated Please use updateOne, updateMany
     */
    static update(criteria: any, update: any, options?: any):Promise<any>{
        const _collection = this._collection;
        const timestamp = new Date();

        return new Promise((resolve, reject) => {
            Sunshine.getConnection()
                .collection(_collection)
                .update(criteria, update, options, function(err, result) {
                    if (err) reject (err);
                    Sunshine.getConnection()
                        .collection(_collection)
                        .update(criteria, {
                            $set: { updated : new Date() }
                        }, {}, function (err, result) {
                            Model.emit("query", _collection, timestamp);
                            resolve(result);
                        });
                });
        });
    }

    static updateOne(criteria: any, update: any, options?: any):Promise<any>{
        const _collection = this._collection;
        const timestamp = new Date();

        if (update.$set){
            update.$set.updated = new Date();
        } else {
            update.$set = {
                updated: new Date()
            }
        }

        return new Promise((resolve, reject) => {
            Sunshine.getConnection()
                .collection(_collection)
                .updateOne(criteria, update, options, function(err, result) {
                    if (err) reject (err);
                    Model.emit("query", _collection, timestamp);
                    resolve(result);
                });
        });
    }

    static updateMany(criteria: any, update: any, options?: any):Promise<any>{
        const _collection = this._collection;
        const timestamp = new Date();

        if (update.$set){
            update.$set.updated = new Date();
        } else {
            update.$set = {
                updated: new Date()
            }
        }

        return new Promise((resolve, reject) => {
            Sunshine.getConnection()
                .collection(_collection)
                .updateMany(criteria, update, options, function(err, result) {
                    if (err) reject (err);
                    Model.emit("query", _collection, timestamp);
                    resolve(result);
                });
        });
    }



    static collection():Collection{
        return Sunshine.getConnection().collection(this._collection);
    }

    async populate<T extends Model>(type: { new() : T }, _id: ObjectID,  name: string, collection: string): Promise<T>{
        let _name = "_" + name;
        if (this[_name]) {
            return this[_name]
        } else {
            this[_name] = await Model.findOneDiscrete<T>({ _id: _id }, type, collection);
        }
        return this[_name];
    }

    async populateMany<T extends Model>(type: { new() : T }, _ids: Array<ObjectID>,  name: string, collection: string): Promise<Array<T>>{
        let _name = "_" + name;
        if (this[_name]) {
            return this[_name]
        } else {
            this[_name] = await Model.find<T>({ _id : { $in: _ids }}, {},  collection).toArray(type);
        }
        return this[_name];
    }

    protected populatable(){
        return {};
    }

    /**
     * @deprecated Use deleteOne or deleteMany
     * @param query
     */
    static remove(query):Promise<boolean>{
        return new Promise((resolve, reject) => {
            let _collection = this._collection;

            Sunshine.getConnection().collection(_collection).remove(query, function(err, result){
                if (err) reject(err);
                resolve(<any>result);
            });
        });
    }

    /**
     * Deletes only 1 entry from the database
     * Can be used with object or ObjectId as a parameter
     * @param query
     */
    static deleteOne(query: FilterQuery<any> | ObjectID): Promise<DeleteWriteOpResultObject> {
        return new Promise((resolve, reject) => {
            let _query;
            if (query instanceof ObjectID) {
                _query = {_id: query}
            } else {
                _query = {...query}
            }

            let _collection = this._collection;
            Sunshine.getConnection().collection(_collection).deleteOne(_query, function(err, result){
                if (err) reject(err);
                resolve(<any>result);
            });
        });
    }

    /**
     * Deletes every document in the database that matches the query
     * @param query
     */
    static deleteMany(query): Promise<DeleteWriteOpResultObject> {
        return new Promise((resolve, reject) => {
            let _collection = this._collection;

            Sunshine.getConnection().collection(_collection).deleteMany(query, function(err, result){
                if (err) reject(err);
                resolve(<any>result);
            });
        });
    }

    // TODO: Remove double assing of attriubte
    public async populateAll():Promise<boolean>{
        let list = this.populatable();
        for (let key in this.populatable()) {
            let many = list[key].many;
            // If entry does not have reference set (null)
            if (!this[list[key].reference]) continue;
            if (!list[key].many) {
                let value = list[key];
                await this.populate(value.type, this[value.reference], key, value.collection);
            } else {
                let value = list[key];
                await this.populateMany(value.type, this[value.reference], key, value.collection);
            }
        }
        return true;
    }

    /**
     * Emit update/query events
     * @private
     */
    private static emit(event: string, collection: string, timestamp){
        Sunshine.event(event, {
            collection: collection, runtime: (new Date()).getTime() - timestamp.getTime()
        });
    }

}

export class QueryPointer<T extends Model>{

    private _queryPointer:any;
    private _document:any;
    private _timestamp: Date;

    constructor(queryPointer: any, document: any){
        this._queryPointer = queryPointer;
        this._document = document;
        this._timestamp = new Date();
    }

    public sort(query: object):QueryPointer<T>{
        this._queryPointer.sort(query);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public limit(limit: number):QueryPointer<T>{
        this._queryPointer.limit(limit);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public skip(limit: number):QueryPointer<T>{
        this._queryPointer.skip(limit);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public collation(properties: {
        locale?: string,
        caseLevel?: boolean,
        caseFirst?: string,
        strength?: number,
        numericOrdering?: boolean,
        alternate?: string,
        maxVariable?: string,
        backwards?: boolean
    }): QueryPointer<T>{
        this._queryPointer.collation(properties);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public projection(fields: object):QueryPointer<T>{
        this._queryPointer.project(fields);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    // --- Close Pipeline -------------------------------------------------------

    public async count():Promise<number>{
        const result = await this._queryPointer.count();
        this.emit();
        return result;
    }

    public async toArray(type?: { new() : T }):Promise<Array<T>>{
        return await new Promise<Array<T>>((resolve, reject) => {
            let results = this._queryPointer.toArray((err, results) => {
                if (err) reject(err);

                this.emit();

                let promises = [];
                let documents = [];

                // empty result set, return empty array
                if (!results || results === null) {
                    resolve([]);
                    return;
                }

                if (type) {
                    results.forEach(doc => {
                        let t = (new type()).__elevate(doc);
                        if (t.__autoPopulate)
                            promises.push(t.populateAll());
                        documents.push(t);
                    });
                } else {
                    results.forEach(doc => {
                        let t = (new this._document()).__elevate(doc);
                        if (t.__autoPopulate)
                            promises.push(t.populateAll());
                        documents.push(t);
                    });
                }

                Promise.all(promises).then(result => {
                    resolve(documents);
                });
            });
        });
    }

    /**
     * Emit update/query events
     * @private
     */
    private emit(){
        Sunshine.event("query", {
            collection: this._queryPointer.namespace.collection, runtime: (new Date()).getTime() - this._timestamp.getTime()
        });
    }

}

/**
 * Decorator for Collection-name
 *
 * @param {string} name
 * @returns {(target) => any}
 * @constructor
 */
export function Collection(name: string) {
    return (target) => {
        target._collection = name;
    }
}

/**
 * Decorator for objectId type
 */
export function objectid() {
    return (target: any, key: string) => {
        let pKey = `_${key}`;

        // called at runtime to access (this) as instance of class
        let init = function (isGet: boolean) {
            return function (newVal?) {

                // Hidden property
                Object.defineProperty(this, pKey, {value: 0, enumerable: false, configurable: true, writable: true});

                // Public property
                Object.defineProperty(this, key, {
                    get: () => {
                        return this[pKey];
                    },
                    set: (val) => {
                        if (val instanceof ObjectID){
                            this[pKey] = val;
                        } else {
                            try {
                                this[pKey] = ObjectID.createFromHexString(val);
                            } catch (exception){
                                this[pKey] = null;
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                // Set / get values
                if (isGet) {
                    return this[key];
                } else {
                    this[key] = newVal;
                }
            };
        };

        // Will be called on first execution and replaced
        return Object.defineProperty(target, key, {
            get: init(true),
            set: init(false),
            enumerable: true,
            configurable: true
        });
    };
}
//}

/**
 * Reference embedded
 *
 * @param {boolean} value
 * @returns {(target: any, propertyKey: string, descriptor: PropertyDescriptor) => any}
 */
// TODO: Complete embedded parsing
export function embedded() {
    return function (target: any, propertyKey: string) {
        if (!target._embedded) target._embedded = [];
        target._embedded.push(propertyKey);
    };
}


/**
 * Reference encrypted
 *
 * @param {boolean} value
 * @returns {(target: any, propertyKey: string, descriptor: PropertyDescriptor) => any}
 */
// TODO: Complete embedded parsing
export function Encrypted() {
    return function (target: any, propertyKey: string) {
        if (!target.__encryptedFields) target.__encryptedFields = [];
        target.__encryptedFields.push(propertyKey);
    };
}


/*
export function Type() {
    return function (target: any, propertyKey: string) {
        if (!target.__dynamicTypes) target.__dynamicTypes = [];
        target.__dynamicTypes.push(propertyKey);
    };
}
 */

export function Type(parser: (value: any) => any) {
    return (target: any, key: string) => {
        if (!target.__dynamicTypes) target.__dynamicTypes = {};
        target.__dynamicTypes[key] = parser;
    };
}
