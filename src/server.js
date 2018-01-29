const http = require('http');
const stoppable = require('stoppable');
const createApp = require('./app');
const db = require('./lib/db');

const app = createApp({ db });
const server = stoppable(http.createServer(app));

function abort() {
  console.log('Shutting down server');
  process.exit(1);
}

/**
 * Gracefully start by waiting on database before accepting http connecitons.
 */
function gracefulStart() {
  db
    .isReady()
    .then(() => {
      console.log('Database ready');
      const port = process.env.PORT || 3001;
      server.listen(port, err => {
        if (err) {
          // fatal
          console.error(err, 'Unable to start server');
          process.exit(1);
        }
        console.log(`Listening on port ${server.address().port}`);
      });
    })
    .catch(err => {
      // fatal
      console.error(err, 'Database not ready');
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
      console.error(errDb, 'Error closing database connection');
    }
  }
}

/**
 * Perform cleanup and exit the process. This is the callback for server.stop.
 */
function onServerStopped(err) {
  if (err) {
    console.error(err, 'Error stopping server');
  } else {
    console.log('Server stopped successfully');
  }
  releaseResources();
  console.log('Graceful shutdown succesful');
  process.exit(0);
}

/**
 * Stops accepting new connections and close existing, idle connections
 * (including keep-alives) without killing requests that are in-flight.
 */
function gracefulShutdown() {
  console.log('Shutting down server gracefully');
  server.stop(onServerStopped);
}

/**
 * Handler for SIGTERM
 */
function onSigTerm() {
  const delay = process.env.GRACEFUL_SHUTDOWN_DELAY || 9000;
  console.log(`SIGTERM received, starting shutdown in ${delay} ms.`);
  setTimeout(gracefulShutdown, delay);
}

/**
 * Handler for unhandled rejections
 */
function onUhandledRejection(reason, promise) {
  // fatal
  console.error({ reason, promise }, 'Unhandled Rejection');
  releaseResources();
  abort();
}

process.on('SIGTERM', onSigTerm).on('unhandledRejection', onUhandledRejection);

// PM2, in development, sends a SIGINT during restarts
if (process.env.NODE_ENV === 'development') {
  process.on('SIGINT', () => {
    console.log('SIGINT received');
    abort();
  });
}

gracefulStart();
