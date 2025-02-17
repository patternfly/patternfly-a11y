const path = require("path");
const fs = require("fs-extra");
const { getJunitXml } = require("junit-xml");
const { getHTMLReport } = require("./htmlReport");

const report = {};
let completedUrls = 0;
let exitCode = 0;

function makeReportMessage(type, error) {
  const messages = error.nodes?.map((node) => node.any?.[0]) ?? [];

  return {
    message: JSON.stringify(messages, null, 2),
    type: `${type}: ${error.id}`,
  };
}
const getIdReport = (errors = []) => errors.map((err) => err.id).sort().join(", ") || "None";

function makeReport(aggregate) {
  const totalTime = Object.values(report).reduce((prev, cur) => prev + cur.time, 0);
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
          time: val.reduce((prev, cur) => prev + cur.time, 0),
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
  const failedSuites = suites.filter(suite => 
    suite.testCases.some(testCase => testCase.failures.length > 0 || testCase.incomplete?.length > 0)
  );
  if (failedSuites.length > 0) {
    console.log("\nReport summary");
    failedSuites.forEach(suite => {
      console.error(`================= ${suite.name} ===================`);
      suite.testCases
      .filter(testCase => testCase.failures.length || testCase.incomplete?.length)
      .forEach(testCase => {
          console.error(`     ${testCase.name}`);
          if (testCase.failures.length) console.error("         Violations", testCase.failures.map(e => e.message));
          if (testCase.incomplete?.length) console.error("         Incomplete", testCase.incomplete.map(e => e.message));
    });
    });
  }
}

function writeCoverage(aggregate, exitCodeOnFailure) {
  const testSuiteReport = makeReport(aggregate);
  const suites = Object.values(testSuiteReport.suites);
  const junitXml = getJunitXml(testSuiteReport);
  const htmlReport = getHTMLReport(junitXml, {
    reportTitle: "Patternfly axe report",
  });

  fs.copySync(path.join(__dirname, '../report/dist'), "coverage", { recursive: true });
  fs.writeFileSync("coverage/results.json", JSON.stringify(report, null, 2));
  fs.writeFileSync("coverage/coverage.xml", junitXml);
  fs.writeFileSync("coverage/report.html", htmlReport);

  // Only force exit code here so fail occurs after all files are tested, otherwise will fail on first violation
  if (exitCode > 0) {
    console.error(`\nExiting with code ${exitCode}`);
    process.exit(exitCode);
  }
}

const addAnyField = (error) => {
  if (!error.nodes) return;

  error.nodes.forEach(node => {
    // Usually the any field is prefilled with some useful stuff, but if not, add it
    node.any = Array.isArray(node.any) ? node.any : [];
    node.any[0] = node.any[0] || { relatedNodes: [] };
    // Add the html that most errors report
    node.any[0].relatedNodes.push({ html: node.html });
  });
};

function recordPage(
  prefix,
  url,
  label,
  startTime,
  axeResults,
  numUrls,
  ignoreIncomplete,
  index,
  screenshotFile,
  axeOptions,
  context,
) {
  // Report program is doing something
  console.log(`\n${++completedUrls}/${numUrls}`.padEnd(10, " "), url);

  axeResults?.incomplete?.forEach(addAnyField);
  axeResults?.violations?.forEach(addAnyField);

  const elapsedTime = process.hrtime(startTime).reduce((s, ns) => s + ns / 1e9);
  
  const urlReport = {
    incomplete: axeResults.incomplete || [],
    violations: axeResults.violations || [],
    time: elapsedTime,
    screenshotFile,
    prefix,
    url,
    label,
    order: index,
    axeOptions,
    context,
  };

  report[`${index}_${url}`] = urlReport;

  const hasViolations = urlReport.violations.length > 0;
  const hasIncomplete = !ignoreIncomplete && urlReport.incomplete.length > 0;
  
  if (hasViolations) {
    console.log("violations:", getIdReport(urlReport.violations));
    exitCode = 1;
  }
  if (hasIncomplete) {
    console.error("incomplete:", getIdReport(urlReport.incomplete));
    exitCode = exitCode === 1 ? 1 : 2;
  }
}

module.exports = {
  writeCoverage,
  recordPage,
};
