const slug = require("slug");
const { selectIssues } = require("../../../lib/github");
const { makeBranch } = require("../../../lib/git");

exports.command = "feature <name>";
exports.desc = "Creates a new feature branch";
exports.builder = {
  name: { describe: "Feature name", type: "string" },
};
exports.handler = async (argv) => {
  const issues = await selectIssues({ owner: "equipapp", repo: "equip" });
  const id = slug(argv.name);
  const branch = `feature:${id}/${issues.join("-")}`;
  makeBranch(branch);
};
