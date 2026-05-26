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
    timezoneId: 'Asia/Kolkata'
  });

  const page = await context.newPage();

  let token = null;

  page.on('request', req => {

    const url = req.url();

    if (
      url.includes('/api/internal/bff/v2/start')
    ) {

      const headers = req.headers();

      const t =
        headers['x-hs-usertoken'] ||
        headers['x-hs-updatedusertoken'];

      if (t) {
        token = t;

        console.log('\nTOKEN FOUND\n');
      }
    }
  });

  console.log('Opening page...');

  await page.goto(
    'https://www.hotstar.com/in/mypage#mp-login',
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    }
  );

  await page.waitForTimeout(15000);

  // click login buttons
  try {

    const buttons =
      await page.locator('button').all();

    for (const btn of buttons) {

      const txt = await btn.textContent();

      if (
        txt &&
        txt.toLowerCase().includes('log')
      ) {

        console.log('Clicking login...');
        await btn.click();

        break;
      }
    }

  } catch (e) {}

  await page.waitForTimeout(15000);

  // fallback cookie
  if (!token) {

    const cookies =
      await context.cookies();

    const userUP =
      cookies.find(
        c => c.name === 'userUP'
      );

    if (userUP) {

      token = userUP.value;

      console.log(
        'Token from cookie fallback'
      );
    }

    console.log(
      'Cookies:',
      cookies.map(c => c.name).join(', ')
    );
  }

  await browser.close();

  if (!token) {

    console.log('TOKEN NOT FOUND');

    process.exit(1);
  }

  fs.writeFileSync(
    'guest_token.txt',
    token
  );

  console.log('\nSAVED\n');
})();
