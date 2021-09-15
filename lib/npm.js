const { spawnSync } = require("child_process");

const npmCommand = (command, destination, args, forkOptions = {}) => {
  const argv = args && args.length ? ["--", ...args] : [];
  const npm = process.platform == "win32" ? "npm.cmd" : "npm";
  return spawnSync(npm, ["run", command, ...argv], {
    cwd: destination,
    stdio: "inherit",
    ...forkOptions,
  });
};

module.exports.npmCommand = npmCommand;
