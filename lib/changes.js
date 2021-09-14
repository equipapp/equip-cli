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
  const current = fs.readFileSync(changelog).toString();
  const prepend = `## ${tag}\n`;
  fs.writeFileSync(changelog, prepend + current);
  addPath(changelog);
  spinner.succeed();
};

const makeChangeLogEntry = (type, message, description) =>
  `- **[${type}] ${message}**:  \n${description}\n\n`;

const addToChangeLog = async (type, message, description) => {
  const { default: ora } = await import("ora");
  const spinner = ora("Writing to the change log").start();
  const root = getRoot();
  const changelog = path.join(root, "CHANGES.md");
  if (!fs.existsSync(changelog)) {
    fs.writeFileSync(changelog, "");
  }
  const current = fs.readFileSync(changelog).toString();
  const entry = makeChangeLogEntry(type, message, description);
  fs.writeFileSync(changelog, entry + current);
  addPath(changelog);
  spinner.succeed();
  return entry;
};

module.exports.makeChangeLogEntry = makeChangeLogEntry;
module.exports.addToChangeLog = addToChangeLog;
module.exports.tagChangeLog = tagChangeLog;
