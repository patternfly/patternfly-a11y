function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
  
  async function login({ page, data }) {
    const user = "";
    const pass = "";
    const url = data.prefix;
    console.log(`nav to ${url}`);
    await page.goto(`${url}`, { waitUntil: "load" });
    if (page.url().indexOf("sso.redhat.com") > -1) {
      console.log("have to auth first");
      await page.waitForSelector("#username-verification");
      await page.type("#username-verification", user);
      await page.click("#login-show-step2");
      await delay(1000);

      await page.waitForSelector("#password");
      await page.type("#password", pass);
      await delay(1000);
      await page.click("#rh-password-verification-submit-button");
      await page.waitForNavigation();
      await delay(1000);
      console.log("finished auth");
    }
  }
  
  async function waitFor(page) {
    // there should be no loading spinner
    await page.waitForSelector(".pf-c-spinner", {
      hidden: true,
    });
    await page.waitForSelector(".ins-c-spinner", {
      hidden: true,
    });
  
    // there should be no skeleton text
    await page.waitForSelector("[class*='skeleton']", {
      hidden: true,
      timeout: 60000,
    });
  }
  
  module.exports = {
    prefix: "https://console.redhat.com",
    auth: login,
    waitFor: waitFor,
    crawl: false,
    urls: [
      "/openshift",
      "/openshift/create"
    ],
  };
  