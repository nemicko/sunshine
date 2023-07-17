import { Sunshine } from './Sunshine';
import { MongoMemoryServer } from 'mongodb-memory-server';

type VirtualConnectionData = {
    port?: number;
    dbname?: string;
    encryptionKey?: string;
};
/**
 *  Sunshine DAO Virtual Connector
 *
 *  With assistance of mongo-in-memory a virtual MongoDB instance is started
 *  and connected.
 *  All changes are NOT persisted, after application exit, MongoDB instance
 *  is shutdown and data deleted.
 *
 *  @ Michael Hasler
 */
export class SunshineVirtual extends Sunshine {
    static async connectVirtual(data?: VirtualConnectionData): Promise<void> {
        //eslint-disable-next-line prefer-const
        let { port, dbname, encryptionKey } = data || {};
        Sunshine.properties = {};

        port = port ? port : 8000;
        const mongoServerInstance = new MongoMemoryServer({
            instance: {
                port: port,
                dbName: dbname ? dbname : 'virtual',
                storageEngine: 'wiredTiger',
            },
        });

        //eslint-disable-next-line no-useless-catch
        try {
            await mongoServerInstance.start();
            await this.connectURI(mongoServerInstance.getUri(), encryptionKey);
        } catch (error) {
            throw error;
        }
    }
}
