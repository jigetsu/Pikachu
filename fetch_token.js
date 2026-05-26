// fetch_token.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let guestToken = null;
  
  // Request intercept karo
  page.on('request', request => {
    const token = request.headers()['x-hs-usertoken'];
    if (token && !guestToken) {
      // JWT decode karke type check karo
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        const sub = JSON.parse(payload.sub);
        if (sub.type === 'guest') {
          guestToken = token;
          console.log('Guest token found!');
        }
      } catch(e) {}
    }
  });
  
  await page.goto('https://www.hotstar.com/in', { 
    waitUntil: 'networkidle' 
  });
  
  await browser.close();
  
  if (guestToken) {
    require('fs').writeFileSync('guest_token.txt', guestToken);
    console.log('Token saved!');
  } else {
    console.log('Token not found!');
    process.exit(1);
  }
})();
