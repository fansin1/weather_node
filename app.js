const express = require('express')
const https = require('https')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = 8080
const apiKey = "e817a8ca5a3ba0db6381aec3bc14f6b2"
var db = null;

MongoClient.connect('mongodb://localhost:27017/', (err, client) => {
    if (err) throw err

    db = client.db('db');
    app.listen(port)
})

app.use('/', express.static(__dirname + '/'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/weather/coordinates', (req, res) => {
    if (!Object.keys(req.query).includes('lat') || !Object.keys(req.query).includes('lon')) {
        res.status(400).send("No coordinates keys in query")
        return
    }

    loadWeatherDataByPosToRes(req.query.lat, req.query.lon, res)
})

app.get('/weather/city', (req, res) => {
    if (!Object.keys(req.query).includes('name')) {
        res.status(400).send("No city key in query")
        return
    }

    loadWeatherDataByNameToRes(req.query.name, res)
})

app.get('/favorites', (req, res) => {
    db.collection('favorites').find().toArray(function (error, result) {
        res.status(200).send(result);
    });
})

app.post('/favorites', (req, res) => {
    if (!Object.keys(req.query).includes('name')) {
        res.status(400).send("No city key in query")
        return
    }

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${req.query.name}&appid=${apiKey}`
    loadDataByUrl(
        url,
        data => {
            db.collection('favorites').find({id: data.id}).toArray((error, result) => {
                if (result.length !== 0) {
                    res.status(409).send("Already in favorites");
                } else {
                    db.collection('favorites').insertOne({id: data.id, name: data.name});
                    res.status(200).send("OK");
                }
            });
        },
        (code, error) => {
            res.status(code).send(error)
        }
    )
})

app.delete('/favorites', (req, res) => {
    if (!Object.keys(req.query).includes('name')) {
        res.status(400).send("No city key in query")
        return
    }

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${req.query.name}&appid=${apiKey}`
    loadDataByUrl(
        url,
        data => {
            db.collection('favorites').remove({ id: data.id }, function (err) {
                if (err) {
                    res.status(404).send("Can't remove");
                } else {
                    res.status(200).send("OK");
                }
            });
        },
        (code, error) => {
            res.status(code).send(error);
        }
    )
})

function loadWeatherDataByNameToRes(name, res) {
    let url = `https://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${apiKey}`
    loadDataByUrlToRes(url, res)
}

function loadWeatherDataByPosToRes(lat, lon, res) {
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    loadDataByUrlToRes(url, res)
}

function loadDataByUrlToRes(url, res) {
    loadDataByUrl(
        url,
        data => {
            res.status(200).send(data)
        },
        (code, error) => {
            res.status(code).send(error)
        }
    )
}

function loadDataByUrl(url, callback, errorCallback) {
    https.get(url, (response) => {
        if (response.statusCode === 404) {
            errorCallback(404, "Not found")
            return
        }

        let data = ''
        response.on('data', (chunk) => {
            data += chunk
        });
        response.on('end', () => {
            data = JSON.parse(data)
            callback(data)
        })
    }).on("error", (err) => {
        errorCallback(404, "Not found")
    })
}
