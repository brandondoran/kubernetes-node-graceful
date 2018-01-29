const express = require('express');
const health = require('./routes/health');
const log = require('./lib/log');

let shutdown = false;

process.on('SIGTERM', () => {
  shutdown = true;
});

const logReqAfterSigTerm = (req, res, next) => {
  if (shutdown) {
    log.info({ path: req.path }, 'Request after SIGTERM');
  }
  next();
};

module.exports = function createApp({ config, db }) {
  const app = express();

  app.get('/favicon.ico', function(req, res) {
    res.status(204);
  });

  // Routes
  app.get('/health', logReqAfterSigTerm, health({ db }));
  app.use('/', logReqAfterSigTerm, (req, res) => {
    res.json({ message: 'hello' });
  });

  return app;
};
