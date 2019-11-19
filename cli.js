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
  .option('crawl', {
    alias: 'c',
    describe: 'Whether to crawl URLs for more URLs',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

const jsonFile = path.resolve(process.cwd(), argv.file);

if (fs.existsSync(jsonFile)) {
  loop({
    pages: require(jsonFile),
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
