#!/usr/bin/env node
const path = require("path");
const { Command } = require("commander");
const program = new Command();

const { testUrls } = require("./lib/testUrls");
const { writeCoverage, buildPfReport } = require("./lib/reporter");

program
  .version(require("./package.json").version)
  .arguments("[urls or urlFile] [otherUrls...]")
  .description("Test URL(s) using puppeteer and axe.")
  .option("-c, --config <file>", "Path to config file")
  .option(
    "-p, --prefix <prefix>",
    "Prefix for listed urls (like https://localhost:9000)"
  )
  .option("-cr, --crawl", "Whether to crawl URLs for more URLs", false)
  .option("-s, --skip <regex>", "Regex of pages to skip")
  .option(
    "-a, --aggregate",
    "Whether to aggregate tests by component (by splitting URL) in XML report",
    false
  )
  .option("--no-screenshots", "Whether to save screenshots of visited pages")
  .option(
    "-ir, --ignore-rules <rules>",
    "Axe: Comma-separated list of error ids to ignore",
    "color-contrast"
  )
  .option(
    "-iI, --ignore-incomplete",
    "Axe: Whether to ignore incomplete errors",
    false
  )
  .option(
    "-t, --tags <tags>",
    "Axe: Comma-separated list of accessibility (WCAG) tags to run against",
    "wcag2a,wcag2aa"
  )
  .option(
    "-ctx, --context <context>",
    'Axe: Context to run in, defaults to document, can be set to a different selector, i.e. document.getElementById("content")',
    "document"
  )
  .option(
    "-pfr, --pf-report",
    "Builds out the full PatternFly a11y report into coverage/dist",
    true
  )
  .action(runPuppeteer);

function runPuppeteer(urls, otherUrls, options) {
  // Load config file
  if (options.config) {
    try {
      const config = require(path.resolve(process.cwd(), options.config));
      Object.entries(config).forEach(([key, val]) => {
        options[key] = val;
      });
    } catch (exception) {
      // Log exception but continue
      console.log(exception);
    }
  }

  // Check if urls is a JSON file which is a list of URLs
  const pages = otherUrls; // string[]
  if (urls) {
    try {
      pages.push(...require(path.resolve(process.cwd(), urls)));
    } catch (exception) {
      pages.push(...urls.split(","));
    }
  }

  const writeCoverageFn = () =>
    writeCoverage(options.aggregate, options.screenshots);

  testUrls(pages && pages.length ? pages : options.urls, options).then(() => {
    const exitCode = writeCoverageFn();
    if (options.pfReport) {
      buildPfReport(() => process.exit(exitCode));
    }
  }
  );

  process.on("SIGINT", () => {
    console.log("Writing coverage\n");
    process.exit(writeCoverageFn());
  });
}

program.parse(process.argv);
