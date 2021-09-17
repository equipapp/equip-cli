const fs = require("fs");
const path = require("path");
const { makePR } = require("./github");
const { getRoot, addPath, pushChanges, commit } = require("./git");
const { makeBranch, rmBranch, getBranch, checkout } = require("./git");
const { randomId } = require("./random");

const tagChangeLog = async (...tags) => {
  const { default: ora } = await import("ora");
  const spinner = ora("Writing to the change log").start();
  const root = getRoot();
  const changelog = path.join(root, "CHANGES.md");
  if (!fs.existsSync(changelog)) {
    fs.writeFileSync(changelog, "");
  }
  const currentBranch = getBranch();
  const branch = `changelog-${randomId(4)}`;
  makeBranch(branch);
  const currentLog = fs.readFileSync(changelog).toString();
  const prepend = tags.map((tag) => `## ${tag}\n`).join("\n");
  fs.writeFileSync(changelog, prepend + currentLog);
  addPath(changelog);
  commit("Update change log");
  pushChanges(branch);
  await makePR({
    owner: "equipapp",
    repo: "equip",
    title: `Merge ${branch}`,
    body: "Update change log with the new tags.",
    head: branch,
    base: "develop",
  });
  checkout(currentBranch);
  rmBranch(branch);
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
