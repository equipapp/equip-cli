const fs = require("fs");
const os = require("os");

exports.command = "login <token>";
exports.desc =
  "Login to GitHub. Create a personal access token at https://github.com/settings/tokens/new?scopes=repo";
exports.builder = {
  token: { describe: "Personal Access Token.", type: "string" },
};
exports.handler = async (argv) => {
  const HOME = os.homedir();
  if (!fs.existsSync(`${HOME}/.equip`)) {
    fs.mkdirSync(`${HOME}/.equip`);
  }
  fs.writeFileSync(
    `${HOME}/.equip/.git.conf.json`,
    JSON.stringify({ auth: argv.token })
  );
};
