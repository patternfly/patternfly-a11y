const fs = require("fs");
const { getJunitXml } = require("junit-xml");
const { getHTMLReport } = require("./htmlReport");
const webpack = require("webpack");
const webpackConfig = require("../report/webpack.config");

const report = {};
let completedUrls = 0;

function makeReportMessage(type, error) {
  const messages = error.nodes.map((node) => node.any[0]);

  return {
    message: JSON.stringify(messages, null, 2),
    type: `${type}: ${error.id}`,
  };
}

function makeReport(aggregate) {
  const totalTime = Object.values(report).reduce(
    (prev, cur) => (prev += cur.time),
    0
  );
  const suites = [];

  if (aggregate) {
    // { "aboutmodalbox-": { name: url, incomplete: [], violations: [] } }
    const components = {};

    Object.entries(report).forEach(([key, val]) => {
      const split = key.split("/");
      const context = split[split.length - 4];
      const component = split[split.length - 2];
      const name = `${component}-${context}`;
      components[name] = components[name] || [];
      components[name].push({ name: key, ...val });
    });

    Object.entries(components)
      .sort((e1, e2) => e1[0].localeCompare(e2[0]))
      .forEach(([key, val]) => {
        suites.push({
          name: key,
          timestamp: new Date(),
          time: val.reduce((prev, cur) => (prev += cur.time), 0),
          testCases: Object.values(val).map((testCase) => ({
            name: testCase.name,
            failures: testCase.violations.map((error) =>
              makeReportMessage("violation", error)
            ),
            ...(testCase.incomplete && {
              errors: testCase.incomplete.map((error) =>
                makeReportMessage("incomplete", error)
              ),
            }),
          })),
        });
      });
  } else {
    suites.push({
      name: "All urls",
      timestamp: new Date(),
      time: totalTime,
      testCases: Object.entries(report).map(([key, val]) => ({
        name: key,
        failures: val.violations.map((error) =>
          makeReportMessage("violation", error)
        ),
        ...(val.incomplete && {
          errors: val.incomplete.map((error) =>
            makeReportMessage("incomplete", error)
          ),
        }),
      })),
    });
  }
  return {
    name: "Patternfly axe report",
    time: totalTime,
    suites,
  };
}

function writeConsoleError(suites) {
  const failedSuites = suites.filter((suite) => {
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
  if (failedSuites.length > 0) {
    console.log("\nReport summary");
    failedSuites.forEach((suite) => {
      console.error(`================= ${suite.name} ===================`);
      suite.testCases.forEach((testCase) => {
        const hasFailures = testCase.failures.length > 0;
        const hasIncomplete =
          testCase.incomplete && testCase.incomplete.length > 0;
        if (hasFailures || hasIncomplete) {
          console.error(`     ${testCase.name}`);
        }
        if (hasFailures) {
          console.error(`         Violations`);
          testCase.failures.forEach((error) => console.error(error.message));
        }
        if (hasIncomplete) {
          console.error(`         Incomplete`);
          testCase.incomplete.forEach((error) => console.error(error.message));
        }
      });
    });
  }
}

function writeCoverage(aggregate) {
  if (!fs.existsSync("coverage")) {
    fs.mkdirSync("coverage");
  }

  const testSuiteReport = makeReport(aggregate);
  const suites = Object.values(testSuiteReport.suites);
  const junitXml = getJunitXml(testSuiteReport);
  const htmlReport = getHTMLReport(junitXml, {
    reportTitle: "Patternfly axe report",
  });

  // writeConsoleError(suites);

  fs.writeFileSync("coverage/results.json", JSON.stringify(report, null, 2));
  fs.writeFileSync("coverage/coverage.xml", junitXml);
  fs.writeFileSync("coverage/report.html", htmlReport);

  // Exit code
  if (
    suites.find((suite) =>
      suite.testCases.find((test) => test.failures.length > 0)
    )
  ) {
    return 1;
  }
  if (
    suites.find((suite) =>
      suite.testCases.find(
        (test) => test.incomplete && test.incomplete.length > 0
      )
    )
  ) {
    return 2;
  }

  return 0;
}

const addAnyField = (error) =>
  error.nodes.forEach((node) => {
    // Usually the any field is prefilled with some useful stuff, but if not, add it
    node.any = node.any || [];
    node.any[0] = node.any[0] || { relatedNodes: [] };
    // Add the html that most erorrs report
    node.any[0].relatedNodes.push({ html: node.html });
  });

function recordPage(
  url,
  label,
  startTime,
  axeResults,
  numUrls,
  ignoreIncomplete,
  index,
  screenshotFile,
  axeOptions,
  context
) {
  const elapsed = process.hrtime(startTime);
  // Report program is doing something
  console.log(`\n${++completedUrls}/${numUrls}`.padEnd(10, " "), url);

  if (axeResults.incomplete) {
    axeResults.incomplete.forEach(addAnyField);
  }
  if (axeResults.violations) {
    axeResults.violations.forEach(addAnyField);
  }

  const urlReport = {
    incomplete: axeResults.incomplete,
    violations: axeResults.violations,
    time: elapsed[0] + elapsed[1] / 1000000000,
    screenshotFile,
    url,
    label,
    order: index,
    axeOptions,
    context,
  };

  report[`${index}_${url}`] = urlReport;

  const getIdReport = (errors) =>
    errors
      .map((err) => err.id)
      .sort()
      .join(", ");

  if (urlReport.violations.length > 0) {
    console.log("violations:", getIdReport(urlReport.violations));
  }
  const numIncomplete =
    !ignoreIncomplete && urlReport.incomplete && urlReport.incomplete.length;
  if (numIncomplete) {
    console.error("incomplete:", getIdReport(urlReport.incomplete));
  }
}

function buildPfReport(callback) {
  console.log(`\nBuilding PatternFly report, this can take a minute`);
  webpack(
    {
      ...webpackConfig,
      ...{
        mode: "production",
        performance: {
          hints: false,
          maxEntrypointSize: 512000,
          maxAssetSize: 512000,
        },
      },
    },
    (err, stats) => {
      // Stats Object
      if (err) {
        console.log(`error building PF report`);
        console.log(err);
      }
      console.log(stats.toString("minimal"));
      console.log(`PatternFly report output at coverage/dist`);
      callback();
    }
  );
}

module.exports = {
  writeCoverage,
  recordPage,
  buildPfReport,
};
