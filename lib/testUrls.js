const os = require('os')
const { Cluster } = require('puppeteer-cluster');
const axeScriptPath = require.resolve('axe-core');
const { recordPage } = require('./reporter');

async function testPage({ page, data, worker }) {
  const { url, prefix, axeOptions, crawl, urls, skipRegex, cluster, ignoreIncomplete } = data;
  await page.goto(`${prefix}${url}`, { waitUntil: 'domcontentloaded' });
  await page.setBypassCSP(true);

  // Inject IIFE script
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  const startTime = process.hrtime();
  await page.addScriptTag({ path: axeScriptPath });
  const axeResults = await page.evaluate(options => window.axe.run(document, options), axeOptions)

  recordPage(url, startTime, axeResults, urls.length, ignoreIncomplete);
  if (crawl) {
    (await page.$$eval('a', links => links.map(link => link.href)))
      .map(href => href.replace(/#.*/, '') // Remove after # (anchor links)
      .replace(/\/$/, '') // Remove trailing /
      .replace(prefix, ''))
      .map(href => href.trim())
      .filter(Boolean)
      .filter(href => href.startsWith('/') || href.startsWith(prefix)) // On same site
      .filter(href => !skipRegex.test(href))
      .forEach(href => {
        if (!urls.includes(href)) {
          urls.push(href);
          cluster.queue({
            ...data,
            url: href
          });
        };
      });
  }
}

async function testUrls(urls, options) {
  const cluster = await Cluster.launch({
    // New incognito window
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: os.cpus().length,
  });

  // Create axe reporting task
  await cluster.task(testPage);

  const ignoredRules = options.ignoreRules
    .split(',')
    .reduce((acc, rule) => {
      acc[rule] = { enabled: false };
      return acc;
    }, {});
  const axeOptions = {
    reporter: options.ignoreIncomplete ? 'no-passes' : 'v2',
    rules: {
      ...ignoredRules
    }
  };

  // Default to regex that never matches
  const skipRegex = new RegExp(options.skip || '$.');

  urls = urls.filter(url => !skipRegex.test(url));
  urls.forEach(url => cluster.queue({
    prefix: options.prefix,
    url,
    urls,
    skipRegex,
    cluster,
    axeOptions,
    ignoreIncomplete: options.ignoreIncomplete,
    crawl: options.crawl
  }));

  await cluster.idle();
  await cluster.close();
}

module.exports = {
  testUrls
};
