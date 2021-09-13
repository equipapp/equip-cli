const fs = require("fs");
const path = require("path");
const { getRoot, addPath } = require("./git");

const tagChangeLog = async (tag) => {
  const { default: ora } = await import("ora");
  const spinner = ora("Writing to the change log").start();
  const root = getRoot();
  const changelog = path.join(root, "CHANGES.md");
  if (!fs.existsSync(changelog)) {
    fs.writeFileSync(changelog, "");
  }
  const prepend = `## ${tag}\n`;
  fs.writeFileSync(changelog, prepend + current);
  addPath(changelog);
  spinner.succeed();
  const current = fs.readFileSync(changelog).toString();
};

const addToChangeLog = async (type, message, description) => {
  const { default: ora } = await import("ora");
  const spinner = ora("Writing to the change log").start();
  const root = getRoot();
  const changelog = path.join(root, "CHANGES.md");
  if (!fs.existsSync(changelog)) {
    fs.writeFileSync(changelog, "");
  }
  const current = fs.readFileSync(changelog).toString();
  const prepend = `- **[${type}]** ${message}: ${description}\n\n`;
  fs.writeFileSync(changelog, prepend + current);
  addPath(changelog);
  spinner.succeed();
  return prepend;
};

module.exports.addToChangeLog = addToChangeLog;
module.exports.tagChangeLog = tagChangeLog;
