/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import { Document } from "./Document"
import { Sunshine } from "./Sunshine"
import { EmbeddedModel } from "./EmbeddedModel"
import {
    ObjectId,
    FindOptions,
    UpdateResult,
    DeleteResult,
    UpdateFilter,
    UpdateOptions,
    DistinctOptions,
    AggregateOptions,
    Collection as DatabaseCollection
} from "mongodb"

type Query = { [key: string]: any }
export class Model extends Document {

    // name of collection
    static _collection: string;
    _embedded: Array<string>;

    _id: ObjectId;

    constructor(data?: any) {
        super(data);
    }

    async save(): Promise<boolean> {
        if (this.hasOwnProperty("_id")) {
            const _doc = this.fetchDocument(this, false, true, false);
            const collection = Sunshine.getConnection().collection((this.constructor as any)._collection);
            const timestamp = new Date();

            if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();
            this.encryptDocument(_doc);
            if (collection.replaceOne) {
                try {
                    await collection.replaceOne({ _id: this._id }, _doc, { upsert: true });
                    Model.emit("update", (this.constructor as any)._collection, timestamp);
                    return true;
                } catch (error) {
                    throw error;
                }
            }

            try {
                await collection.updateOne({ _id: this._id }, _doc, { upsert: true });
                Model.emit("update", (this.constructor as any)._collection, timestamp);
            } catch (error) {
                throw error;
            }
        }
        else
            return this.create();
    }

    async create(): Promise<boolean> {
        const _doc = this.fetchDocument(this, false, true, false);
        const collection = Sunshine.getConnection().collection((this.constructor as any)._collection);

        const timestamp = new Date();

        if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();

        this.encryptDocument(_doc);
        try {
          const result = await collection.insertOne(_doc);
          this._id = result.insertedId;
          Model.emit("insert", (this.constructor as any)._collection, timestamp);
          return true
        } catch (error) {
          throw error
        }
    }

    static async findOneDiscrete<T extends Model>(query, type?: { new(): T }, collection?: string): Promise<T> {
        const _collection = (collection) ? collection : this._collection;
        const timestamp = new Date();

        try {
          const result = await Sunshine.getConnection().collection(_collection).findOne(query);
          Model.emit("query", _collection, timestamp);
          if (!result)
            return null;

          let t: T;
          if (type)
            t = (new type()).__elevate(result);
          else
            t = <T>(new this()).__elevate(result);

          if (t.__autoPopulate) {
            await t.populateAll();
          }

          return t;
        } catch (error) {
          throw error
        }
    }


    static async findOne<T extends Model>(query, options?: FindOptions): Promise<T> {
        const timestamp = new Date();

        try {
            const result = await Sunshine.getConnection().collection(this._collection).findOne(query, options);
            Model.emit("query", this._collection, timestamp);
            if (!result)
                return null;

            // parse doc
            const t = <T>(new this()).__elevate(result);

            // parse embedded
            if (this.prototype?._embedded) {
                for (const em of this.prototype._embedded) {
                    if (t[em] instanceof Array) {
                        t[em] = t[em].map(element => {
                            return new EmbeddedModel(element);
                        });
                    }
                }
            }

            if (t.__autoPopulate) {
                await t.populateAll()
            }
            return t;
        } catch (error) {
            throw error;
        }

    }

    static find<T extends Model>(query, options?: FindOptions, collection?: string): QueryPointer<T> {
        const _collection = (collection) ? collection : this._collection;

        const queryPointer = Sunshine.getConnection().collection(_collection).find(query, options);
        return new QueryPointer<T>(queryPointer, this);
    }

    static aggregate<T extends Model>(query: Query[], options?: AggregateOptions): QueryPointer<T> {
        const _collection = this._collection;

        const queryPointer = Sunshine.getConnection().collection(_collection).aggregate(query, options);
        return new QueryPointer<T>(queryPointer, this);
    }

    static async distinct<T extends Model>(key: string, query: Query[], options?: DistinctOptions): Promise<T[]> {
        const _collection = this._collection;
        const timestamp = new Date();

        try {
            const result = await Sunshine.getConnection().collection(_collection).distinct(key, query, options);
            Model.emit("query", _collection, timestamp);

            return result;
        } catch (error) {
            throw error;
        }

    }

    static async updateOne<T extends Document>(criteria: Query, update: UpdateFilter<any>, options?: UpdateOptions): Promise<UpdateResult<T>> {
        const _collection = this._collection;
        const timestamp = new Date();

        update.$set = {
            updated: new Date(),
            ...update.$set
        }

        try {
            const result = await Sunshine.getConnection().collection(_collection).updateOne(criteria, update, options);
            Model.emit("query", _collection, timestamp);
            return result
        } catch (error) {
            throw error;
        }
    }

    static async updateMany(criteria: Query, update: UpdateFilter<any>, options?: UpdateOptions): Promise<UpdateResult> {
        const _collection = this._collection;
        const timestamp = new Date();

        update.$set = {
            updated: new Date(),
            ...update.$set
        }

        try {
            const result = await Sunshine.getConnection().collection(_collection).updateMany(criteria, update, options);
            Model.emit("query", _collection, timestamp);
            return result;
        } catch (error) {
            throw error;
        }
    }

    static collection(): DatabaseCollection {
        return Sunshine.getConnection().collection(this._collection);
    }

    async populate<T extends Model>(type: { new(): T }, _id: ObjectId, name: string, collection: string): Promise<T> {
        const _name = "_" + name;
        if (this[_name]) {
            return this[_name]
        }

        this[_name] = await Model.findOneDiscrete<T>({ _id: _id }, type, collection);

        return this[_name];
    }

    async populateMany<T extends Model>(type: { new(): T }, _ids: Array<ObjectId>, name: string, collection: string): Promise<Array<T>> {
        const _name = "_" + name;
        if (this[_name]) {
            return this[_name]
        }

        this[_name] = await Model.find<T>({ _id: { $in: _ids } }, {}, collection).toArray(type);

        return this[_name];
    }

    protected populatable() {
        return {};
    }

    /**
     * Deletes only 1 entry from the database
     * Can be used with object or ObjectId as a parameter
     * @param query
     */
    static async deleteOne(query: Query | ObjectId): Promise<DeleteResult> {
        const _query = query instanceof ObjectId
          ? { _id: query }
          : { ...query };

        const _collection = this._collection;
        return Sunshine.getConnection().collection(_collection).deleteOne(_query);
    }

    /**
     * Deletes every document in the database that matches the query
     * @param query
     */
    static async deleteMany(query: Query): Promise<DeleteResult> {
        const _collection = this._collection;

        return Sunshine.getConnection().collection(_collection).deleteMany(query);
    }

    // TODO: Remove double assing of attriubte
    public async populateAll(): Promise<void> {
        const list = this.populatable();
        for (let key in this.populatable()) {
            // If entry does not have reference set (null)
            if (!this[list[key].reference]) continue;
            if (!list[key].many) {
                const value = list[key];
                await this.populate(value.type, this[value.reference], key, value.collection);
            } else {
                const value = list[key];
                await this.populateMany(value.type, this[value.reference], key, value.collection);
            }
        }
    }

    /**
     * Emit update/query events
     * @private
     */
    private static emit(event: string, collection: string, timestamp) {
        Sunshine.event(event, {
            collection: collection, runtime: (new Date()).getTime() - timestamp.getTime()
        });
    }

}

export class QueryPointer<T extends Model> {

    private readonly _queryPointer: any;
    private readonly _document: any;
    private _timestamp: Date;

    constructor(queryPointer: any, document: any) {
        this._queryPointer = queryPointer;
        this._document = document;
        this._timestamp = new Date();
    }

    public sort(query: object): QueryPointer<T> {
        this._queryPointer.sort(query);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public limit(limit: number): QueryPointer<T> {
        this._queryPointer.limit(limit);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public skip(limit: number): QueryPointer<T> {
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
    }): QueryPointer<T> {
        this._queryPointer.collation(properties);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public projection(fields: object): QueryPointer<T> {
        this._queryPointer.project(fields);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    // --- Close Pipeline -------------------------------------------------------

    public async count(): Promise<number> {
        const result = await this._queryPointer.count();
        this.emit();
        return result;
    }

    public async toArray(type?: { new(): T }): Promise<Array<T>> {
        try {
            const results = await this._queryPointer.toArray();
            this.emit();

            const promises = [];
            const documents = [];

            // empty result set, return empty array
            if (!results)
                return [];

            results.forEach(doc => {
                const t = type
                  ? (new type()).__elevate(doc)
                  : (new this._document()).__elevate(doc);

                if (t.__autoPopulate)
                    promises.push(t.populateAll());

                documents.push(t);
            });

            await Promise.all(promises);
            return documents
        } catch (error) {
            throw error;
        }
    }

    /**
     * Emit update/query events
     * @private
     */
    private emit() {
        Sunshine.event("query", {
            collection: this._queryPointer.namespace.collection,
            runtime: (new Date()).getTime() - this._timestamp.getTime()
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
export const objectid = () => {
    return (target: any, key: string) => {
        let pKey = `_${ key }`;

        // called at runtime to access (this) as instance of class
        let init = function (isGet: boolean) {
            return function (newVal?) {

                // Hidden property
                Object.defineProperty(this, pKey, { value: 0, enumerable: false, configurable: true, writable: true });

                // Public property
                Object.defineProperty(this, key, {
                    get: () => {
                        return this[pKey];
                    },
                    set: (val) => {
                        if (val instanceof ObjectId) {
                            this[pKey] = val;
                        } else {
                            try {
                                this[pKey] = ObjectId.createFromHexString(val);
                            } catch (exception) {
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
export const embedded = () => {
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
export const Encrypted = () => {
    return function (target: any, propertyKey: string) {
        if (!target.__encryptedFields) target.__encryptedFields = [];
        target.__encryptedFields.push(propertyKey);
    };
}

export const Integer = () => {
    return function (target: any, propertyKey: string) {
        if (!target.__integerFields)
            target.__integerFields= [];

        target.__integerFields.push(propertyKey);
    }
}

export const Text = () => {
    return function (target: any, propertyKey: string) {
        if (!target.__textFields)
            target.__textFields= [];

        target.__textFields.push(propertyKey);
    }
}

export const Type = (parser: (value: any) => any) => {
    return (target: any, key: string) => {
        if (!target.__dynamicTypes) target.__dynamicTypes = {};
        target.__dynamicTypes[key] = parser;
    };
}
