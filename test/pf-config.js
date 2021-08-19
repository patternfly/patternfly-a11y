/**
 * Wait for a selector before running axe
 *
 * @param page page from puppeteer
 */
async function waitFor(page) {
  await page.waitForSelector('#root > *');
}

module.exports = {
  prefix: 'https://www.patternfly.org',
  waitFor,
  crawl: false,
  urls: ['/v4/components/button/react/variations'],
  ignoreRules: 'color-contrast,page-has-heading-one,scrollable-region-focusable,bypass',
  ignoreIncomplete: true,
  // tree-table examples are skipped because aria-level, aria-posinset, aria-setsize are intentionally
  // being used slightly unconventionally in those examples
  skip: /^\/charts\/|tree-table$/
};
