const express = require('express');
const health = require('./routes/health');

module.exports = function createApp({ config, db }) {
  const app = express();

  // Routes
  app.get('/health', health({ db }));
  app.use('/', (req, res) => {
    res.json({ message: 'hello' });
  });

  return app;
};
