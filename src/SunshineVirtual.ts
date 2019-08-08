import {Sunshine} from "./Sunshine";
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
                    dbName: dbname ? dbname : "virtual"
                }
            });

            mongoServerInstance.getConnectionString().then(async (connectionString) => {
                const port = await mongoServerInstance.getPort();
                const dbPath = await mongoServerInstance.getDbPath();
                const dbName = await mongoServerInstance.getDbName();


                this.connect("localhost" + ":" + port,  "", "", dbName).then(function(success){
                    resolve(success);
                });

            });

        });


    }

}

