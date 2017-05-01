const seneca = require('seneca')()
const process = require('child_process');
const path = require('path');
const SOME_LOAD_BALANCE_CONFIG_OBJECT = {
    services: [
        {
            pattern: { service: 'user' },
            locations: [
                { host: 'localhost', port: '10201', spec: 'http' },
            ]
        },
        {
            pattern: { service: 'process' },
            locations: [
                { host: 'localhost', port: '10301', spec: 'http' },
            ]
        },
        {
            pattern: { service: 'convert' },
            locations: [
                { host: 'localhost', port: '10401', spec: 'http' },
            ]
        },
        {
            pattern: { service: 'file' },
            locations: [
                { host: 'localhost', port: '10501', spec: 'http' },
            ]
        },
        {
            pattern: { service: 'tag' },
            locations: [
                { host: 'localhost', port: '10601', spec: 'http' },
            ]
        },

    ]
};

// start microservices
const LISTEN_PORT = 10101;
var spawn = require('child_process').spawn;
for (const service of SOME_LOAD_BALANCE_CONFIG_OBJECT.services) {

    const pathToMicroservice = path.join(__dirname, service.pattern.service + 'Microservice', 'index.js');
    for (const microservice of service.locations) {
        const port = microservice.port;
        const ms = spawn('node', [pathToMicroservice, port, LISTEN_PORT, '--seneca.log.quiet']);
        ms.stdout.on('data', (data) => {
            console.log(service.pattern.service + '\t' + data);
        });
        ms.stderr.on('data', (data) => {
            console.error(service.pattern.service + '\t' + data);
        });

    }
}


// use load balancing
seneca.use(require('seneca-load-balancer'), SOME_LOAD_BALANCE_CONFIG_OBJECT);

seneca.listen({ port: LISTEN_PORT, type: 'http' });