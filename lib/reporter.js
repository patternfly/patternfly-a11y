const fs = require('fs');
const { getJunitXml } = require('junit-xml');
const { getHTMLReport } = require('./htmlReport');

const report = {};
let processedUrls = 0;

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
            ...(testCase.incomplete && { errors: testCase.incomplete.map(error => makeReportMessage('incomplete', error)) })
          }))
        });
      });
    
  }
  else {
    suites.push({
      name: 'All urls',
      timestamp: new Date(),
      time: totalTime,
      testCases: Object.entries(report).map(([key, val]) => ({
        name: key,
        failures: val.violations.map(error => makeReportMessage('violation', error)),
        ...(val.incomplete && { errors: val.incomplete.map(error => makeReportMessage('incomplete', error)) })
      }))
    });
  }
  return {
    name: 'Patternfly axe report',
    time: totalTime,
    suites
  };
}

function writeConsoleError(testSuiteReport) {
  const suites = Object.values(testSuiteReport.suites)
    .filter(suite => {
      for (let testCase of suite.testCases) {
        if (testCase.failures.length > 0) {
          return true;
        }
        if (testCase.incomplete && testCase.incomplete.length > 0) {
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
        const hasFailures = testCase.failures.length > 0;
        const hasIncomplete = testCase.incomplete && testCase.incomplete.length > 0;
        if (hasFailures || hasIncomplete) {
          console.error(`     ${testCase.name}`);
        }
        if (hasFailures) {
          console.error(`         Violations`);
          testCase.failures.forEach(error => console.error(error.message));
        }
        if (hasIncomplete) {
          console.error(`         Incomplete`);
          testCase.incomplete.forEach(error => console.error(error.message));
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

  // writeConsoleError(testSuiteReport);

  fs.writeFileSync('coverage/results.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('coverage/coverage.xml', junitXml);
  fs.writeFileSync('coverage/report.html', htmlReport);
}

const addAnyField = error => error.nodes
  .filter(node => node.any && node.any[0] && node.any[0].relatedNodes)
  .forEach(node => node.any[0].relatedNodes.push({ html: node.html }));

function recordPage(url, startTime, axeResults, numUrls, ignoreIncomplete) {
  const elapsed = process.hrtime(startTime);
  // Report program is doing something
  processedUrls++;
  console.log(`${`${processedUrls}/${numUrls}`.padEnd(10, ' ')} ${url}`);

  if (axeResults.incomplete) {
    axeResults.incomplete.forEach(addAnyField);
  }
  if (axeResults.violations) {
    axeResults.violations.forEach(addAnyField);
  }

  const urlReport = {
    incomplete: axeResults.incomplete,
    violations: axeResults.violations,
    time: elapsed[0] + elapsed[1] / 1000000000
  };

  report[url] = urlReport;

  const getIdReport = errors => errors.map(err => err.id).sort().join(', ');

  if (urlReport.violations.length > 0) {
    console.log('violations:', getIdReport(urlReport.violations));
  }
  const numIncomplete = !ignoreIncomplete && urlReport.incomplete && urlReport.incomplete.length;
  if (numIncomplete) {
    console.error('incomplete:', getIdReport(urlReport.incomplete));
  }
}

module.exports = {
  writeCoverage,
  recordPage
};
