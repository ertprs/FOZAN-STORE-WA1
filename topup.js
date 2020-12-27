// const { Client  = require("whatsapp-web.js");
const USERNAME_SELECTOR = "#user_session_username";
const PASSWORD_SELECTOR = "#user_session_password";
const CTA_SELECTOR = "#new_user_session > button > span";
const fs = require("fs");
const cookiesFilePath = "cookies.json";
const saldo =
  "#dana-topup-modal > div > div:nth-child(2) > div:nth-child(2) > div.u-txt--large.u-txt--bold.u-mrgn-bottom--1";
const limitTopUp =
  "#dana-topup-modal > div > div:nth-child(4) > div.u-txt--fair.u-txt--bold.u-mrgn-bottom--2.u-mrgn-top--1";
const resultPath = "result.json";
const { post } = require("request");
let result = [];
async function startBrowser(browser,email) {
  let token;
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: [
  //     "--no-sandbox",
  //     "--disable-setuid-sandbox",
  //     "--disable-dev-shm-usage",
  //     "--disable-accelerated-2d-canvas",
  //     "--no-first-run",
  //     "--no-zygote",
  //     "--single-process", // <- this one doesn't works in Windows
  //     "--disable-gpu",
  //     "--aggressive-cache-discard",
  //     "--disable-cache",
  //     "--disable-application-cache",
  //     "--disable-offline-load-stale-cache",
  //     "--disk-cache-size=0"
  //   ]
  // });
  const page = await browser.newPage();
  page[0];

  //turns request interceptor on
  await page.setRequestInterception(true);

  //if the page makes a  request to a resource type of image or stylesheet then abort that            request
  page.on("request", request => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "stylesheet"
    )
      request.abort();
    else request.continue();
  });

  page.on("response", async response => {
    if (
      response.url() ==
      "https://accounts.bukalapak.com/auth_proxies/request_token"
    ) {
      // console.log('XHR response received');

      try {
        let data = await response.json();
        console.log(JSON.stringify(data));
        token = JSON.stringify(data.access_token);
        // console.log(token);
      } catch (error) {}
    }
  });
  const previousSession = fs.existsSync(email);
  if (previousSession) {
    // If file exist load the cookies
    const cookiesString = fs.readFileSync(email);
    const parsedCookies = JSON.parse(cookiesString);
    if (parsedCookies.length !== 0) {
      for (let cookie of parsedCookies) {
        await page.setCookie(cookie);
      }
      console.log("Session has been loaded in the browser");
    }
  }

  let url = "https://www.bukalapak.com/dompet/dana?from=nav_header";
  await page.setViewport({ width: 1366, height: 768 });
  await page
    .goto(url, {
      waitUntil: "domcontentloaded",
      // Remove the timeout
      timeout: 0
    })
    .catch(e => void 0);
  let loggin;
  try {
    loggin = await page.waitForSelector(USERNAME_SELECTOR, { timeout: 5000 });
    // ...
  } catch (error) {
    console.log("You was Loggin");
  }
  if (loggin) {
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type("fauzanabid27@gmail.com");
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type("Rama2727");
    await page.click(CTA_SELECTOR);
    await page.waitForNavigation();
  }

  //seasion

  return { browser, page, token };
}
async function getToken(email) {
  const { page, browser, token } = await startBrowser(email);

  page.close();
  console.log("done");
  return token;
}
async function topup(url, nominal, metode, email) {
  const { page, browser, token } = await startBrowser(email);
  await page.setViewport({ width: 1366, height: 768 });
  await page
    .goto(url, {
      waitUntil: "domcontentloaded"
    })
    .catch(e => void 0);

  const cookiesObject = await page.cookies();
  fs.writeFile(email, JSON.stringify(cookiesObject), function(err) {
    if (err) {
      console.log("The file could not be written.", err);
    }
    console.log("Session has been successfully saved");
  });

  await page.waitForSelector(
    "#js-wallet-page > section > div > div.o-layout__item.u-10of12.u-pad-bottom--4 > div.u-display-table.u-border--1--ash-light.u-width-1 > div.u-display-table-cell.u-6of12.u-bg--sand-light.u-border--right.u-border--sand-dark > div > fragment-loader > div > section > div > div.u-position-relative.c-panel.u-mrgn-bottom--4 > div.c-panel__body.u-pad-bottom--3 > div > div.o-flag__head > div > a"
  );
  await page.click(
    "#js-wallet-page > section > div > div.o-layout__item.u-10of12.u-pad-bottom--4 > div.u-display-table.u-border--1--ash-light.u-width-1 > div.u-display-table-cell.u-6of12.u-bg--sand-light.u-border--right.u-border--sand-dark > div > fragment-loader > div > section > div > div.u-position-relative.c-panel.u-mrgn-bottom--4 > div.c-panel__body.u-pad-bottom--3 > div > div.o-flag__head > div > a"
  );
  await page.$(
    "#dana-topup-modal > div > div:nth-child(4) > div.u-mrgn-top--5 > div.c-inp-grp-table.u-mrgn-top--1 > input"
  );
  const JumlahSaldo = await page.$eval(saldo, el => el.innerText);
  // const BatasLimit =  await page.$eval(limitTopUp,el => el.innerText)
  const BatasLimit = await page.evaluate(selector => {
    return document.querySelector(selector).innerText;
  }, limitTopUp);

  let eligibleLimit = BatasLimit.replace("Rp", "")
    .replace(".", "")
    .replace(".", "");

  if (+eligibleLimit - +nominal > 999) {
    await page.click(
      "#dana-topup-modal > div > div:nth-child(4) > div.u-mrgn-top--5 > div.c-inp-grp-table.u-mrgn-top--1 > input"
    );
    await page.keyboard.type(nominal);
    await page.click(
      "#dana-topup-modal > div > div:nth-child(4) > div.u-mrgn-top--5 > div:nth-child(5) > button"
    );
    // await page('#dana-topup-modal > div > div:nth-child(4) > div.u-mrgn-top--5 > div:nth-child(5) > button',{hiden:true})
    await page.waitForSelector(
      "#js-iv-payment-form > div.o-layout__item.u-7of12 > div.u-mrgn-bottom--10 > div.c-panel.clearfix > div.c-panel__head > h2"
    );
    await page.waitForSelector(
      "#js-iv-payment-form > div.o-layout__item.u-7of12 > div.u-mrgn-bottom--10 > div.c-panel.clearfix > div.c-panel__body > div > ul"
    );
    await autoScroll(page);
    await page.screenshot({ path: "bukalapak.png" });
    console.log(metode === "alfamart");
    if (metode === "alfamart") {
      await page.evaluate(() => {
        document.querySelector("#qa-payment-alfamart").click();
      });
    }

    if (metode === "indomart") {
      await page.evaluate(() => {
        document.querySelector("#qa-payment-indomaret").click();
      });
    }
    await page.waitForSelector(
      "#js-iv-payment-form > div.o-layout__item.u-7of12 > div.u-mrgn-bottom--10 > div.c-panel.clearfix > div.c-panel__body > div > ul > li.c-panel.c-panel-accordion.js-accordion-group-panel.is-active > div > div > strong"
    );
    const buttonPayment =
      "#js-iv-summary > div.c-panel.c-panel--bleed > div.c-panel__body > div.o-box.u-pad-top--0 > div > div > button.c-btn.c-btn--red.c-btn--large.c-btn--block.js-iv-submit-payment.js-iv-submit.js-tfa-required.qa-button-pay.was-tfa-button";
    // await page.click('#js-iv-summary > div.c-panel.c-panel--bleed > div.c-panel__body > div.o-box.u-pad-top--0 > div > div > button.c-btn.c-btn--red.c-btn--large.c-btn--block.js-iv-submit-payment.js-iv-submit.js-tfa-required.qa-button-pay.was-tfa-button')
    await page.evaluate(selector => {
      return document.querySelector(selector).click();
    }, buttonPayment);

    await page.waitForNavigation({ timeout: 0 });
    await page.screenshot({ path: "bukalapak.png" });
    await page.waitForSelector(
      "#reskinned_page > section > div > div > div.c-panel > div.c-panel__body > div"
    ); // wait for the selector to load
    const element = await page.$(
      "#reskinned_page > section > div > div > div.c-panel > div.c-panel__body"
    ); // declare a variable with an ElementHandle
    await element.screenshot({ path: "va.png" }); // take screenshot element in puppeteer
    const noVa =
      "#reskinned_page > section > div > div > div.c-panel > div.c-panel__body > div > strong > a";
    const spanVal = await page.$eval(noVa, el => el.innerText);
    // fs.writeFile(resultPath, result)
    page.close();
    return spanVal;
  }
  page.close();
  console.log("done");
}

async function closeBrowser(browser) {
  return page.close();
}


async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

module.exports = { getToken, topup };
