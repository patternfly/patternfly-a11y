#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { loop, writeCoverage } = require('./lib');

// TODO: Use meow + component mapping
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
  .help()
  .argv;

const jsonFile = argv.file
  ? path.resolve(process.cwd(), argv.file)
  : undefined;

if (fs.existsSync(jsonFile)) {
  loop({
    pages: jsonFile ? require(jsonFile) : [argv._],
    prefix: argv.prefix,
    crawl: argv.crawl
  });
}
else {
  console.error('Please give a valid JSON file');
}

process.on('SIGINT', () => {
  writeCoverage();
  process.exit(1);
});
