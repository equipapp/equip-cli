const path = require("path");
const fs = require("fs");
const semver = require("semver");
const { getRoot } = require("../lib/git");
const { info, error } = require("../lib/messages");

const getPackageVersion = () => {
  const src = path.join(getRoot(), "src");
  const pkg = require(path.join(src, "package.json"));
  return semver.clean(pkg.version);
};

exports.command = "changes";
exports.desc = "Operations with Equip changelogs.";
exports.builder = {
  versionType: {
    describe: "The type of version (e.g. 'major', 'minor', 'patch')",
    type: "string",
    default: "patch",
  },
  baseVersion: {
    describe:
      "The base version to be compared. Leave empty for auto. The version in the package.json will be considered.",
    type: "string",
    default: "auto",
  },
  output: {
    describe: "The output file where the changes will be written to.",
    type: "string",
    default: ".",
  },
  env: {
    describe:
      "Which env should be considered (e.g. 'dev', 'staging', 'release').",
    type: "string",
    default: "dev",
  },
};
exports.handler = (argv) => {
  if (argv.baseVersion !== "auto" && !semver.valid(argv.baseVersion)) {
    return error("The provided version is invalid.");
  }

  const versionType = argv.versionType;
  let baseVersion =
    argv.baseVersion === "auto"
      ? getPackageVersion()
      : semver.clean(argv.baseVersion);

  info(`Base version is ${baseVersion}.`);
  const outputPath = path.resolve(getRoot(), argv.output);
  const environment = argv.env;

  const previousVersion = semver.parse(baseVersion);
  if (versionType === "patch" && previousVersion.patch > 0) {
    previousVersion.patch -= 1;
  } else if (previousVersion.minor > 0) {
    previousVersion.minor -= 1;
    previousVersion.patch = "x";
  } else {
    return error("Major look up is not yet supported.");
  }

  info(
    `Trying to find version ${previousVersion.format()} for ${environment}.`
  );

  const changesFile = fs
    .readFileSync(path.join(getRoot(), "CHANGES.md"))
    .toString()
    .split("\n")
    .map((l) => l.trim());

  const currentVersionHeaderIndex = changesFile.findIndex((l) =>
    l.includes(`app-v${baseVersion}`)
  );

  if (currentVersionHeaderIndex === -1) {
    return error(
      `Version ${baseVersion} was not found in the CHANGES.md file.`
    );
  }

  const pattern = (env) => new RegExp(`## app-v(?<version>.*)-${env}`, "g");
  const match = fs
    .readFileSync("CHANGES.md")
    .toString()
    .matchAll(pattern(environment));
  const versions = Array.from(match).map((match) => match.groups.version);

  const previousMaxMinor = semver.maxSatisfying(
    versions,
    previousVersion.format()
  );

  const previousVersionHeaderIndex = changesFile.findIndex((l) =>
    l.includes(`app-v${previousMaxMinor}`)
  );

  if (previousVersionHeaderIndex === -1) {
    return error("The previous version was not found in the CHANGES.md file.");
  }

  const filePath = path.join(outputPath, `changes.txt`);
  fs.writeFileSync(
    filePath,
    changesFile
      .slice(currentVersionHeaderIndex, previousVersionHeaderIndex)
      .filter((l) => !l.startsWith("## "))
      .join("\n")
      .trim()
  );

  info(`File written to ${filePath}.`);
};
