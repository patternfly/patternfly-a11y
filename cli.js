#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();

const { testUrls } = require('./lib/testUrls');
const { writeCoverage } = require('./lib/reporter');

program
  .version(require('./package.json').version)
  .arguments('<urls or urlFile>')
  .description('Test URL(s) using puppeteer and axe.')
  .option('-p, --prefix <prefix>', 'Prefix for listed urls (like https://localhost:9000)')
  .option('-c, --crawl', 'Whether to crawl URLs for more URLs', false)
  .option('-s, --skip', 'Regex of pages to skip', '')
  .option('-a, --aggregate', 'Whether to aggregate tests by component (by splitting URL) in XML report')
  .option('-ir, --ignore-rules <rules>', 'Comma-seperated list of error ids to ignore', 'color-contrast')
  .option('-iI, --ignore-incomplete', 'Whether to ignore incomplete errors from axe', true)
  .action(runPuppeteer);

function runPuppeteer(urls, options) {
  // Check if urls is a JSON file which is a list of URLs
  let pages = []; // string[]
  try {
    pages = require(urls);
  }
  catch (exception) {
    pages = urls.split(',');
  }

  const writeCoverageFn = () => writeCoverage(options.aggregate, options.ignoreIncomplete);

  testUrls(pages, options)
    .then(writeCoverageFn);

  process.on('SIGINT', () => {
    console.log('Writing coverage\n');
    writeCoverageFn();
    process.exit(1);
  });
}

program.parse(process.argv);
