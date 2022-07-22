const path = require("path");
const fs = require("fs");
const semver = require("semver");
const { generateChangelog, getRoot } = require("../lib/git");
const { error } = require("../lib/messages");

const getPackageVersion = () => {
  const src = path.join(getRoot(), "src");
  const pkg = require(path.join(src, "package.json"));
  return semver.clean(pkg.version);
};

exports.command = "changes";
exports.desc = "Operations with Equip changelogs.";
exports.builder = {
  tag: {
    describe: "The tag to be considered as current.",
    type: "string",
    default: getPackageVersion(),
  },
  previousTag: {
    describe: "The previous tag to be compared with.",
    type: "string",
  },
  output: {
    describe: "The output file where the changes will be written to.",
    type: "string",
  },
};
exports.handler = (argv) => {
  if (!argv.previousTag) {
    error("You must specify the previous tag to compare with.");
    return;
  }

  const previousTag = argv.previousTag;
  const tag = argv.tag;
  const output = argv.output;

  const commandResult = generateChangelog(previousTag, tag);

  const changelog = commandResult.stdout.toString();

  if (output) {
    const filePath = path.join(output, `changes.txt`);
    fs.writeFileSync(filePath, changelog);
  } else {
    console.log(changelog);
  }
};
