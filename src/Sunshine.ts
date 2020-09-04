import {MongoClient, Collection, Db} from "mongodb";
import {EventEmitter} from "events";

/**
 *  Sunshine DAO Connector
 *
 *  @ Michael Hasler
 */
export class Sunshine{

    protected static db:Db;
    protected static properties;
    protected static isConnected:boolean = false;
    private static mongoClient: MongoClient;

    private static eventEmitter = new EventEmitter();

    static setEncryptionKey(key: string){
        Sunshine.properties.encryptionKey = key;
    }

    static getEncryptionKey(){
        return Sunshine.properties.encryptionKey;
    }

    static connect(hostname: string, username: string, password: string, database: string, encryptionKey?: string){
        return new Promise((resolve, reject) => {
            Sunshine.properties = {};

            let URI = "mongodb://";
            if (username && username.length != 0) {
                URI += username + ":" + password + "@";
            }
            URI += hostname + "/" + database;

            const options = {
                useUnifiedTopology: true,
                useNewUrlParser: true
            };

            MongoClient.connect(URI, options, function(err, mongoClient) {
                if (err) reject(err);
                Sunshine.mongoClient = mongoClient;
                Sunshine.db = mongoClient.db(database);
                Sunshine.isConnected = true;

                if (encryptionKey)
                    Sunshine.properties.encryptionKey = encryptionKey;

                resolve(true);
            });
        });
    }

    static injectConnection(db: Db){
        this.db = db;
        this.isConnected = true;
    }

    static on(event: string, callback: (event) => void){
        this.eventEmitter.on(event, callback);
    }

    static event(name: string, payload: any){
        this.eventEmitter.emit(name, payload);
    }

    static getConnection(){
        if (!Sunshine.isConnected) {
            throw new Error("No connection available :(");
        }
        return Sunshine.db;
    }

    static async disconnect():Promise<boolean>{
        await this.mongoClient.close();
        return true;
    }

}
