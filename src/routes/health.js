const log = require('../lib/log');
const timeout = require('../lib/timeout');

const status = {
  FAIL: 'fail',
  OK: 'ok'
};

const statusCodes = {
  OK: 200,
  SERVICE_UNAVAILABLE: 503
};

const getStatusCode = statuses =>
  statuses.some(s => s !== status.OK)
    ? statusCodes.SERVICE_UNAVAILABLE
    : statusCodes.OK;

const checkDb = db =>
  timeout(db.ping('pong'), 500)
    .then(() => status.OK)
    .catch(err => {
      log.error(err, 'db health check failed');
      return status.FAIL;
    });

module.exports = function createHealthRoute({ db }) {
  return function health(req, res) {
    const result = {
      pid: process.pid,
      node: {
        env: process.env.NODE_ENV,
        version: process.version,
        uptime: process.uptime()
      }
    };

    Promise.all([checkDb(db)]).then(statuses => {
      const [dbStatus] = statuses;
      result.db = {
        status: dbStatus
      };
      const statusCode = getStatusCode(statuses);
      log.info({ statusCode }, 'Health check');
      res.status(statusCode).json(result);
    });
  };
};
