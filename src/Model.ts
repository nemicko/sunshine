/**
 *  JDB - Light MongoDb DAO
 *
 *  MIT License
 *  Copyright (c) 2017 Michael Hasler
 */

import {Document} from "./Document";
import {Sunshine} from "./Sunshine";
import {ObjectID, Collection} from "mongodb";

export class Model extends Document{

    // name of collection
    static _collection:string;

    _id: ObjectID;

    constructor(data?: any){
        super(data);
    }

    save():Promise<boolean>{
        if (this.hasOwnProperty("_id")){
            return new Promise((resolve, reject) => {
                let _doc = this.fetchDocument(this, false, false);
                let collection = Sunshine.getConnection().collection((this.constructor as any)._collection);
                if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();

                this.encryptDocument(_doc);

                //console.log("saved");

                collection.replaceOne({ _id: this._id }, _doc, {upsert: true}, (err, result) => {
                    if (err) reject(err);
                    resolve(true);
                });
            });
        } else
            return this.create();
    }

    create():Promise<boolean>{
        return new Promise((resolve, reject) => {
            let _doc = this.fetchDocument(this, false, false);
            let collection = Sunshine.getConnection().collection((this.constructor as any)._collection);
            if (this.__updateOnSave) _doc[this.__updateOnSave] = new Date();

            this.encryptDocument(_doc);

            collection.insertOne(_doc, (err, result) => {
                if (err) reject(err);
                this._id = result.insertedId;
                resolve(true);
            });
        });
    }

    static findOneDiscrete<T extends Model>(query, type?: { new() : T }, collection?: string):Promise<T> {
        return new Promise((resolve, reject) => {
            let _collection = (collection)? collection: this._collection;
            Sunshine.getConnection().collection(_collection).findOne(query, (err, result) => {
                if (err) reject(err);
                if (!result) resolve(null);

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

    static findOne<T extends Model>(query, fields?: object):Promise<T> {
        return new Promise((resolve, reject) => {
            Sunshine.getConnection().collection(this._collection).findOne(query, fields, (err, result) => {
                if (err) reject(err);
                if (!result) resolve(null);

                let t = (new this()).__elevate(result);

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

    static find<T extends Model>(query, collection?: string):QueryPointer<T>{
        let _collection = (collection)? collection: this._collection;

        let queryPointer = Sunshine.getConnection().collection(_collection).find(query);
        return new QueryPointer<T>(queryPointer, this);
    }

    static aggregate<T extends Model>(query):QueryPointer<T>{
        let _collection = this._collection;

        let queryPointer = Sunshine.getConnection().collection(_collection).aggregate(query);
        return new QueryPointer<T>(queryPointer, this);
    }

    static group<T extends Model>(query):QueryPointer<T>{
        let _collection = this._collection;

        let queryPointer = Sunshine.getConnection().collection(_collection).group(query);
        return new QueryPointer<T>(queryPointer, this);
    }

    static groupT<T extends Model>(query):Promise<Array<T>>{
        let _collection = this._collection;

        return new Promise((resolve, reject) => {
            let queryPointer = Sunshine.getConnection().collection(_collection).group(query, {}, {}, results => {
                resolve(results);
            });
        })

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
            this[_name] = await Model.find<T>({ _id : { $in: _ids }}, collection).toArray(type);
        }
        return this[_name];
    }

    protected populatable(){
        return {};
    }

    static remove(query):Promise<boolean>{
        return new Promise((resolve, reject) => {
            let _collection = this._collection;

            Sunshine.getConnection().collection(_collection).remove(query, function(err, result){
                if (err) reject(err);
                resolve(err);
            });
        });
    }

    // TODO: Remove double assing of attriubte
    public async populateAll():Promise<boolean>{
        let list = this.populatable();
        for (let key in this.populatable()) {
            let many = list[key].many;
            if (!this[list[key].reference]) return true;
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

}

export class QueryPointer<T extends Model>{

    private _queryPointer:any;
    private _document:any;

    constructor(queryPointer: any, document: any){
        this._queryPointer = queryPointer;
        this._document = document;
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

    public async count():Promise<number>{
        return await this._queryPointer.count();
    }

    public projection(fields: object):QueryPointer<T>{
        this._queryPointer.projection(fields);
        return new QueryPointer<T>(this._queryPointer, this._document);
    }

    public async toArray(type?: { new() : T }):Promise<Array<T>>{
        return await new Promise<Array<T>>((resolve, reject) => {
            let results = this._queryPointer.toArray((err, results) => {
                if (err) reject(err);

                let promises = [];
                let documents = [];

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

                //results.map(doc => { return (new type()).__elevate(doc); } ));
                //resolve(results.map(doc => { return (new this._document()).__elevate(doc); }));
            });
        });
    }

}


export function Collection(name: string) {
    return (target) => {
        target._collection = name;
    }
}






