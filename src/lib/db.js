// Fake database

module.exports = {
  disconnect: () => true,
  isReady: () => Promise.resolve(),
  ping: () => Promise.resolve()
};
