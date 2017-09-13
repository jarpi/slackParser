'use strict'

const fs = require('fs')
const chokidar = require('chokidar')
const readline = require('readline')
const queue = [];
const MongoConnector = require('./lib/MongoConnector/MongoConnector.js')
const accessLogsProcessor = require('./lib/parsers/accessLogs.js')

const WATCH_PATH = process.env.WATCH_PATH || '.'
const COLLECTION_ACCESS_LOGS = 'accessLogs'
const CHECK_QUEUE_RETRY_INTERVAL = 1000

var collection = null
// use await instead
MongoConnector()
.then((connection)=> {
    connection.on('close', () => {
        console.dir('Connection to Mongo closed')
    })
    connection.on('reconnect', () => {
        console.dir('Connection to Mongo reopened')
    })

    collection = connection.collection(COLLECTION_ACCESS_LOGS)
    return
})

const watchHandler = (path, event) => {
    // if mongo is not ready, wait for reconnect and try to parse again the file
    if (!collection) {
        console.dir('DB not ready retrying in: ' + CHECK_QUEUE_RETRY_INTERVAL)
        setTimeout(processQueue, CHECK_QUEUE_RETRY_INTERVAL)
        queue.push(path)
    }

    console.dir(event)
    console.dir('File ' + path + ' was added to the directory');
    // READ new events only
    // start from the bottom until find READ
    getDataFromFile(path)
    .then( data => data.map((o)=>{return JSON.parse(o)}) )
    .then(data => {
        console.dir(data)
        return accessLogsProcessor(path, collection, data)
    })
    .then(() => {
            // write READ to file?
    })
    .catch((docPathErr) => {
        queue.push(docPathErr)
    })
}

const getDataFromFile = path => {
    const data = []
    let shouldRead = false
    // Try to read in reverse order
    return new Promise((resolve, reject) => {
      console.dir('getData')
      const rl = readline.createInterface({
        input: fs.createReadStream(path)
      })
      rl.on('line', line => {
        if (line === 'READ') return shouldRead = true
        if (shouldRead) data.push(line)
      })
      rl.on('close', () =>{
        rl.close()
        resolve(data)
      })
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

chokidar.watch(WATCH_PATH).on('change', watchHandler);

