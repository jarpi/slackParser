const mongoClient = require('mongodb')

const RECONNECT_MS = 1000;

const MongoConnect = () => {
    return new Promise((resolve, reject) =>{
        return mongoClient.connect('mongodb://127.0.0.1:27017/slackData',{
                reconnectTries : Number.MAX_VALUE,
                autoReconnect : 1,
                reconnectInterval: 1000,
                connectTimeoutMS: 500,
                keepAlive: 1
        }, (err, connection) => {
            if (err) {
                // console.dir('Error connection Mongo')
                // return resolve(MongoConnect())
                console.dir('Error connection Mongo')
                return setTimeout((resolve) => {
                    return resolve(MongoConnect())
                }, RECONNECT_MS, resolve)
            }
            console.dir('Connection established')
            return resolve(connection)
        })
    })
}

module.exports = MongoConnect
