module.exports.error = (...args) => {
  console.error(...args);
  process.exit(1);
};
