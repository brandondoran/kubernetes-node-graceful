const { clearTimeout } = require('timers');

function delay(time) {
  return new Promise(resolve => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve();
    }, time);
  });
}

module.exports = function timeout(promise, time) {
  return Promise.race([
    promise,
    delay(time).then(() => {
      throw new Error('Operation timed out');
    })
  ]);
};
