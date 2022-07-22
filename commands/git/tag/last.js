const { getLastTag } = require("../../../lib/git");

exports.command = "last [type] [env]";
exports.desc = "Creates a new staging tag";
exports.builder = {
  type: {
    describe: "Type of tag (app or server)",
    type: "string",
    default: "app",
  },
  env: {
    describe: "Environment of tag (staging or release)",
    type: "string",
    default: "staging",
  },
};
exports.handler = async (argv) => {
  console.log(getLastTag(argv.type, argv.env).stdout.toString().trim());
};
