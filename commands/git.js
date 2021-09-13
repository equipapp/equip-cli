exports.command = "git";
exports.desc = "Execute git commands";
exports.builder = (yargs) => {
  return yargs.commandDir("git").help().alias("h", "help");
};
