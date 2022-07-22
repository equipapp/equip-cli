const { spawnSync } = require("child_process");

const makeBranch = (name) =>
  spawnSync("git", ["checkout", "-b", name], { stdio: "ignore" });

const rmBranch = (name) =>
  spawnSync("git", ["branch", "-d", name], { stdio: "ignore" });

const checkout = (name) =>
  spawnSync("git", ["checkout", name], { stdio: "ignore" });

const makeCommit = (message) =>
  spawnSync("git", ["commit", "-m", message], { stdio: "ignore" });

const addPath = (path) => spawnSync("git", ["add", path], { stdio: "ignore" });

const getBranch = () =>
  spawnSync("git", ["branch", "--show-current"], { stdio: "pipe" })
    .stdout.toString()
    .trim();

const getRoot = () =>
  spawnSync("git", ["rev-parse", "--show-toplevel"], { stdio: "pipe" })
    .stdout.toString()
    .trim();

const getHead = () =>
  spawnSync("git", ["symbolic-ref", "-q", "HEAD"], { stdio: "pipe" })
    .stdout.toString()
    .trim();

const getTags = () =>
  spawnSync("git", ["tag"], { stdio: "pipe" })
    .stdout.toString()
    .trim()
    .split("\n")
    .map((tag) => tag.trim());

const getUpstream = () =>
  spawnSync("git", ["for-each-ref", "--format=%(upstream:short)", getHead()], {
    stdio: "pipe",
  })
    .stdout.toString()
    .trim();

const pushChanges = (branch) => {
  const upstream = getUpstream();
  if (upstream) {
    spawnSync("git", ["push"], { stdio: "ignore" });
  } else {
    spawnSync("git", ["push", "--set-upstream", "origin", branch]);
  }
};

const pushTags = () =>
  spawnSync("git", ["push", "--tags"], { stdio: "ignore" });

const tag = (name) => spawnSync("git", ["tag", name], { stdio: "ignore" });

const generateChangelog = (previousTag, tag) =>
  spawnSync("git", [
    "log",
    "--no-merges",
    "--pretty=format:- %s",
    `${previousTag}...${tag}`,
  ]);

module.exports.getUpstream = getUpstream;
module.exports.pushChanges = pushChanges;
module.exports.makeBranch = makeBranch;
module.exports.makeCommit = makeCommit;
module.exports.getBranch = getBranch;
module.exports.rmBranch = rmBranch;
module.exports.pushTags = pushTags;
module.exports.checkout = checkout;
module.exports.addPath = addPath;
module.exports.getRoot = getRoot;
module.exports.getTags = getTags;
module.exports.tag = tag;
module.exports.generateChangelog = generateChangelog;
