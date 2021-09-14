const { getTags, tag } = require("../../../lib/git");
const { pushTags } = require("../../../lib/git");
const { tagChangeLog } = require("../../../lib/changes");
const { MultiSelect } = require("enquirer");
const semver = require("semver");

// TODO: Bump the version, too

exports.command = "release [type]";
exports.desc = "Creates a new debug tag";
exports.builder = {
  type: {
    describe: "Version increment type",
    type: "string",
    default: "patch",
  },
};
exports.handler = async (argv) => {
  const prompt = new MultiSelect({
    name: "type",
    message: "Which targets should be tagged?",
    choices: ["App", "Server"],
  });
  const targets = await prompt.run();
  const tags = [];
  for (const target of targets) {
    if (target === "App") {
      const current = getTags()
        .filter((tag) => tag.startsWith("app"))
        .filter((tag) => tag.endsWith("release"))
        .map((tag) => tag.slice(5, -8))
        .sort((a, b) => (semver.gt(a, b) ? 1 : -1))
        .pop();
      const next = semver.inc(current, argv.type);
      const name = `app-v${next}-release`;
      tags.push(name);
    } else if (target === "Server") {
      const current = getTags()
        .filter((tag) => tag.startsWith("server"))
        .filter((tag) => tag.endsWith("release"))
        .map((tag) => tag.slice(8, -8))
        .sort((a, b) => (semver.gt(a, b) ? 1 : -1))
        .pop();
      const next = semver.inc(current, argv.type);
      const name = `server-v${next}-release`;
      tags.push(name);
    }
  }
  tagChangeLog(...tags);
  tags.forEach(tag);
  pushTags();
};
