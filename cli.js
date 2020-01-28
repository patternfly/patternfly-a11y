#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { loop, writeCoverage } = require('./lib');

const argv = require('yargs')
  .command({
    command: '--file <file>',
    desc: 'Audit a list of URLs in JSON file',
  })
  .option('file', {
    alias: 'f',
    describe: 'JSON file of URLs to audit',
    type: 'string',
    demandOption: true
  })
  .option('prefix', {
    alias: 'p',
    describe: 'Prefix for all URLs',
    type: 'string',
    default: ''
  })
  .option('crawl', {
    alias: 'c',
    describe: 'Whether to crawl URLs for more URLs',
    type: 'boolean',
    default: false
  })
  .option('aggregate', {
    alias: 'a',
    describe: 'Whether to aggregate tests by component in XML report',
    type: 'boolean',
    default: false
  })
  .option('ignore', {
    alias: 'i',
    describe: 'Comma-seperated list of errors to ignore by id',
    type: 'string',
    default: ''
  })
  .option('skip', {
    alias: 's',
    describe: 'Regex of pages to skip',
    type: 'string',
    default: ''
  })
  .option('ignoreIncomplete', {
    alias: 'iI',
    describe: 'Whether to ignore incomplete errors',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

const jsonFile = argv.file
  ? path.resolve(process.cwd(), argv.file)
  : undefined;

if (fs.existsSync(jsonFile)) {
  loop({
    pages: jsonFile ? require(jsonFile) : [argv._],
    skipRegex: argv.skip,
    prefix: argv.prefix,
    crawl: argv.crawl,
    aggregate: argv.aggregate,
    ignore: argv.ignore,
    ignoreIncomplete: argv.ignoreIncomplete
  });
}
else {
  console.error('Please give a valid JSON file');
}

process.on('SIGINT', () => {
  writeCoverage();
  process.exit(1);
});
