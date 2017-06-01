import {Sunshine} from "./Sunshine";
import {MongoClient} from "mongodb";

const MongoInMemory = require('mongo-in-memory');

/**
 *  Sunshine DAO Virtual Connector
 *
 *  With assistance of mongo-in-memory a virtual MongoDB instance is started
 *  and connected to it.
 *  All changes are NOT persisted, after application is closed, MongoDB instance
 *  ist shutdown and data deleted.
 *
 *  @ Michael Hasler
 */
export class SunshineVirtual extends Sunshine {

    static connectVirtual(port?: number) {
        return new Promise((resolve, reject) => {

            Sunshine.properties = {};

            port = (port) ? port : 8000;
            const mongoServerInstance = new MongoInMemory(port); //DEFAULT PORT is 27017

            mongoServerInstance.start((error, config) => {

                this.connect("localhost:" + port, "", "", "virtual").then(function(success){
                    resolve(true);
                });

            });

        });


    }

}

