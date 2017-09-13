const _ = require('lodash')

const processAccessLogFile = (path, collection, data) => {
    return new Promise((resolve, reject) => {
        // console.dir(data)
        const dataByUserId = _.groupBy(data, 'user_id')
        Object.keys(dataByUserId)
        .forEach((userId) => {
            const dataToSave = {
                user_id: userId,
                data: dataByUserId[userId]
            }
            collection.update({user_id:userId}, dataToSave, (err, res) => {
                if (err) {
                    console.dir('Error inserting: ' + userData)
                    return reject(path)
                }
                console.dir('Document inserted: ' + path)
                resolve(path)
            })
        })
    })
}

module.exports = processAccessLogFile
