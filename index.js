'use strict'

const fs = require('fs')
const chokidar = require('chokidar')
const queue = [];
const MongoConnector = require('./lib/MongoConnector/MongoConnector.js')
const accessLogsProcessor = require('./lib/parsers/accessLogs.js')

const WATCH_PATH = process.env.WATCH_PATH || '.'
const COLLECTION_ACCESS_LOGS = 'accessLogs'
const CHECK_QUEUE_RETRY_INTERVAL = 1000

var collection = null
MongoConnector()
.then((connection)=> {
    collection = connection.collection(COLLECTION_ACCESS_LOGS)
    return
})

const watchHandler = (path) => {
    // if mongo is not ready, wait for reconnect and try to parse again the file
    if (!collection) {
        console.dir('DB not ready retrying in: ' + CHECK_QUEUE_RETRY_INTERVAL)
            setTimeout(processQueue,CHECK_QUEUE_RETRY_INTERVAL)
        queue.push(path)
        return;
    }

    console.dir('File ' + path + ' was added to the directory');
    accessLogsProcessor(path, collection)
    .catch((docPathErr) => {
        queue.push(docPathErr)
    })
}

const processQueue = () => {
    console.dir('Proccess queue')
    console.dir(collection)
    const insertedOK = []
    const insertedKO = []
    // set to null when database dies
    if (!collection) {
        console.dir('DB not ready retrying in: ' + CHECK_QUEUE_RETRY_INTERVAL)
        setTimeout(processQueue,CHECK_QUEUE_RETRY_INTERVAL)
        // queue.push(path)
        return;
    }
    queue.forEach((path) => {
        accessLogsProcessor(path, collection)
        .then((docInsertedOK) => {
            insertedOk.push(docInsertedOK)
        })
        .catch((docInsertedKO)=>{
            insertedKO.push(docInsertedKO)
        })
    })
    return
}

chokidar.watch(WATCH_PATH).on('add', watchHandler);

