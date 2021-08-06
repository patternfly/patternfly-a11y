const os = require("os");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { Cluster } = require("puppeteer-cluster");
const axeScriptPath = require.resolve("axe-core");
const { recordPage } = require("./reporter");

// works more reliably than page.addScriptTag({ path: axeScriptPath });
async function injectFile(page, filePath) {
  let contents = await new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
  contents += `//# sourceURL=` + filePath.replace(/\n/g, "");
  return page.mainFrame().evaluate(contents);
}

async function testPage({ page, data, worker }) {
  const {
    url,
    index,
    prefix = "",
    axeOptions,
    crawl,
    urls,
    skipRegex,
    cluster,
    ignoreIncomplete,
    waitFor,
    label,
    afterNav,
    screenshots,
    context,
  } = data;

  await page.goto(`${prefix}${url}`, { waitUntil: "load", timeout: 0 });
  // wait for page to be fully loaded
  waitFor && (await waitFor(page));
  // run post-nav function if specified
  afterNav && (await afterNav(page));

  let screenshotFile;
  if (screenshots) {
    const screenshotsDir = "./coverage/screenshots";
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    screenshotFile = `${index}${
      label ? `_${label}` : url.replace(/[^a-zA-Z0-9]/g, "_")
    }.png`;
    const path = `${screenshotsDir}/${screenshotFile}`;
    await page.setViewport({ width: 1920, height: 1080 });
    await page.screenshot({ path });
    // console.log(`Screenshot of ${url} saved: ${path}`);
  }

  // Inject IIFE script
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  const startTime = process.hrtime();
  await page.setBypassCSP(true);
  // await page.addScriptTag({ path: axeScriptPath });
  await injectFile(page, axeScriptPath);
  const axeResults = await page.evaluate(
    (context, options) => {
      console.log(context);
      console.log(`window.axe: ${window.axe}`);
      const asd = window.axe;
      debugger;
      return window.axe.run(eval(context), options);
    },
    context,
    axeOptions
  );

  recordPage(
    url,
    label,
    startTime,
    axeResults,
    urls.length,
    ignoreIncomplete,
    index,
    screenshotFile,
    axeOptions,
    context
  );

  if (crawl) {
    console.log(`crawling: ${prefix}`);
    (
      await page.$$eval("a", (links) =>
        links.map((link) => {
          return link.href;
        })
      )
    )
      .map((href) =>
        href
          .replace(/#.*/, "") // Remove after # (anchor links)
          .replace(/\/$/, "") // Remove trailing /
          .replace(prefix, "")
      )
      .map((href) => href.trim())
      .filter(Boolean)
      .filter((href) => href.startsWith("/") || href.startsWith(prefix)) // On same site
      .filter((href) => !skipRegex.test(href))
      .forEach((href) => {
        if (!urls.includes(href)) {
          console.log(`pushing ${href}`);
          urls.push(href);
          cluster.queue({
            ...data,
            url: href,
          });
        }
      });
  }
}

async function testUrls(urls, options) {
  console.log(urls);
  const cluster = await Cluster.launch({
    // New incognito window
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: os.cpus().length,
    timeout: 120000,
    monitor: false,
    workerCreationDelay: 100,
    skipDuplicateUrls: false,
    retryLimit: 2,
    puppeteer,
    puppeteerOptions: {
      headless: true,
      devtools: false,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
    },
  });

  let errors = 0;
  cluster.on("taskerror", (err, data, willRetry) => {
    if (willRetry) {
      console.warn(
        `Encountered an error while crawling ${data.url}. ${err.message}\nThis job will be retried`
      );
    } else {
      console.error(`Failed to crawl ${data.url}: ${err.message}`);
      errors++;
    }
  });

  // auth first if specified
  if (options.auth) {
    try {
      await cluster.task(options.auth);
      await cluster.execute(options);
    } catch (err) {
      console.log(err);
    }
  }

  // Create axe reporting task
  await cluster.task(testPage);

  const ignoredRules = options.ignoreRules.split(",").reduce((acc, rule) => {
    acc[rule] = { enabled: false };
    return acc;
  }, {});
  const tags = options.tags ? options.tags.split(",") : null;
  const axeOptions = {
    reporter: options.ignoreIncomplete ? "no-passes" : "v2",
    rules: {
      ...ignoredRules,
    },
    ...(tags
      ? {
          runOnly: {
            type: "tag",
            values: tags,
          },
        }
      : {}),
  };

  // Default to regex that never matches
  const skipRegex = new RegExp(options.skip || "$.");

  urls = urls.filter((url) => !skipRegex.test(url));
  urls.forEach((url, index) => {
    cluster.queue({
      prefix: options.prefix,
      url: typeof url === "string" ? url : url.url,
      index,
      urls,
      skipRegex,
      cluster,
      axeOptions,
      ignoreIncomplete: options.ignoreIncomplete,
      crawl: options.crawl,
      waitFor: options.waitFor,
      label: typeof url === "object" ? url.label : null,
      afterNav: typeof url === "object" ? url.afterNav : null,
      screenshots: options.screenshots,
      context: options.context,
    });
  });

  await cluster.idle();
  await cluster.close().then(() => {
    if (urls.length === errors) {
      // all urls failed, exit
      process.exit(3);
    }
  });
}

module.exports = {
  testUrls,
};
