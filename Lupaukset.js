const http = require('http');
const fs = require('fs').promises;

let henkilot = require('./henkilot.json');

const sallitutTyypit = [
    'application/x-www-form-urlencoded',
    'application/json'
];

const parseData = (req) => {
    const tyyppi = req.headers['content-type'];

    return new Promise((resolve, reject) => {
        let body = '';

        if (!sallitutTyypit.includes(tyyppi)) {
            reject('Virheellinen tyyppi');
        }

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            if (tyyppi === 'application/json') {
                resolve(JSON.parse(body));
            } else {
                const params = new URLSearchParams(body);
                const jsonResult = {};

                params.forEach((value, name) => {
                    jsonResult[name] = value;
                });

                resolve(jsonResult);
            }
        });

        req.on('error', (err) => {
            reject(err);
        });
    });
};

const sendResponse = (res, data) => {
    if (data === 'Virheellinen tyyppi') {
        res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('Virheellinen POST-tyyppi');
        return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });

    if ('nimi' in data) {
        const foundPerson = henkilot.find((person) => person.nimi.toLowerCase() === data.nimi.toLowerCase());
        if (foundPerson) {
            res.end(JSON.stringify(foundPerson));
        } else {
            res.end(JSON.stringify({ error: 'Henkilöä ei löytynyt' }));
        }
    } else if ('ammatti' in data) {
        const filteredPersons = henkilot.filter((person) => person.ammatti.toLowerCase() === data.ammatti.toLowerCase());
        res.end(JSON.stringify(filteredPersons));
    } else {
        res.end(JSON.stringify({ error: 'Virheellinen parametri' }));
    }
};

const server = http.createServer(async (req, res) => {
    try {
        const requestData = await parseData(req);
        sendResponse(res, requestData);
    } catch (error) {
        sendResponse(res, 'Virheellinen tyyppi');
    }
});

server.listen(3000);
