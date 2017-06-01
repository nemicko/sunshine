import {MongoClient, Collection} from "mongodb";

/**
 *  Sunshine DAO Connector
 *
 *  @ Michael Hasler
 */
export class Sunshine{

    protected static db;
    protected static properties;
    protected static isConnected:boolean = false;

    static setEncryptionKey(key: string){
        Sunshine.properties.encryptionKey = key;
    }

    static getEncryptionKey(){
        return Sunshine.properties.encryptionKey;
    }

    static connect(hostname: string, username: string, password: string, database: string){
        return new Promise((resolve, reject) => {

            Sunshine.properties = {};

            let URI = "mongodb://";
            if (username && username.length != 0) {
                URI += username + ":" + password + "@";
            }
            URI += hostname + "/" + database;

            MongoClient.connect(URI, function(err, db) {
                if (err) reject(err);
                Sunshine.db = db;
                Sunshine.isConnected = true;
                resolve(true);
            });
        });
    }

    static getConnection(){
        if (!Sunshine.isConnected) return null;
        return Sunshine.db;
    }

    static disconnect():boolean{
        return Sunshine.db.close();
    }

}