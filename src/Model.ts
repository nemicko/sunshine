/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import { Document } from "./Document";
import { Sunshine } from "./Sunshine";
import { EmbeddedModel } from "./EmbeddedModel";
import { validateDataTypes, validateRequiredFields } from './Validators';
import {
    ObjectId,
    FindOptions,
    UpdateResult,
    DeleteResult,
    UpdateFilter,
    UpdateOptions,
    DistinctOptions,
    AggregateOptions,
    Collection as DatabaseCollection,
    IndexSpecification,
    CreateIndexesOptions,
    IndexDescription
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

    async save(): Promise<void> {
        const _doc = this.fetchDocument(this, false, true, false);
        const collection = Sunshine.getConnection().collection((this.constructor as any)._collection);
        const timestamp = new Date();

        // Set default values if there are any and values are not existing
        this.setDefaultValueIfEmpty(_doc);

        // Check fields which are set as required
        if (this.__requiredFields?.length)
            validateRequiredFields(_doc, this.__requiredFields);

        validateDataTypes(_doc, this);

        if (this.__updateOnSave)
            _doc[this.__updateOnSave] = new Date();

        this.encryptDocument(_doc);

        // Remove prefixed helper variables before save
        Object.entries(_doc).forEach(([key]) => {
            if (key !== '__updateOnSave' && key.includes('__')) {
                delete _doc[key]
            }
        })

        if (this.hasOwnProperty("_id")) {
            if (collection.replaceOne) {
                try {
                    await collection.replaceOne({ _id: this._id }, _doc, { upsert: true });
                    Model.emit("update", (this.constructor as any)._collection, timestamp);
                    return;
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
            await this.create(_doc, collection, timestamp);
    }

    async create(_doc: any, collection: DatabaseCollection, timestamp: Date): Promise<void> {
        try {
          const result = await collection.insertOne(_doc);
          this._id = result.insertedId;
          Model.emit("insert", (this.constructor as any)._collection, timestamp);
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

    static find<T extends Model>(query: Query, options?: FindOptions, collection?: string): QueryPointer<T> {
        const _collection = (collection) ? collection : this._collection;

        const queryPointer = Sunshine.getConnection().collection(_collection).find(query, options);
        return new QueryPointer<T>(queryPointer, this);
    }

    static aggregate<T extends Model>(query: Query[], options?: AggregateOptions): QueryPointer<T> {
        const _collection = this._collection;

        const queryPointer = Sunshine.getConnection().collection(_collection).aggregate(query, options);
        return new QueryPointer<T>(queryPointer, this);
    }

    static async distinct(key: string, query: Query, options?: DistinctOptions): Promise<any[]> {
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

    static createIndex (indexSpec: IndexSpecification, options?: CreateIndexesOptions): Promise<string> {
        return Sunshine.getConnection().collection(this._collection).createIndex(indexSpec, options);
    }

    static createIndexes (indexSpecs: IndexDescription[], options?: CreateIndexesOptions): Promise<string[]> {
        return Sunshine.getConnection().collection(this._collection).createIndexes(indexSpecs, options);
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

    private setDefaultValueIfEmpty (_doc: any): void {
        if (this.__textFields?.length) {
            for (const field of this.__textFields) {
                if (!_doc[field.propertyKey] && field.defaultValue)
                    _doc[field.propertyKey] = field.defaultValue;
            }
        }

        if (this.__numberFields?.length) {
            for (const field of this.__numberFields)
                this.checkAndAddDefaultValue(_doc, field.propertyKey, field.defaultValue);
        }

        if (this.__dateFields?.length) {
            for (const field of this.__dateFields)
                this.checkAndAddDefaultValue(_doc, field.propertyKey, field.defaultValue);
        }
    }

    private checkAndAddDefaultValue(_doc: any, key: string, defaultValue: number | Date): void {
        if (!_doc.hasOwnProperty(key) && defaultValue?.toString())
            _doc[key] = defaultValue;
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
        if (!target.__objectIdFields)
            target.__objectIdFields = [];

        target.__objectIdFields.push(key);
    };
}

/**
 * Reference embedded
 *
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
 * @returns {(target: any, propertyKey: string, descriptor: PropertyDescriptor) => any}
 */
// TODO: Complete embedded parsing
export const Encrypted = () => {
    return function (target: Document, propertyKey: string) {
        if (!target.__encryptedFields) target.__encryptedFields = [];
        target.__encryptedFields.push(propertyKey);
    };
}

export const number = (data?: { min?: number, max?: number, defaultValue?: number }) => {
    return function (target: Document, propertyKey: string) {
        const { min, max, defaultValue } = data || {};
        if (!target.__numberFields)
            target.__numberFields = [];

        target.__numberFields.push({ propertyKey, min, max, defaultValue });
    }
}

export const text = (data?: { match?: RegExp, defaultValue?: string }) => {
    return function (target: Document, propertyKey: string) {
        const { match, defaultValue } = data || {};
        if (!target.__textFields)
            target.__textFields = [];

        target.__textFields.push({ propertyKey, match, defaultValue });
    }
}

export const boolean = () => {
    return function (target: Document, propertyKey: string) {
        if (!target.__booleanFields)
            target.__booleanFields = [];

        target.__booleanFields.push(propertyKey);
    }
}

export const email = () => {
    return function (target: Document, propertyKey: string) {
        if (!target.__emailFields)
            target.__emailFields = [];

        target.__emailFields.push(propertyKey);
    }
}

export const date = (data?: { min?: Date, max?: Date, defaultValue?: Date }) => {
    return function (target: Document, propertyKey: string) {
        const { min, max, defaultValue } = data || {};
        if (!target.__dateFields)
            target.__dateFields = [];

        target.__dateFields.push({ propertyKey, min, max, defaultValue });
    }
}

export const Required = () => {
    return function (target: Document, propertyKey: string) {
        if (!target.__requiredFields)
            target.__requiredFields = [];

        target.__requiredFields.push(propertyKey);
    }
}

export const Type = (parser: (value: any) => any) => {
    return (target: any, key: string) => {
        if (!target.__dynamicTypes) target.__dynamicTypes = {};
        target.__dynamicTypes[key] = parser;
    };
}
