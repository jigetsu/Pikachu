const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: {
      width: 1366,
      height: 768
    },

    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',

    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',

    extraHTTPHeaders: {
      'x-country-code': 'in',
      'x-hs-platform': 'web',
      'x-hs-app': '260306000',
      'x-hs-accept-language': 'eng'
    }
  });

  const page = await context.newPage();

  console.log('Opening Hotstar...');

  await page.goto(
    'https://www.hotstar.com/in/mypage#mp-login',
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    }
  );

  await page.waitForTimeout(10000);

  console.log('Calling login API...');

  const result = await page.evaluate(async () => {

    const res = await fetch(
      'https://www.hotstar.com/api/internal/bff/v2/start?journey=login',
      {
        method: 'POST',

        credentials: 'include',

        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/json',
          'x-country-code': 'in',
          'x-hs-platform': 'web',
          'x-hs-app': '260306000',
          'x-hs-accept-language': 'eng'
        },

        body: JSON.stringify({
          deeplink_url: '',
          app_launch_count: 5
        })
      }
    );

    return {
      status: res.status,
      headers: Object.fromEntries(
        res.headers.entries()
      )
    };

  });

  console.log('STATUS:', result.status);

  const token =
    result.headers['x-hs-usertoken'] ||
    result.headers['x-hs-updatedusertoken'];

  if (!token) {

    console.log('No token in response');

    const cookies = await context.cookies();

    console.log(
      'Cookies:',
      cookies.map(c => c.name).join(', ')
    );

    const userUP =
      cookies.find(
        c => c.name === 'userUP'
      );

    if (userUP) {

      fs.writeFileSync(
        'guest_token.txt',
        userUP.value
      );

      console.log('\nTOKEN FROM COOKIE\n');

      return;
    }

    process.exit(1);
  }

  fs.writeFileSync(
    'guest_token.txt',
    token
  );

  console.log('\nTOKEN SAVED\n');

  await browser.close();

})();
