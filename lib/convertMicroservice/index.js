const seneca = require('seneca');
const path = require('path');
seneca.use('./router.js', { seneca: seneca, __rootdir: path.join(__dirname, '..', '..') }).listen({ port: process.argv[2] }).client({ port: process.argv[3], type: 'http' });
console.log('started service on port ', process.argv[2]);