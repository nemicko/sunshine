import { Sunshine } from "./Sunshine";
import { MongoMemoryServer } from 'mongodb-memory-server';

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

    static connectVirtual(port?: number, dbname?: string) {
        return new Promise((resolve, reject) => {

            Sunshine.properties = {};

            port = (port) ? port : 8000;
            const mongoServerInstance = new MongoMemoryServer({
                instance: {
                    port: port,
                    dbName: dbname ? dbname : "virtual",
                    storageEngine: "wiredTiger"
                }
            });

            mongoServerInstance.start().then(() => {
                this.connectURI(mongoServerInstance.getUri()).then(res => {
                    resolve(res)
                }).catch(err => {
                    reject(err);
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

}

