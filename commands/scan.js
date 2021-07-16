const { getIPRange } = require("get-ip-range");
const fetch = require("node-fetch");
const chalk = require("chalk");
const logUpdate = require("log-update");
const prettyMs = require("pretty-ms");

const getPercentage = (ratio) => {
  const leftValue = Math.floor(ratio * 100);
  const left = leftValue.toString().padStart(3, " ");
  const right = Math.round(ratio * 1000 - leftValue * 10);
  return `${left}.${right}`;
};

const progress = (done, total) => {
  const { columns } = process.stdout;
  const percent = getPercentage(done / total);
  const barLength = columns - 29;
  const doneLength = Math.round((done / total) * barLength);
  const remainsLength = barLength - doneLength;
  const doneBar = chalk.green("█").repeat(doneLength);
  const remainsBar = chalk.gray("─").repeat(remainsLength);
  const bar = `|${doneBar}${remainsBar}|`;
  return chalk.yellow(`Progress: ${bar} ${percent}% Complete`);
};

const formatStationInfo = (info) => {
  const ip = chalk.green(info.ip.toString());
  const vpn = chalk.green(info.vpn?.ip.toString());
  const vpnkey = chalk.gray(info.vpn?.publicKey?.trimEnd?.());
  const pubkey = chalk.gray(info.publicKey?.trimEnd?.());
  return [
    "",
    chalk.cyan(`Found a station at ${ip}, VPN address is ${vpn}`),
    chalk.cyan(`VPN Public Key: ${vpnkey}`),
    chalk.cyan(`Public Key: ${pubkey}`),
    "",
  ].join("\n");
};

const template = (done, current, total, found) => {
  return [
    ...found.map(formatStationInfo),
    current ? chalk.cyan(`Scanning: ${current}`) : null,
    progress(done, total),
  ]
    .filter(Boolean)
    .join("\n");
};

const scan = async (range, timeout) => {
  console.log(chalk.green(`Scanning ${range} for Equip stations`));
  const ips = getIPRange(range);
  const { length } = ips;
  console.log(chalk.green(`There are a total of ${length} IPs in this range`));
  const ETA = prettyMs(length * timeout);
  if (length * timeout <= 2 * 60 * 1000) {
    console.log(chalk.green(`This is going to take about ${ETA} to finish 🚀`));
  } else if (length * timeout <= 10 * 60 * 1000) {
    console.log(
      chalk.yellow(`This is going to take about ${ETA} to finish 🐇`)
    );
  } else {
    console.log(chalk.red(`This is going to take about ${ETA} to finish 🐢`));
    console.log(
      chalk.red(`Consider adjusting either the timeout or the IP range!`)
    );
  }
  const found = [];
  let done = 0;
  for (const ip of ips) {
    logUpdate(template(done, ip, length, found));
    const addr = `http://${ip}:6444`;
    const resp = await fetch(addr, { timeout }).catch(() => {});
    const data = await resp?.json().catch(() => {});
    if (data?.isEquipStation) {
      found.push(data);
    }
    done++;
  }
  logUpdate(template(done, null, ips.length, found));
};

exports.command = "scan [range] [timeout]";
exports.desc = "Scan a range of IPs for Equip stations";
exports.builder = function (yargs) {
  return yargs
    .option("range", {
      describe: "Range to scan",
      default: "10.0.0.0/24",
    })
    .option("timeout", {
      describe: "Timeout for connections",
      type: Number,
      default: 2000,
    });
};
exports.handler = function (argv) {
  scan(argv.range, argv.timeout);
};
