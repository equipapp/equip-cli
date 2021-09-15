const { getTags, tag, getBranch, makeBranch } = require("../../../lib/git");
const { pushTags, getRoot, checkout } = require("../../../lib/git");
const { addPath, pushChanges, makeCommit } = require("../../../lib/git");
const { makePR, getPR } = require("../../../lib/github");
const { npmCommand } = require("../../../lib/npm");
const { tagChangeLog } = require("../../../lib/changes");
const { error, info } = require("../../../lib/messages");
const { MultiSelect } = require("enquirer");
const semver = require("semver");
const path = require("path");
const fs = require("fs");

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
      checkout("develop");
      const currentBranch = getBranch();
      if (currentBranch !== "develop") {
        return error("Cannot checkout develop");
      }
      const src = path.join(getRoot(), "src");
      const pkgPath = path.join(src, "package.json");
      const pkgLockPath = path.join(src, "package-lock.json");
      const configPath = path.join(src, "mobile-config.js");
      const lastTaggedVersion = getTags()
        .filter((tag) => tag.startsWith("app"))
        .filter((tag) => tag.endsWith("release"))
        .map((tag) => tag.slice(5, -8))
        .sort((a, b) => (semver.gt(a, b) ? 1 : -1))
        .pop();
      const pkg = require(pkgPath);
      const next = semver.inc(lastTaggedVersion, argv.type);
      if (semver.lt(pkg.version, next)) {
        const bumpBranch = `bump-release-v${next}`;
        const options = { owner: "equipapp", repo: "equip" };
        const pr = await getPR(options, bumpBranch);
        if (pr) {
          return error(
            `The pull request to bump the app version to v${next} is not merged yet.`
          );
        }
        const { default: ora } = await import("ora");
        const versionSpinner = ora("Bumping the version").start();
        makeBranch(bumpBranch);
        fs.writeFileSync(
          pkgPath,
          JSON.stringify({ ...pkg, version: next }, null, 2)
        );
        const pkgLock = require(pkgLockPath);
        fs.writeFileSync(
          pkgLockPath,
          JSON.stringify({ ...pkgLock, version: next }, null, 2)
        );
        const config = fs.readFileSync(configPath).toString();
        const versionRe = new RegExp(`version: "${pkg.version}"`);
        const patched = config.replace(versionRe, `version: "${next}"`);
        fs.writeFileSync(configPath, patched);
        versionSpinner.succeed();
        const lintSpinner = ora("Running lint:fix").start();
        npmCommand("lint:fix", src, null, { stdio: "ignore" });
        lintSpinner.succeed();
        addPath(src);
        makeCommit(`Bump app version to v${next}`);
        pushChanges(bumpBranch);
        await makePR({
          ...options,
          title: `Bump app version to v${next}`,
          body: `Bumps the app version to v${next}. Required for making a release build.`,
          head: bumpBranch,
          base: "develop",
        });
        return info(
          `A pull request to bump the version to ${next} is created. Merge the PR to continue.`
        );
      } else if (semver.gt(pkg.version, next)) {
        return error(
          `App version in package.json is bigger than the last release tag.`
        );
      }
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
  if (tags.length) {
    await tagChangeLog(...tags);
    tags.forEach(tag);
    pushTags();
  }
};
