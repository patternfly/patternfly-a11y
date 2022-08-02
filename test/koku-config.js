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
    await page.waitForSelector("#password");
    await page.type("#password", pass);
    await page.click("#rh-password-verification-submit-button");
    await page.waitForNavigation();
    await delay(5000);
    console.log("finished auth");
  }
}

async function waitForKoku(page) {
  // there should be no loading spinner
  await page.waitForSelector(".co-m-loader", {
    hidden: true,
  });
  console.log("checked loader");
  await page.waitForSelector(".pf-c-spinner", {
    hidden: true,
  });
  console.log("checked spinner");
  // there should be no skeleton text
  // await page.waitForSelector("[class*='skeleton']", {
  //   hidden: true,
  //   timeout: 60000,
  // });
  // console.log("checked skeleton");
}

module.exports = {
  prefix: "https://console.stage.redhat.com/beta/openshift/cost-management",
  auth: loginCostManagement,
  waitFor: waitForKoku,
  crawl: false,
  context: 'document.querySelector("main.costManagement")',
  urls: [
    {
      url: "/",
      afterNav: async (page) => {
        await waitForKoku(page);
        console.log("waited for koku");
        // await page.$$(".pf-c-tabs__item-text");
      },
    },
    // {
    //   url: "/",
    //   label: "infrastructure",
    //   afterNav: async (page) => {
    //     const tabs = await page.$$(".pf-c-tabs__item-text");
    //     // tabs[0] = OpenShift
    //     // tabs[1] = Infrastructure
    //     console.log("clicking tab[1]");
    //     await tabs[1].click();
    //     await waitForKoku(page);
    //   },
    // },
    // {
    //   url: "/details/ocp",
    //   label: "ocp-details",
    //   afterNav: async (page) => {
    //     await page.$$(".pf-c-table__text");
    //   },
    // },
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
