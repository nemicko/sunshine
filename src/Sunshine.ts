import { EventEmitter } from 'events';
import { MongoClient, Db, ClientSession, ClientSessionOptions } from 'mongodb';

/**
 *  Sunshine DAO Connector
 *
 *  @ Michael Hasler
 */
export class Sunshine {
    protected static db: Db;
    protected static properties;
    protected static isConnected: boolean = false;
    private static mongoClient: MongoClient;

    private static eventEmitter = new EventEmitter();

    static setEncryptionKey(key: string): void {
        Sunshine.properties.encryptionKey = key;
    }

    static getEncryptionKey(): string {
        return Sunshine.properties.encryptionKey;
    }

    static async connectURI(
        uri: string,
        encryptionKey?: string
    ): Promise<void> {
        Sunshine.properties = {};

        //eslint-disable-next-line no-useless-catch
        try {
            const mongoClient = await MongoClient.connect(uri);

            Sunshine.mongoClient = mongoClient;

            Sunshine.db = mongoClient.db(mongoClient.options.dbName);
            Sunshine.isConnected = true;

            if (encryptionKey)
                Sunshine.properties.encryptionKey = encryptionKey;
            return;
        } catch (error) {
            throw error;
        }
    }

    static async connect(
        hostname: string,
        username: string,
        password: string,
        database: string,
        encryptionKey?: string
    ): Promise<void> {
        Sunshine.properties = {};

        let URI = 'mongodb://';
        if (username && username.length != 0) {
            URI += username + ':' + password + '@';
        }
        URI += hostname + '/' + database;

        return this.connectURI(URI, encryptionKey);
    }

    static startSession(options?: ClientSessionOptions): ClientSession {
        return Sunshine.mongoClient.startSession(options);
    }

    static injectConnection(db: Db): void {
        this.db = db;
        this.isConnected = true;
    }

    static on(event: string, callback: (event) => void): void {
        this.eventEmitter.on(event, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static event(name: string, payload: any): void {
        this.eventEmitter.emit(name, payload);
    }

    static getConnection(): Db {
        if (!Sunshine.isConnected) {
            throw new Error('No connection available :(');
        }
        return Sunshine.db;
    }

    static async disconnect(): Promise<void> {
        await this.mongoClient.close();
    }
}
