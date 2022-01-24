const path = require("path");
const fs = require("fs");
const semver = require("semver");
const { Confirm } = require("enquirer");
const { error, info } = require("../lib/messages");
const {
  getRoot,
  getTags,
  tag,
  addPath,
  makeCommit,
  pushChanges,
  pushTags,
} = require("../lib/git");

const shouldSkip = (baseVersion, env, platform) => {
  const lastVersion = getTags()
    .filter((tag) => tag.startsWith(platform))
    .filter((tag) => tag.endsWith(env))
    .map((tag) => tag.split("-")[1].slice(1))
    .sort((a, b) => (semver.gt(a, b) ? 1 : -1))
    .pop();

  info(`Last tagged ${platform} version is ${lastVersion}.`);

  return baseVersion === lastVersion || semver.lt(baseVersion, lastVersion);
};

const keypress = async () => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) =>
    process.stdin.once("data", (data) => {
      const byteArray = [...data];
      if (byteArray.length > 0 && byteArray[0] === 3) {
        console.log("^C");
        process.exit(1);
      }
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

exports.command = "auto-bump";
exports.desc =
  "Auto bump all required files and create tags if the version specified on the provided versions file is higher than the latest tag.";
exports.builder = {
  file: {
    describe: "The versions file.",
    type: "string",
  },
  env: {
    describe: "The environment to be considered.",
    type: "string",
    default: "staging",
  },
  silent: {
    describe: "Skip all prompts.",
    type: "boolean",
    default: false,
  },
  platform: {
    describe: "App or server. Leave empty for both.",
    type: "string",
  },
};
exports.handler = async (argv) => {
  if (!argv.file) {
    throw new Error("You must provide a file with the versions.");
  }

  if (!argv.file.endsWith(".json")) {
    throw new Error("You must provide a JSON file.");
  }

  const { default: ora } = await import("ora");

  let commitMessage = "[auto] Bumping version to ";

  const newTags = [];
  const filePath = path.join(getRoot(), argv.file);

  const changesPath = path.join(getRoot(), "CHANGES.md");

  const versions = require(filePath);

  if (!argv.platform || argv.platform === "server") {
    info(`Server version: ${versions.server}`);

    const serverSkipped = shouldSkip(versions.server, argv.env, "server");

    if (serverSkipped) {
      info(
        "Server version didn't change or latest version is greather than desired version. Skipping..."
      );
      if (argv.platform === "server") {
        process.exit(1);
      }
    } else {
      const newTag = `server-v${versions.server}-${argv.env}`;
      newTags.push(newTag);

      const spinner = ora(`Writing tag ${newTag} to changelog...`).start();
      try {
        const changesFile = fs.readFileSync(changesPath).toString();
        const newChangesFile = `## ${newTag}\n\n`.concat(changesFile);
        fs.writeFileSync(changesPath, newChangesFile);
        commitMessage += `server ${versions.server}`;
        fs.writeFileSync(path.join(getRoot(), "server-version"), newTag);
        spinner.succeed();
      } catch (e) {
        spinner.fail();
        error(e.message);
      }
    }
  }

  if (!argv.platform || argv.platform === "app") {
    info(`App version: ${versions.app}`);

    const appSkipped = shouldSkip(versions.app, argv.env, "app");

    if (appSkipped) {
      info(
        "App version didn't change or latest version is greather than desired version. Skipping..."
      );
      if (argv.platform === "app") {
        process.exit(1);
      }
    } else {
      const newTag = `app-v${versions.app}-${argv.env}`;
      newTags.push(newTag);

      const pkgPath = path.join(getRoot(), "src/package.json");
      const spinnerPkg = ora(`Changing version on ${pkgPath}`).start();
      try {
        const pkg = require(pkgPath);
        fs.writeFileSync(
          pkgPath,
          JSON.stringify(
            {
              ...pkg,
              version: versions.app,
            },
            null,
            2
          )
        );
        addPath(pkgPath);
        spinnerPkg.succeed();
      } catch (e) {
        spinnerPkg.fail();
        error(e.message);
      }

      const pkgLockPath = path.join(getRoot(), "src/package-lock.json");
      const spinnerPkgLock = ora(`Changing version on ${pkgLockPath}`).start();
      try {
        const pkgLock = require(pkgLockPath);
        fs.writeFileSync(
          pkgLockPath,
          JSON.stringify(
            {
              ...pkgLock,
              version: versions.app,
            },
            null,
            2
          )
        );
        addPath(pkgLockPath);
        spinnerPkgLock.succeed();
      } catch (e) {
        spinnerPkgLock.fail();
        error(e.message);
      }

      const configPath = path.join(getRoot(), "src/mobile-config.js");
      const spinnerConfig = ora(`Changing version on ${configPath}`).start();
      try {
        const pkgPath = path.join(getRoot(), "src/package.json");
        const pkg = require(pkgPath);
        const config = fs.readFileSync(configPath).toString();
        const versionRe = new RegExp(`version: "${pkg.version}"`);
        const patched = config.replace(versionRe, `version: "${versions.app}"`);
        fs.writeFileSync(configPath, patched);
        addPath(configPath);
        spinnerConfig.succeed();
      } catch (e) {
        spinnerConfig.fail();
        error(e.message);
      }

      const spinner = ora(`Writing tag ${newTag} to changelog...`).start();
      try {
        const changesFile = fs.readFileSync(changesPath).toString();
        const newChangesFile = `## ${newTag}\n\n`.concat(changesFile);
        fs.writeFileSync(changesPath, newChangesFile);
        commitMessage += ` and app ${versions.app}`;
        fs.writeFileSync(path.join(getRoot(), "app-version"), newTag);
        spinner.succeed();
      } catch (e) {
        spinner.fail();
        error(e.message);
      }
    }
  }

  if (newTags.length) {
    try {
      addPath(changesPath);

      if (!argv.silent) {
        info("Files changes. Check them and press any key to continue...");
        await keypress();
      }

      makeCommit(commitMessage);

      if (argv.silent) {
        const spinner = ora(`Pushing...`).start();
        pushChanges("develop");
        spinner.succeed();
      } else {
        const prompt = new Confirm({
          name: "question",
          message: "Commit and tags are created. Can I push?",
          initial: true,
        });

        const answer = await prompt.run();

        if (answer) {
          const spinner = ora(`Pushing...`).start();
          pushChanges("develop");
          spinner.succeed();
        } else {
          info(
            "The commit and tags won't be reverted. Check manually and push later."
          );
        }
      }

      newTags.forEach(tag);
      pushTags();
    } catch (e) {
      error(e.message);
    }
  }
};
