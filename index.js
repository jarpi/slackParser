'use strict'

const fs = require('fs')
const chokidar = require('chokidar')
const lineReader = require('reverse-line-reader')
const queue = []
const MongoConnector = require('./lib/MongoConnector/MongoConnector.js')
const accessLogsProcessor = require('./lib/parsers/accessLogs.js')

const WATCH_PATH = process.env.WATCH_PATH || '/data/slackTeamAccessLogs*'
const COLLECTION_ACCESS_LOGS = 'accessLogs'
const CHECK_QUEUE_RETRY_INTERVAL = 1000
const READ_MARKER = 'READ'

var collection = null
// use await instead
MongoConnector()
.then((connection) => {
  connection.on('close', () => {
    console.dir('Connection to Mongo closed')
  })
  connection.on('reconnect', () => {
    console.dir('Connection to Mongo reopened')
  })

  collection = connection.collection(COLLECTION_ACCESS_LOGS)
})

const watchHandler = (path, event) => {
    // if mongo is not ready, wait for reconnect and try to parse again the file
  if (!collection) {
    console.dir('DB not ready retrying in: ' + CHECK_QUEUE_RETRY_INTERVAL)
    setTimeout(processQueue, CHECK_QUEUE_RETRY_INTERVAL)
    queue.push(path)
  }

  console.dir(event)
  console.dir('File ' + path + ' was added to the directory')
    // READ new events only
    // start from the bottom until find READ
  getDataFromFile(path)
        .then(data => {
            return data.map(o => JSON.parse(JSON.parse(o))) })
    // Use try catch to parse
    .then(data => {
        console.dir(data)
      console.dir('Process')
      return accessLogsProcessor(path, collection, data)
    })
    .then(() => {
        // Append READ to the file
      return fs.appendFile(path, READ_MARKER + '\n', (err) => {
        if (err) return Promise.reject('Failed to update ' + path)
        console.dir('File updated')
      })
    })
    .catch((docPathErr) => {
      queue.push(docPathErr)
    })
}

const getDataFromFile = path => {
  const data = []
  let shouldRead = false
  return new Promise((resolve, reject) => {
    return lineReader.eachLine(path, (line, last, cb) => {
      console.dir(line)
      if (last || (line === READ_MARKER)) {
        cb(false)
        return resolve(data)
      }
      if (line) data.push(line)
      cb(true)
    })
  })
}

const processQueue = () => {
  console.dir('Proccess queue')
    // set to null when database dies
  if (!collection) {
    console.dir('DB not ready retrying in: ' + CHECK_QUEUE_RETRY_INTERVAL)
    setTimeout(processQueue, CHECK_QUEUE_RETRY_INTERVAL)
        // queue.push(path)
    return
  }
  queue.forEach((path) => {
    const insertedOK = []
    const insertedKO = []
    accessLogsProcessor(path, collection)
        .then((docInsertedOK) => {
          insertedOK.push(docInsertedOK)
        })
        .catch((docInsertedKO) => {
          insertedKO.push(docInsertedKO)
        })
  })
}

chokidar.watch(WATCH_PATH).on('change', watchHandler)

console.log('Waiting for file changes in ' + WATCH_PATH)
