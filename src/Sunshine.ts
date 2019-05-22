import {MongoClient, Collection, Db} from "mongodb";

/**
 *  Sunshine DAO Connector
 *
 *  @ Michael Hasler
 */
export class Sunshine{

    protected static db:Db;
    protected static properties;
    protected static isConnected:boolean = false;

    protected static reconnectTries: number = Number.MAX_VALUE;
    protected static reconnectInterval: number = 1000;

    static setEncryptionKey(key: string){
        Sunshine.properties.encryptionKey = key;
    }

    static getEncryptionKey(){
        return Sunshine.properties.encryptionKey;
    }

    static connect(hostname: string, username: string, password: string, database: string, options?: {
        reconnectTries: number,
        reconnectInterval: number
    }){
        return new Promise((resolve, reject) => {

            Sunshine.properties = {};

            let URI = "mongodb://";
            if (username && username.length != 0) {
                URI += username + ":" + password + "@";
            }
            URI += hostname + "/" + database;

            options = {
                reconnectTries: (options && options.reconnectTries) ? options.reconnectTries : Sunshine.reconnectTries,
                reconnectInterval: (options && options.reconnectInterval) ? options.reconnectInterval : Sunshine.reconnectInterval
            };

            MongoClient.connect(URI, options, function(err, db) {
                if (err) reject(err);
                Sunshine.db = db;
                Sunshine.isConnected = true;
                resolve(true);
            });
        });
    }

    static injectConnection(db: Db){
        this.db = db;
        this.isConnected = true;
    }

    static getConnection(){
        if (!Sunshine.isConnected) {
            throw new Error("No connection available :(");
        }
        return Sunshine.db;
    }

    static async disconnect():Promise<boolean>{
        await Sunshine.db.close();
        return true;
    }

}
