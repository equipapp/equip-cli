const slug = require("slug");
const { selectIssues, assignIssues } = require("../../../lib/github");
const { makeBranch } = require("../../../lib/git");

exports.command = "bugfix <name>";
exports.desc = "Creates a new bug fix branch";
exports.builder = {
  name: { describe: "Issue name", type: "string" },
};
exports.handler = async (argv) => {
  const issues = await selectIssues({ owner: "equipapp", repo: "equip" });
  const id = slug(argv.name);
  const branch = `bugfix-${id}/${issues.join("-")}`;
  makeBranch(branch);
  const options = { owner: "equipapp", repo: "equip" };
  assignIssues(options, issues);
};
