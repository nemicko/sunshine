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
    private static mongoClient: MongoClient;

    protected static reconnectTries: number = Number.MAX_VALUE;
    protected static reconnectInterval: number = 1000;

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
                    Sunshine.properties.encryptionKey;

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
        await this.mongoClient.close();
        return true;
    }

}
