const { Octokit } = require("@octokit/core");
const { AutoComplete } = require("enquirer");
const { error } = require("./messages");
const fs = require("fs");
const os = require("os");

module.exports.selectIssues = async (options) => {
  const HOME = os.homedir();
  if (!fs.existsSync(`${HOME}/.equip/.git.conf.json`)) {
    return console.error("Please login to GitHub first.");
  }
  const { default: ora } = await import("ora");
  const spinner = ora("Reading issues from GitHub").start();
  const { auth } = require(`${HOME}/.equip/.git.conf.json`);
  const octokit = new Octokit({ auth });
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/issues",
    options
  );
  if (response.status !== 200) {
    spinner.fail();
    return error("Fail to communicate with GitHub.");
  }
  spinner.succeed();
  const allIssues = response.data;
  const choices = allIssues.map((issue) => ({
    name: `#${issue.number} ${issue.title}`,
    value: `#${issue.number}`,
  }));
  const prompt = new AutoComplete({
    name: "issues",
    message: "Pick the issues related to your feature",
    choices,
    limit: 10,
    multiple: true,
    result(issues) {
      return Object.values(this.map(issues));
    },
  });
  return await prompt.run();
};

module.exports.getPR = async (options, head) => {
  const HOME = os.homedir();
  if (!fs.existsSync(`${HOME}/.equip/.git.conf.json`)) {
    return console.error("Please login to GitHub first.");
  }
  const { default: ora } = await import("ora");
  const spinner = ora("Reading pull request info from GitHub").start();
  const { auth } = require(`${HOME}/.equip/.git.conf.json`);
  const octokit = new Octokit({ auth });
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls",
    options
  );
  if (response.status !== 200) {
    spinner.fail();
    return error("Failed to communicate with GitHub.");
  }
  spinner.succeed();
  for (const pr of response.data) {
    if (pr.head.ref === head) {
      return pr;
    }
  }
  return null;
};

module.exports.makePR = async (options) => {
  const HOME = os.homedir();
  if (!fs.existsSync(`${HOME}/.equip/.git.conf.json`)) {
    return console.error("Please login to GitHub first.");
  }
  const { default: ora } = await import("ora");
  const spinner = ora("Sending pull request info to GitHub").start();
  const { auth } = require(`${HOME}/.equip/.git.conf.json`);
  const octokit = new Octokit({ auth });
  const response = await octokit.request(
    "POST /repos/{owner}/{repo}/pulls",
    options
  );
  if (response.status !== 201) {
    spinner.fail();
    return error("Failed to communicate with GitHub.");
  }
  spinner.succeed();
};

module.exports.updatePR = async (options) => {
  const HOME = os.homedir();
  if (!fs.existsSync(`${HOME}/.equip/.git.conf.json`)) {
    return console.error("Please login to GitHub first.");
  }
  const { default: ora } = await import("ora");
  const spinner = ora("Sending pull request info to GitHub").start();
  const { auth } = require(`${HOME}/.equip/.git.conf.json`);
  const octokit = new Octokit({ auth });
  const response = await octokit.request(
    "PATCH /repos/{owner}/{repo}/pulls/{pull_number}",
    options
  );
  if (response.status !== 200) {
    spinner.fail();
    return error("Failed to communicate with GitHub.");
  }
  spinner.succeed();
};
