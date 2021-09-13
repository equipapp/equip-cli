const { getPR, makePR, updatePR } = require("../../lib/github");
const { getBranch, makeCommit } = require("../../lib/git");
const { pushChanges, addPath } = require("../../lib/git");
const { Input, Select } = require("enquirer");
const { addToChangeLog } = require("../../lib/changes");

// TODO:

const TEMPLATE = `## Proposed changes:\n\n`;

exports.command = "commit [push] [change]";
exports.desc = "Make a commit and add it to the changelog";
exports.builder = {
  message: { describe: "Commit message", type: "string" },
  push: {
    describe: "Push the commit to GitHub",
    type: "boolean",
    default: true,
  },
  change: {
    describe: "Add the commit to the changelog",
    type: "boolean",
    default: true,
  },
};
exports.handler = async (argv) => {
  const typePrompt = new Select({
    name: "type",
    message: "Pick a commit type",
    choices: ["bugfix", "feature"],
  });
  const type = await typePrompt.run();
  const messagePrompt = new Input({
    message: "Enter a short message for the commit",
    initial: "",
  });
  const message = await messagePrompt.run();
  const descPrompt = new Input({
    message: "Enter a detailed explanation for the commit",
    initial: "",
  });
  const description = await descPrompt.run();

  const append = argv.change
    ? await addToChangeLog(type, message, description)
    : `- **[${type}]** ${message}: ${description}\n\n`;

  addPath(process.cwd());
  makeCommit(`[${type}] ${message}`);

  const branch = getBranch();

  if (argv.push) {
    pushChanges(branch);
  }

  const options = { owner: "equipapp", repo: "equip" };
  const pr = await getPR(options, branch);

  if (pr) {
    updatePR({
      ...options,
      pull_number: pr.number,
      body: pr.body + append + "\n\n",
    });
  } else {
    const issues = branch.split("/").pop().split(",");
    const fixes = `Fixes ${issues.join(", ")}`;
    makePR({
      ...options,
      title: `Merge ${branch}`,
      body: fixes + "\n\n" + TEMPLATE + append + "\n\n",
      head: branch,
      base: "develop",
    });
  }
};
