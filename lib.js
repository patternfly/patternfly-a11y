const fs = require('fs');
const { Builder, Capabilities, By } = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');
const { getJunitXml } = require('junit-xml');

let pages = [];
const report = {};
let exitCode = 0;

let chromeOptions = process.env.CI
  ? { args: ['--headless'] }
  : { args: ['--incognito', '--window-size=768,1024'] };

const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set('chromeOptions', chromeOptions);
let driver = undefined;

function buildReport(error) {
  // We like the `any` field, so add what we want to report to there
  error.nodes.forEach(node => node.any[0].relatedNodes.push({ html: node.html }));

  return error;
}

function logError(nodes) {
  nodes.forEach(error => error.nodes.forEach(node => console.error(JSON.stringify(node.any[0], null, 2))))
}

function runAxe(pagePath) {
  return new Promise((res, rej) => AxeBuilder(driver)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
    .then(results => {
      report[pagePath] = {
        incomplete: results.incomplete.map(buildReport),
        violations: results.violations.map(buildReport)
      };
      const pageReport = report[pagePath];
      if (pageReport.incomplete.length > 0 || pageReport.violations.length > 0) {
        exitCode = 2;
      }
      if (pageReport.incomplete.length > 0) {
        console.error('================= Errors ===================');
        logError(pageReport.incomplete);
      }
      if (pageReport.violations.length > 0) {
        console.error('================= Failures =================');
        logError(pageReport.violations);
      }
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

function crawlPage() {
  return new Promise((res, rej) => {
    driver.findElements(By.tagName('a'))
      .then(crawlItems)
      .then(res)
      .catch(rej);
  });
}

function testPage(pagePath, options) {
  const startTime = process.hrtime();
  return new Promise((res, rej) => driver.get(pagePath).then(() => {
    const promises = [runAxe(pagePath)];
    if (options.crawl) {
      promises.push(crawlPage());
    }
    Promise.all(promises)
      .then(() => {
        const elapsed = process.hrtime(startTime);
        report[pagePath].time = elapsed[0] + elapsed[1] / 1000000000;
      })
      .then(res)
      .catch(rej);
    })
  );
}

function makeMessage(type, error) {
  let message = '';
  error.nodes.forEach(node => message += JSON.stringify(node.any[0], null, 2) + '\n');

  return { message, type: `${type}: ${error.id}` };
}

function makeReport(aggregate, noIncomplete) {
  const totalTime = Object.values(report).reduce((prev, cur) => prev += cur.time, 0);
  const suites = [];

  if (aggregate) {
    const components = {};

    Object.entries(report).forEach(([key, val]) => {
      const split = key.split('/');
      const context = split[split.length - 4];
      const component = split[split.length - 2];
      components[`${component}-${context}`] = (components[`${component}-${context}`] || []);
      components[`${component}-${context}`].push({ name: key, ...val });
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
            failures: testCase.violations.map(error => makeMessage('violation', error)),
            ...(!noIncomplete && { errors: testCase.incomplete.map(error => makeMessage('incomplete', error)) })
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
        failures: val.violations.map(error => makeMessage('violation', error)),
        ...(!noIncomplete && { errors: val.incomplete.map(error => makeMessage('incomplete', error)) })
      }))
    })
  }
  return {
    name: 'aXe A11y Crawler',
    time: totalTime,
    suites
  }
}

function writeCoverage(aggregate, noIncomplete) {
  if (!fs.existsSync('coverage')) {
    fs.mkdirSync('coverage');
  }

  const testSuiteReport = makeReport(aggregate, noIncomplete);
  const junitXml = getJunitXml(testSuiteReport);
  fs.writeFileSync('coverage/results.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('coverage/coverage.xml', junitXml);
}

async function loop(options) {
  driver = new Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();
  pages = options.pages;
  for (let i = 0; i < pages.length; i++) {
    const page =  options.prefix + pages[i];
    console.log(`${i}/${pages.length} ${page}`);
    try {
      await testPage(page, options);
    } catch(err) {
      console.error(`Problem testing ${page}: ${err}`);
    }
  }
  await driver.quit();
  writeCoverage(options.aggregate, options.noIncomplete);
  process.exit(exitCode);
}

module.exports = {
  loop,
  writeCoverage
}
