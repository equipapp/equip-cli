exports.command = "branch <command>";
exports.desc = "Create a new branch for a feature, bugfix or etc";
exports.builder = (yargs) => {
  return yargs.commandDir("branch").help().alias("h", "help");
};
