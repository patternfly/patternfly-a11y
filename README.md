# patternfly-a11y

This is a CLI tool developed for [patternfly-react](https://github.com/patternfly/patternfly-react/), [patternfly-next](https://github.com/patternfly/patternfly-next/), and [patternfly-org](https://github.com/patternfly/patternfly-org/) to run [axe](https://www.deque.com/axe/) in Selenium on a list of urls. It has options suited to our needs but should work as an integration test for any project.

It outputs a coverage directory with a webpack-built report, as well as:

- report.json: full axe output per-url
- report.xml: junit coverage grouped into test cases
- report.html: more readable html report of report.xml

## Usage

```sh
patternfly-a11y [command]

patternfly-a11y --help

Commands:
  patternfly-a11y <file>  Audit a list of URLs in JSON file

Options:
  -V, --version                output the version number
  -c, --config <file>          Path to config file
  -p, --prefix <prefix>        Prefix for listed urls (like https://localhost:9000)
  -cr, --crawl                 Whether to crawl URLs for more URLs (default: false)
  --no-code-on-fail            By default, exit code 1 is returned on test failures, and 2 if there are incomplete tests, this disables that
  -s, --skip <regex>           Regex of pages to skip
  -a, --aggregate              Whether to aggregate tests by component (by splitting URL) in XML report (default: false)
  --no-screenshots             Whether to save screenshots of visited pages
  -ir, --ignore-rules <rules>  Axe: Comma-separated list of error ids to ignore (default: "color-contrast")
  -iI, --ignore-incomplete     Axe: Whether to ignore incomplete errors (default: false)
  -t, --tags <tags>            Axe: Comma-separated list of accessibility (WCAG) tags to run against (default: "wcag22aa")
  -ctx, --context <context>    Axe: Context to run in, defaults to document, can be set to a different selector, i.e. document.getElementById("content")
                               (default: "document")
  -h, --help                   display help for command
```

## Getting started

`yarn add @patternfly/patternfly-a11y`

then

`yarn exec patternfly-a11y [json-list-of-urls]`

OR

`yarn exec patternfly-a11y --prefix http://localhost:9000 --crawl /dashboard`

For more advanced usage, you can create a config file

`yarn exec patternfly-a11y --config a11y-config.js`

Sample configuration file (a11y-config.js)

```
/**
* page: pupeteer page object, for more information see
* https://pptr.dev/#?product=Puppeteer&version=v3.3.0&show=api-class-page
*
* data: contains the options passed in
*/
async function login({ page, data }) {
  const user = "user";
  const pass = "pass";
  await page.waitForSelector("#inputUsername");
  await page.type("#inputUsername", user);
  await page.type("#inputPassword", pass);
  await page.click("button.pf-c-button");
  await page.waitForNavigation();
  await delay(1000);
}
/**
* page: pupeteer page object, for more information see
* https://pptr.dev/#?product=Puppeteer&version=v3.3.0&show=api-class-page
*/
async function waitForSpinner(page) {
  // there should be no loading spinner
  await page.waitForSelector(".loading-spinner", {
    hidden: true,
  });
}
module.exports = {
  // the root of the URLs to test
  prefix: "https://my-website.com",
  // If you need to authenticate/login you can specify a function here
  auth: login,
  // if there are common elements to wait for on pages to test can specify here
  waitFor: waitForSpinner,
  // if you want axe to only test a subset of the document you can specify it here, defaults to the entire document
  context: 'document.getElementById("page")',
  // we define our own list of URLs to test
  crawl: false,
  // urls can contain strings or objects for more control
  urls: [
    "/dashboards",
    {
      url: "/projects",
      label: "projects page",
      afterNav: async (page) => {
        // pupeteer page object, for more information see
        // https://pptr.dev/#?product=Puppeteer&version=v3.3.0&show=api-class-page
        await page.waitForSelector(".some-element-to-wait-for");
      },
    },
    "/k8s/cluster/projects/default",
    "/search/ns/default",
    "/api-explorer"
  ],
};
```

## Production build

If updating the source under the report/ directory, create a new webpack build by running `yarn build`, which outputs the site to report/dist.
Whenever the patternfly-a11y CLI tool is run, it generates a coverage folder at the root, and copies the report/dist files into it, so that the full report can be served up.

### Serve/view production build (example)

npx serve coverage

## Development build

To work on and update the react report app, first a coverage/ report needs to exist.

1. Run a `./cli.js` CLI command to create the coverage/ report folder.
1. Run `yarn dev` to launch the react app, it will copy files from the coverage/ report folder into the report/static folder.

PRs and issues are welcome.
