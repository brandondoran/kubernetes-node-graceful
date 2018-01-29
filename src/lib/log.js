const bunyan = require('bunyan');

const log = bunyan.createLogger({ name: 'k8s-node-graceful' });

module.exports = log;
