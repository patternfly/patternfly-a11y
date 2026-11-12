const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { recordPage, writeCoverage } = require("../lib/reporter");

test("writeCoverage returns zero when failure exit codes are disabled", () => {
  const originalDirectory = process.cwd();
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "patternfly-a11y-test-"));

  try {
    process.chdir(tempDirectory);
    fs.mkdirSync("coverage");

    recordPage(
      "",
      "/test",
      null,
      process.hrtime(),
      {
        violations: [{ id: "image-alt", nodes: [{ html: "<img>", any: [] }] }],
        incomplete: [],
      },
      1,
      false,
      0,
      null,
      {},
      "document"
    );

    assert.equal(writeCoverage(false, false), 0);
    assert.equal(writeCoverage(false, true), 1);
  } finally {
    process.chdir(originalDirectory);
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
