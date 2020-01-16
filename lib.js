const fs = require('fs');
const { Builder, Capabilities, By } = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');
const { getJunitXml } = require('junit-xml');
const { getHTMLReport } = require('./htmlReport');

let chromeOptions = process.env.CI
  ? { args: ['--headless'] }
  : { args: ['--incognito', '--window-size=768,1024'] };
const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set('chromeOptions', chromeOptions);

// List of pages to crawl
let pages = [];
const report = {};
let exitCode = 0;

function filterError(error, options) {
  const ignored = options.ignore.split(',');
  if (ignored.includes(error.id)) {
    console.log('Ignored', error.id);
    return false;
  }

  return true;
}

function logErrors(pageReport, options) {
  const logError = nodes => nodes
    .filter(error => filterError(error, options))
    .forEach(error => error.nodes.forEach(node => console.error(JSON.stringify(node.any[0], null, 2))));
  if (pageReport.incomplete.length > 0 && !options.ignoreIncomplete) {
    console.error('================= Incomplete ===================');
    logError(pageReport.incomplete);
  }
  if (pageReport.violations.length > 0) {
    console.error('================= Violations =================');
    logError(pageReport.violations);
  }
}

function runAxe(driver, pagePath, options) {
  return new Promise((res, rej) => AxeBuilder(driver)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
    .then(results => {
      // We like the `node.any` field, so add what we want to report to there
      const addAnyField = error => error.nodes.forEach(node => node.any[0].relatedNodes.push({ html: node.html }));
      results.incomplete.forEach(addAnyField);
      results.violations.forEach(addAnyField);

      const pageReport = {
        incomplete: results.incomplete.filter(error => filterError(error, options)),
        violations: results.violations.filter(error => filterError(error, options))
      };
      if (pageReport.incomplete.length > 0 || pageReport.violations.length > 0) {
        exitCode = 1;
      }
      logErrors(pageReport, options);
      report[pagePath] = pageReport;
    })
    .then(res)
    .catch(rej)
  );
}

function crawlItem(item) {
  return new Promise((res, rej) => {
    item.getAttribute('href')
      .then(href => {
        if (!href) {
          res();
        }
        href = href
          .replace(/#.*/, '') // Remove after # (anchor links)
          .replace(/\/$/, ''); // Remove trailing /
        if (!pages.includes(href) // Hasn't been crawled already
            && (href.startsWith(pages[0]) || href.startsWith('/')) // On base URL
            ) {
          pages.push(href);
        }
      })
      .then(res)
      .catch(rej);
  });
}

function crawlItems(items) {
  return Promise.all(items.map(crawlItem));
}

function crawlPage(driver) {
  return new Promise((res, rej) => {
    driver.findElements(By.tagName('a'))
      .then(crawlItems)
      .then(res)
      .catch(rej);
  });
}

function testPage(driver, pagePath, options) {
  return new Promise((res, rej) => driver.get(pagePath).then(() => {
    const startTime = process.hrtime();
    Promise.all([
      runAxe(driver, pagePath, options),
      ...(options.crawl ? [crawlPage(driver)] : [])
    ])
      .then(() => {
        const elapsed = process.hrtime(startTime);
        report[pagePath].time = elapsed[0] + elapsed[1] / 1000000000;
      })
      .then(res)
      .catch(rej);
    })
  );
}

function makeReportMessage(type, error) {
  const messages = error.nodes.map(node => node.any[0]);

  return { message: JSON.stringify(messages, null, 2), type: `${type}: ${error.id}` };
}

function makeReport(aggregate, ignoreIncomplete) {
  const totalTime = Object.values(report).reduce((prev, cur) => prev += cur.time, 0);
  const suites = [];

  if (aggregate) {
    // { "aboutmodalbox-": { name: url, incomplete: [], violations: [] } }
    const components = {};

    Object.entries(report).forEach(([key, val]) => {
      const split = key.split('/');
      const context = split[split.length - 4];
      const component = split[split.length - 2];
      const name = `${component}-${context}`;
      components[name] = (components[name] || []);
      components[name].push({ name: key, ...val });
    });

    Object.entries(components)
      .sort((e1, e2) => e1[0].localeCompare(e2[0]))
      .forEach(([key, val]) => {
        suites.push({
          name: key,
          timestamp: new Date(),
          time: val.reduce((prev, cur) => prev += cur.time, 0),
          testCases: Object.values(val).map(testCase => ({
            name: testCase.name,
            failures: testCase.violations.map(error => makeReportMessage('violation', error)),
            ...(!ignoreIncomplete && { errors: testCase.incomplete.map(error => makeReportMessage('incomplete', error)) })
          }))
        });
      });
  }
  else {
    suites.push({
      name: pages[0],
      timestamp: new Date(),
      time: totalTime,
      testCases: Object.entries(report).map(([key, val]) => ({
        name: key,
        failures: val.violations.map(error => makeReportMessage('violation', error)),
        ...(!ignoreIncomplete && { errors: val.incomplete.map(error => makeReportMessage('incomplete', error)) })
      }))
    });
  }
  return {
    name: 'aXe A11y Crawler',
    time: totalTime,
    suites
  }
}

function writeConsoleError(testSuiteReport) {
  const suites = Object.values(testSuiteReport.suites)
    .filter(suite => {
      for (let testCase of suite.testCases) {
        if (testCase.failures.length > 0) {
          return true;
        }
        if (testCase.errors && testCase.errors.length > 0) {
          return true;
        }
      }
      return false;
    });
  if (suites.length > 0) {
    console.log('\nReport summary');
    suites.forEach(suite => {
      console.error(`================= ${suite.name} ===================`);
      suite.testCases.forEach(testCase => {
        if (testCase.errors && testCase.errors.length > 0) {
          console.error(`Incomplete for ${testCase.name}`);
          testCase.errors.forEach(error => console.error(error.message));
        }
        if (testCase.failures.length > 0) {
          console.error(`Violations for ${testCase.name}`);
          testCase.failures.forEach(error => console.error(error.message));
        }
      });
    });
  }
}

function writeCoverage(aggregate, ignoreIncomplete) {
  if (!fs.existsSync('coverage')) {
    fs.mkdirSync('coverage');
  }

  const testSuiteReport = makeReport(aggregate, ignoreIncomplete);
  const junitXml = getJunitXml(testSuiteReport);
  const htmlReport = getHTMLReport(junitXml, { reportTitle: 'aXe A11y Crawler' });

  writeConsoleError(testSuiteReport);
  fs.writeFileSync('coverage/results.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('coverage/coverage.xml', junitXml);
  fs.writeFileSync('coverage/report.html', htmlReport);
}

async function loop(options) {
  const driver = new Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();
  pages = options.pages;
  for (let i = 0; i < pages.length; i++) {
    const page = `${options.prefix}${pages[i]}`;
    console.log(`${i + 1}/${pages.length} ${page}`);
    try {
      await testPage(driver, page, options);
    } catch(err) {
      console.error(`Problem testing ${page}: ${err}`);
    }
  }
  await driver.quit();
  writeCoverage(options.aggregate, options.ignoreIncomplete);
  process.exit(exitCode);
}

module.exports = {
  loop,
  writeCoverage
}
