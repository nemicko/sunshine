process.env.NODE_ENV = 'test';

import {SunshineVirtual} from "../src/SunshineVirtual";

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
before(done => {

    try {
        SunshineVirtual.connectVirtual().then(success => {
            SunshineVirtual.setEncryptionKey("123456789");
            done();
        }).catch(exception => {
            console.log(exception);
        });
    } catch (exception){
        console.log(exception);
    }

});


after(function (done) {
    SunshineVirtual.disconnect();
    done();
});
