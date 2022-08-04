function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function loginCostManagement({ page, data }) {
  const user = "cost-demo";
  const pass = "k0kuC0st";
  const url = data.prefix;
  console.log(`nav to ${url}`);
  await page.goto(`${url}`, { waitUntil: "load" });
  await delay(2000);
  if (page.url().indexOf("sso") > -1) {
    console.log("have to auth first");
    await page.waitForSelector("#username");
    await page.type("#username", user);
    await page.click("#login-show-step2");
    await page.waitForSelector("#rh-password-verification.rh-slide-in.show #password");    await page.waitForSelector("#password");
    await page.type("#password", pass);
    await page.click("#rh-password-verification-submit-button");
    await page.waitForNavigation();
    await delay(5000);
    console.log("finished auth");
  }
}

module.exports = {
  prefix: "https://console.stage.redhat.com/beta/openshift/cost-management",
  auth: loginCostManagement,
  crawl: false,
  context: 'document.querySelector("main.costManagement")',
  urls: [
    {
      url: "/",
      label: "overview",
      afterNav: async (page) => {
        await page.waitForSelector(".pf-c-tabs__item-text");
        await delay(1000);
      },
    },
    {
      url: "/?tabKey=1",
      label: "infrastructure",
      afterNav: async (page) => {
        await page.waitForSelector(".pf-c-tabs__item-text");
        await delay(1000);
      },
    },
    {
      url: "/ocp",
      label: "openshift details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride");
        await delay(1000);
      },
    },
    {
      url: "/aws",
      label: "aws details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride");
        await delay(1000);
      },
    },
    {
      url: "/gcp",
      label: "gcp details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride");
        await delay(1000);
      },
    },
    {
      url: "/ibm",
      label: "ibm details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride, .pf-c-empty-state__content");
        await delay(1000);
      },
    },
    {
      url: "/azure",
      label: "azure details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride");
        await delay(1000);
      },
    },
    {
      url: "/oci",
      label: "oci details",
      afterNav: async (page) => {
        await page.waitForSelector(".tableOverride");
        await delay(1000);
      },
    },
    {
      url: "/cost-models",
      label: "cost models",
      afterNav: async (page) => {
        await page.waitForSelector(".pf-c-table");
        await delay(1000);
      },
    },
    {
      url: "/explorer",
      label: "cost explorer",
      afterNav: async (page) => {
        await page.waitForSelector(".pf-c-table");
        await delay(1000);
      },
    }
    // {
    //   url: "/details/ocp",
    //   label: "ocp-details-cost-overview",
    //   afterNav: async (page) => {
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/details/ocp/breakdown"]'
    //     );
    //     await links[0].click();
    //     await waitForKoku(page);
    //   },
    // },
    // {
    //   url: "/details/ocp",
    //   label: "ocp-details-historical-data",
    //   afterNav: async (page) => {
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/details/ocp/breakdown"]'
    //     );
    //     await links[0].click();
    //     const tabs = await page.$$(".pf-c-tabs__item-text");
    //     // Historical data
    //     await tabs[1].click();
    //     await waitForKoku(page);
    //   },
    // },
    // "/details/aws",
    // {
    //   url: "/details/aws",
    //   label: "infra-details-aws-cost-overview",
    //   afterNav: async (page) => {
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/details/aws/breakdown"]'
    //     );
    //     await links[0].click();
    //     await waitForKoku(page);
    //   },
    // },
    // {
    //   url: "/details/aws",
    //   label: "infra-details-aws-historical-data",
    //   afterNav: async (page) => {
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/details/aws/breakdown"]'
    //     );
    //     await links[0].click();
    //     const tabs = await page.$$(".pf-c-tabs__item-text");
    //     // Historical data
    //     await tabs[1].click();
    //     await waitForKoku(page);
    //   },
    // },
    // "/cost-models",
    // {
    //   url: "/cost-models",
    //   label: "cost-models-details-price-list",
    //   afterNav: async (page) => {
    //     await page.waitForSelector(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     await links[0].click();
    //     await page.waitForSelector(".pf-c-tabs__item-text");
    //   },
    // },
    // {
    //   url: "/cost-models",
    //   label: "cost-models-details-markup",
    //   afterNav: async (page) => {
    //     await page.waitForSelector(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     await links[0].click();
    //     await page.waitForSelector(".pf-c-tabs__item-text");
    //     const tabs = await page.$$(".pf-c-tabs__item-text");
    //     // Markup
    //     await tabs[1].click();
    //     await waitForKoku(page);
    //   },
    // },
    // {
    //   url: "/cost-models",
    //   label: "cost-models-details-sources",
    //   afterNav: async (page) => {
    //     await page.waitForSelector(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     const links = await page.$$(
    //       'a[href^="/beta/cost-management/cost-models/"]'
    //     );
    //     await links[0].click();
    //     await page.waitForSelector(".pf-c-tabs__item-text");
    //     const tabs = await page.$$(".pf-c-tabs__item-text");
    //     // Sources
    //     await tabs[2].click();
    //     await waitForKoku(page);
    //   },
    // },
  ],
};
