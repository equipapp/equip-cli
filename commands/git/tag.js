exports.command = "tag <command>";
exports.desc = "Create a new tag for release or debug builds";
exports.builder = (yargs) => {
  return yargs.commandDir("tag").help().alias("h", "help");
};
