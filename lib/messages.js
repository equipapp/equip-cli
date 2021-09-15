module.exports.error = (...args) => {
  console.error(...args);
  process.exit(1);
};

module.exports.info = (...args) => {
  console.info(...args);
};
