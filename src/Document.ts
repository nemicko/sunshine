/* eslint-disable @typescript-eslint/no-explicit-any */
import { Sunshine } from './Sunshine';
import * as CryptoJS from 'crypto-js';
import { Binary, ObjectId } from 'mongodb';

const objectIdRe = /^[0-9a-fA-F]{24}$/;

/**
 *  Sunshine Document
 *
 *  Primitive "Document", as base for "Model" with attributes and
 *  control, behavioral properties
 *
 *  @ Michael Hasler
 */
export class Document {
    /**
     * Attributes which will not be saved
     */
    protected __ignoredAttributes: Array<string>;

    /**
     * Attributes which will not be saved
     * nor existing when toObject/toJSON is called
     */
    protected __hiddenAttributes: Array<string>;

    /**
     * Autopopulate the given fields, when model
     * is loaded
     */
    public __autoPopulate: boolean = false;

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
     * Required fields
     * @param data
     */
    public __requiredFields: Array<string>;

    /**
     * Number fields
     * @param data
     */
    public __numberFields: {
        propertyKey: string;
        min?: number;
        max?: number;
        defaultValue?: number;
    }[];

    /**
     * Text fields
     * @param data
     */
    public __textFields: {
        propertyKey: string;
        match?: RegExp;
        defaultValue?: string;
    }[];

    /**
     * Boolean fields
     * @param data
     */
    public __booleanFields: Array<string>;

    /**
     * Boolean fields
     * @param data
     */
    public __objectIdFields: Array<string>;

    /**
     * Boolean fields
     * @param data
     */
    public __emailFields: Array<string>;

    /**
     * Boolean fields
     * @param data
     */
    public __dateFields: {
        propertyKey: string;
        min?: Date;
        max?: Date;
        defaultValue?: Date;
    }[];

    constructor() {}

    /**
     * Elevate the given JSON data object
     * into Document class, by adopting all attributes
     *
     * @param data
     * @returns {Document}
     * @private
     *
     * @deprecated Please use alternate save parsing
     */
    public __elevate(data) {
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
     * ObjectId are parsed if possbile.
     *
     * @param target
     * @param update
     * @returns {any}
     */
    private upgradeObject(target, update) {
        for (const propertyName in update) {
            // skip all dynamic properties
            if (
                propertyName.startsWith('_') &&
                !propertyName.startsWith('_id')
            ) {
                continue;
            }

            if (target[propertyName] instanceof ObjectId) {
                if (update[propertyName] instanceof ObjectId) {
                    target[propertyName] = update[propertyName];
                } else {
                    target[propertyName] = ObjectId.createFromHexString(
                        update[propertyName]
                    );
                }
            } else if (typeof update === 'string') {
                target = update;
            } else if (typeof target[propertyName] === 'string') {
                target[propertyName] = update[propertyName];
            } else if (target[propertyName] instanceof Array) {
                target[propertyName] = update[propertyName].map((item) => {
                    return this.upgradeObject({}, item);
                });
            } else if (typeof update[propertyName] === 'string') {
                if (objectIdRe.test(update[propertyName])) {
                    target[propertyName] = ObjectId.createFromHexString(
                        update[propertyName]
                    );
                } else if (
                    target.__dynamicTypes &&
                    target.__dynamicTypes[propertyName]
                ) {
                    target[propertyName] = target.__dynamicTypes[propertyName](
                        update[propertyName]
                    );
                } else {
                    target[propertyName] = update[propertyName];
                }
            } else if (update[propertyName] instanceof Date) {
                target[propertyName] = update[propertyName];
            } else if (typeof target[propertyName] === 'object') {
                target[propertyName] = this.upgradeObject(
                    target[propertyName],
                    update[propertyName]
                );
            } else {
                target[propertyName] = update[propertyName];
            }
        }
        return target;
    }

    /**
     *
     * @param document
     * @param {boolean} populated: (true) All ignored attributes are available
     * @param {boolean} hidden: (true) All hidden attributes are available
     * @param ignored
     * @returns {any}
     */
    public fetchDocument(
        document,
        populated: boolean = false,
        hidden: boolean = false,
        ignored: boolean = true
    ) {
        const _doc = {};
        const filter = populated ? '__' : '_';

        // in case document is ObjectId
        if (document instanceof ObjectId) return document;

        if (
            typeof document === 'string' ||
            typeof document === 'number' ||
            typeof document === 'boolean' ||
            document === null
        )
            return document;

        if (document instanceof Array) {
            return document.map((value) =>
                this.fetchDocument(value, populated, hidden, ignored)
            );
        }

        for (const propertyName in document) {
            if (!propertyName.startsWith(filter)) {
                if (document.__ignoredAttributes && !ignored)
                    if (
                        document.__ignoredAttributes.indexOf(propertyName) != -1
                    )
                        continue;

                if (document.__hiddenAttributes && !hidden)
                    if (document.__hiddenAttributes.indexOf(propertyName) != -1)
                        continue;

                if (document[propertyName] instanceof ObjectId) {
                    _doc[propertyName] = document[propertyName];
                } else if (document[propertyName] instanceof Array) {
                    _doc[propertyName] = document[propertyName].map((item) => {
                        return this.fetchDocument(
                            item,
                            populated,
                            hidden,
                            ignored
                        );
                    });
                } else {
                    if (document[propertyName] instanceof Document) {
                        _doc[propertyName] = this.fetchDocument(
                            document[propertyName],
                            populated,
                            hidden,
                            ignored
                        );
                    } else if (document[propertyName] instanceof Number) {
                        _doc[propertyName] = document[propertyName];
                    } else if (document[propertyName] instanceof Date) {
                        _doc[propertyName] = document[propertyName];
                    } else if (document[propertyName] instanceof Binary) {
                        _doc[propertyName] = document[propertyName];
                    } else if (document[propertyName] instanceof Object) {
                        if (
                            document.__dynamicTypes &&
                            document.__dynamicTypes[propertyName]
                        ) {
                            _doc[propertyName] =
                                document[propertyName].toString();
                        } else {
                            _doc[propertyName] = this.fetchDocument(
                                document[propertyName]
                            );
                        }
                    } else {
                        // any other type
                        _doc[propertyName] = document[propertyName];
                    }
                }
            } else {
                if (propertyName == '_id') {
                    _doc['_id'] = document._id;
                }
            }
        }
        return _doc;
    }

    protected encryptDocument(doc: any) {
        if (this.__encryptedFields) {
            for (const field of this.__encryptedFields) {
                doc[field] = this.encrypt(doc[field]);
            }
        }
    }

    protected decryptDocument(doc: any) {
        if (this.__encryptedFields) {
            for (const field of this.__encryptedFields) {
                // only if not null
                if (doc[field]) doc[field] = this.decrypt(doc[field]);
            }
        }
    }

    private decrypt(cipherText: string) {
        const bytes = CryptoJS.AES.decrypt(
            cipherText,
            Sunshine.getEncryptionKey()
        );
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    private encrypt(clearText: string) {
        return CryptoJS.AES.encrypt(
            clearText,
            Sunshine.getEncryptionKey()
        ).toString();
    }

    public toObject(populated?: boolean) {
        return this.fetchDocument(this, populated, false, true);
    }

    public toJSON(populated?: boolean) {
        return this.toObject(populated);
    }
}
