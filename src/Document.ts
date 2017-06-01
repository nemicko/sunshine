import {ObjectID} from "mongodb";
import {Sunshine} from "./Sunshine";
import * as CryptoJS from "crypto-js";

const objectIdRe = /^[0-9a-fA-F]{24}$/;

/**
 *  Sunshine Document
 *
 *  Primitive "Document", as base for "Model" with attributes and
 *  control, behavioral properties
 *
 *  @ Michael Hasler
 */
export class Document{

    /**
     * Attributes which will not be saved
     */
    protected __ignoredAttributes:Array<string>;

    /**
     * Attributes which will not be saved
     * nor return when toObject/toJSON is called
     */
    protected __hiddenAttributes:Array<string>;

    /**
     * Autopopulate the given fields, when model
     * is loaded
     */
    public __autoPopulate:boolean;

    /**
     * Save timestamp on every update
     * @param data
     */
    public __updateOnSave: string;

    /**
     * Field encryption
     * @param data
     */
    public __encryptedFields: Array<string>;

    /**
     * Fields already encrypted
     */
    private __encrypted: Array<string>;

    constructor(data?: any){
        this.__autoPopulate = false;
        this.__ignoredAttributes = [];
        this.__hiddenAttributes = [];
        this.__encryptedFields = [];
    }

    /**
     * Elevate the given JSON data object
     * into Document class, by adopting all attributes
     *
     * @param data
     * @returns {Document}
     * @private
     */
    public __elevate(data){
        this.decryptDocument(data);
        this.upgradeObject(this, data);
        return this;
    }

    /**
     * Read attributes of update document
     * and adopt in target document.
     *
     * Encryption is applied if declared.
     * Datatypes are kept.
     * ObjectID are parsed if possbile.
     *
     * @param target
     * @param update
     * @returns {any}
     */
    private upgradeObject(target, update) {
        for (const propertyName in update) {

            // skip all dynamic properties
            if (propertyName.startsWith("_")
                && !propertyName.startsWith("_id")
                && !propertyName.startsWith("__encrypted")) {
                continue;
            }

            if (target[propertyName] instanceof ObjectID) {
                if (update[propertyName] instanceof ObjectID) {
                    target[propertyName] = update[propertyName];
                } else {
                    target[propertyName] = ObjectID.createFromHexString(update[propertyName]);
                }
            } else if (typeof target[propertyName] === "string") {
                target[propertyName] = update[propertyName];
            } else if (target[propertyName] instanceof Array) {
                target[propertyName] = update[propertyName].map((item) => {
                    return this.upgradeObject({}, item);
                });
            } else {
                if (typeof update[propertyName] === "string") {
                    if (objectIdRe.test(update[propertyName])) {
                        target[propertyName] = ObjectID.createFromHexString(update[propertyName]);
                    } else {
                        target[propertyName] = update[propertyName];
                    }
                } else {
                    target[propertyName] = update[propertyName];
                }
            }
        }
        return target;
    }

    public fetchDocument(document, populated: boolean = false, hidden: boolean = true) {
        const _doc = {};
        const filter = (populated)? "__" : "_";

        // in case document is ObjectID
        if (document instanceof ObjectID)
            return document;

        if (typeof(document) === "string")
            return document;

        for (var propertyName in document) {
            if (!propertyName.startsWith(filter)) {
                if (document[propertyName] instanceof ObjectID) {
                    _doc[propertyName] = document[propertyName];
                } else if (document[propertyName] instanceof Array) {
                    _doc[propertyName] = document[propertyName].map(item => {
                        return this.fetchDocument(item, populated);
                    });
                } else {
                    //console.log(typeof document[propertyName]);
                    if (document[propertyName] instanceof Document) {
                        if (this.__ignoredAttributes.indexOf(propertyName) == -1)
                            if (this.__hiddenAttributes.indexOf(propertyName) == -1 || !hidden)
                            _doc[propertyName] = this.fetchDocument(document[propertyName], populated);
                    } else {
                        if (this.__ignoredAttributes.indexOf(propertyName) == -1)
                            if (this.__hiddenAttributes.indexOf(propertyName) == -1 || !hidden)
                            _doc[propertyName] = document[propertyName];
                    }
                }
            } else {
                if (propertyName == "_id"){
                    _doc["_id"] = document._id;
                }
                if (propertyName == "__encrypted"){
                    if (document.__encrypted)
                        _doc['__encrypted'] = document.__encrypted;
                }
            }
        }
        return _doc;
    }

    protected encryptDocument(doc: any){
        if (this.__encryptedFields){
            doc.__encrypted = [];
            for(const field of this.__encryptedFields){
                doc[field] = this.encrypt(doc[field]);
                doc.__encrypted.push(field);
            }
        }
        if (doc.__encrypted.length == 0)
            delete doc.__encrypted;
    }

    protected decryptDocument(doc: any){
        if (doc.__encrypted){
            for(const field of doc.__encrypted){
                doc[field] = this.decrypt(doc[field]);
            }
        }
    }

    private decrypt(cipherText: string) {
        const bytes = CryptoJS.AES.decrypt(cipherText, Sunshine.getEncryptionKey());
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    private encrypt(clearText: string) {
        return CryptoJS.AES.encrypt(clearText, Sunshine.getEncryptionKey()).toString();
    };

    public toObject(populated?: boolean){
        return this.fetchDocument(this, populated);
    }

    public toJSON(populated?: boolean){
        return this.toObject(populated);
    }
}