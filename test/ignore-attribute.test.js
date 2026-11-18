const assert = require("node:assert/strict");
const { test } = require("node:test");
const puppeteer = require("puppeteer");
const { runAxe } = require("../lib/runAxe");

test("data-a11y-ignore filters only matching rules on the annotated element", async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(`
      <img id="ignored-image" src="ignored.png" data-a11y-ignore="color-contrast, image-alt">
      <img id="reported-image" src="reported.png" data-a11y-ignore="color-contrast">
    `);
    await page.addScriptTag({ path: require.resolve("axe-core") });

    const results = await page.evaluate(runAxe, "document", {
      runOnly: { type: "rule", values: ["image-alt"] },
    });
    const imageAltViolation = results.violations.find((violation) => violation.id === "image-alt");

    assert.ok(imageAltViolation);
    assert.equal(imageAltViolation.nodes.length, 1);
    assert.match(imageAltViolation.nodes[0].html, /id="reported-image"/);
  } finally {
    await browser.close();
  }
});

test("runAxe tolerates axe result lists that are omitted", async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.evaluate(() => {
      window.axe = {
        run: async () => ({ violations: [] }),
      };
    });

    const results = await page.evaluate(runAxe, "document", {});

    assert.deepEqual(results.violations, []);
    assert.deepEqual(results.incomplete, []);
  } finally {
    await browser.close();
  }
});
