const http = require('http');
const stoppable = require('stoppable');
const createApp = require('./app');
const db = require('./lib/db');
const log = require('./lib/log');

const app = createApp({ db });
const server = stoppable(http.createServer(app));

function abort() {
  log.info('Shutting down server');
  process.exit(1);
}

/**
 * Gracefully start by waiting on database before accepting http connecitons.
 */
function gracefulStart() {
  db
    .isReady()
    .then(() => {
      log.info('Database ready');
      const port = process.env.PORT || 3001;
      server.listen(port, err => {
        if (err) {
          log.fatal(err, 'Unable to start server');
          process.exit(1);
        }
        log.info(
          { version: '1.3.4' },
          `Listening on port ${server.address().port}`
        );
      });
    })
    .catch(err => {
      log.fatal(err, 'Database not ready');
      abort();
    });
}

/**
 * Cleans up redis and db connections.
 */
function releaseResources() {
  if (db) {
    try {
      db.disconnect();
    } catch (errDb) {
      log.error(errDb, 'Error closing database connection');
    }
  }
}

/**
 * Perform cleanup and exit the process. This is the callback for server.stop.
 */
function onServerStopped(err) {
  if (err) {
    log.error(err, 'Error stopping server');
  } else {
    log.info('Server stopped successfully');
  }
  releaseResources();
  log.info('Graceful shutdown succesful');
  process.exit(0);
}

/**
 * Stops accepting new connections and close existing, idle connections
 * (including keep-alives) without killing requests that are in-flight.
 */
function gracefulShutdown() {
  log.info('Shutting down server gracefully');
  server.stop(onServerStopped);
}

/**
 * Handler for SIGTERM
 */
function onSigTerm() {
  log.info(`SIGTERM received, starting shutdown`);
  gracefulShutdown();
}

/**
 * Handler for unhandled rejections
 */
function onUhandledRejection(reason, promise) {
  log.fatal({ reason, promise }, 'Unhandled Rejection');
  releaseResources();
  abort();
}

process.on('SIGTERM', onSigTerm).on('unhandledRejection', onUhandledRejection);

// PM2, in development, sends a SIGINT during restarts
if (process.env.NODE_ENV === 'development') {
  process.on('SIGINT', () => {
    log.info('SIGINT received');
    abort();
  });
}

gracefulStart();
