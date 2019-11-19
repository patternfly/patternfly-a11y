/* eslint no-console: 0 */
const fs = require('fs');
const { Builder, Capabilities, By } = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');
const { getJunitXml } = require('junit-xml');

const pages = [
  'https://www.patternfly.org/v4'
];
const violatingPages = {};

let chromeOptions = process.env.CI
  ? { args: ['--headless'] }
  : { args: ['--incognito', '--window-size=768,1024'] };

const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set('chromeOptions', chromeOptions);
const driver = new Builder()
  .forBrowser('chrome')
  .withCapabilities(chromeCapabilities)
  .build();

function runAxe(pagePath) {
  return new Promise((res, rej) => AxeBuilder(driver)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
    .then(results => {
      violatingPages[pagePath] = {
        incomplete: results.incomplete,
        violations: results.violations
      };
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
        if (href.includes('http') // Valid URL
            && !pages.includes(href) // Hasn't been crawled already
            && href.startsWith(pages[0]) // On base URL
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

function testPage(pagePath) {
  const startTime = process.hrtime();
  return new Promise((res, rej) => driver.get(pagePath).then(() => {
      Promise.all([
        runAxe(pagePath),
        crawlPage()
      ])
        .then(() => {
          const elapsed = process.hrtime(startTime);
          violatingPages[pagePath].time = elapsed[0] + elapsed[1] / 1000000000;
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

function writeCoverage() {
  if (!fs.existsSync('coverage')) {
    fs.mkdirSync('coverage');
  }

  const totalTime = Object.values(violatingPages).reduce((prev, cur) => prev += cur.time, 0);
  const testSuiteReport = {
    name: 'aXe A11y Crawler',
    time: totalTime,
    suites: [
      {
        name: pages[0],
        timestamp: new Date(),
        time: totalTime,
        testCases: Object.entries(violatingPages).map(([key, val]) => ({
          name: key,
          errors: val.incomplete.map(error => makeMessage('incomplete', error)),
          failures: val.violations.map(error => makeMessage('violation', error)),
        }))
      }
    ],
  };
  const junitXml = getJunitXml(testSuiteReport);
  fs.writeFileSync('coverage/results.json', JSON.stringify(violatingPages, null, 2));
  fs.writeFileSync('coverage/coverage.xml', junitXml);
}

async function loop() {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`${i}/${pages.length} ${page}`);
    try {
      await testPage(page);
    } catch(err) {
      console.error(`Problem testing ${page}: ${err}`);
    }
  }
  await driver.quit();
  writeCoverage();
}

loop();

process.on('SIGINT', () => {
  writeCoverage();
  process.exit(1);
});
