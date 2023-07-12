process.env.NODE_ENV = 'test';

import {SunshineVirtual} from "../src";

process.on('unhandledRejection', function(reason, p){
    console.log(reason);
    console.log(p);
});

process.on('uncaughtException', function (exception) {
    console.error(exception);
});

/*
/**
 * Preparing test environment with
 * Virtual MongoDB instance
 *
 */
before(async () => {
    try {
        await SunshineVirtual.connectVirtual({ encryptionKey: "123456789" });
    } catch (error){
        console.log(error)
    }
});


after((done) => {
    SunshineVirtual.disconnect();
    done();
});
