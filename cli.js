#!/usr/bin/env node
const path = require('path');
const { Command } = require('commander');
const program = new Command();

const { testUrls } = require('./lib/testUrls');
const { writeCoverage } = require('./lib/reporter');

program
  .version(require('./package.json').version)
  .arguments('<urls or urlFile> [otherUrls...]')
  .description('Test URL(s) using puppeteer and axe.')
  .option('-c, --config <file>', 'Path to config file', 'patternfly-a11y.config.js')
  .option('-p, --prefix <prefix>', 'Prefix for listed urls (like https://localhost:9000)')
  .option('-cr, --crawl', 'Whether to crawl URLs for more URLs', false)
  .option('-s, --skip', 'Regex of pages to skip')
  .option('-a, --aggregate', 'Whether to aggregate tests by component (by splitting URL) in XML report', false)
  .option('-ir, --ignore-rules <rules>', 'Comma-seperated list of error ids to ignore', 'color-contrast')
  .option('-iI, --ignore-incomplete', 'Whether to ignore incomplete errors from axe', true)
  .action(runPuppeteer);

function runPuppeteer(urls, otherUrls, options) {
  // Check if urls is a JSON file which is a list of URLs
  const pages = otherUrls; // string[]
  try {
    pages.push(...require(path.resolve(process.cwd(), urls)));
  }
  catch (exception) {
    pages.push(...urls.split(','));
  }

  // Load config file
  try {
    const config = require(path.resolve(process.cwd(), options.config));
    Object.entries(config).forEach(([key, val]) => options[key] = val);
  }
  catch (exception) {
    // Pass
  }

  const writeCoverageFn = () => writeCoverage(options.aggregate);

  testUrls(pages, options)
    .then(() => process.exit(writeCoverageFn()));

  process.on('SIGINT', () => {
    console.log('Writing coverage\n');
    process.exit(writeCoverageFn());
  });
}

program.parse(process.argv);
