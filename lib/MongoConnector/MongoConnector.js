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
                console.dir(err)
                return setTimeout(MongoConnect, RECONNECT_MS)
            }
            return resolve(connection)
        })
    })
}

module.exports = MongoConnect
