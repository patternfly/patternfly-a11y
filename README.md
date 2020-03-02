# patternfly-a11y

This is a CLI tool developed for [patternfly-react](https://github.com/patternfly/patternfly-react/), [patternfly-next](https://github.com/patternfly/patternfly-next/), and [patternfly-org](https://github.com/patternfly/patternfly-org/) to run [axe](https://www.deque.com/axe/) in Selenium on a list of urls. It has options suited to our needs but should work as an integration test for any project.

It outputs a coverage directory with:
  - report.json: full axe output per-url
  - report.xml: junit coverage grouped into test cases
  - report.html: more readable html report of report.xml

## Usage

```sh
patternfly-a11y [command]

Commands:
  patternfly-a11y --file <file>  Audit a list of URLs in JSON file

Options:
  --version                 Show version number                        [boolean]
  --file, -f                JSON file of URLs to audit                  [string]
  --prefix, -p              Prefix for all URLs           [string] [default: ""]
  --crawl, -c               Whether to crawl URLs for more URLs
                                                      [boolean] [default: false]
  --aggregate, -a           Whether to aggregate tests by component in XML
                            report                    [boolean] [default: false]
  --ignore, -i              Comma-seperated list of errors to ignore by id
                                                          [string] [default: ""]
  --skip, -s                Regex of pages to skip        [string] [default: ""]
  --ignoreIncomplete, --iI  Whether to ignore incomplete errors
                                                      [boolean] [default: false]
  --help                    Show help                                  [boolean]
```

## Getting started

`npm i @patternfly/patternfly-a11y`

then

`node_modules/.bin/patternfly-a11y --file [json-list-of-urls]`

OR

`node_modules/.bin/patternfly-a11y --prefix http://localhost:9000 --crawl /dashboard`

Currently this tool is rough around the edges. It could be extended to run tests in parallel or on browserstack, do better reporting, allow a plugable version of axe-core, have better error handling (browser tests are always finnicky...), more report formats, you get the idea.

PRs welcome. The author @redallen would love to spend more time on this.
