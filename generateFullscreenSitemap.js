#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
  .demandCommand(1)
  .argv;

const allSitePagesQuery = {
  query: `
    {
      allSitePage(filter: {context: {isFullscreen: {eq: true}}}) {
        nodes {
          path
        }
      }
    }
  `
};

const url = argv._;

axios
  // query all the pages we want to run our a11y tests against
  .post(`${url}/___graphql?`, allSitePagesQuery)
  .then(response => {
    // gather page objects from response data
    const pages = response.data.data.allSitePage.nodes.map(node => `${url}${node.path}`);
    // write a nicely formatted array of pages to a file
    fs.writeFileSync(path.resolve(process.cwd(), 'sitemap.json'), JSON.stringify(pages, null, 2));
  })
  .catch(error => {
    console.error(error);
    console.error(`Problem generating GraphQL sitemap for ${url}`);
  });
