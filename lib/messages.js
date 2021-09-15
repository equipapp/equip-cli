const chalk = require("chalk");

module.exports.error = (message) => {
  console.error(chalk.red(message));
  process.exit(1);
};

module.exports.info = (message) => {
  console.info(chalk.blue(message));
};

module.exports.success = (message) => {
  console.info(chalk.green(message));
};

module.exports.warn = (message) => {
  console.info(chalk.yellow(message));
};
