const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
  });
  
  const page = await context.newPage();
  
  let guestToken = null;

  // Response intercept karo
  page.on('response', async response => {
    try {
      const headers = response.headers();
      const token = headers['x-hs-updatedusertoken'] || headers['x-hs-usertoken'];
      if (token && !guestToken) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1] + '==', 'base64').toString());
        const sub = JSON.parse(payload.sub);
        if (sub.type === 'guest') {
          guestToken = token;
          console.log('Guest token found in response header!');
        }
      }
    } catch(e) {}
  });

  console.log('Opening hotstar...');
  await page.goto('https://www.hotstar.com/in', { 
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait extra 3s
  await page.waitForTimeout(3000);

  // Cookie se try karo
  if (!guestToken) {
    console.log('Trying cookies...');
    const cookies = await context.cookies('https://www.hotstar.com');
    const userUP = cookies.find(c => c.name === 'userUP');
    if (userUP) {
      try {
        const payload = JSON.parse(Buffer.from(userUP.value.split('.')[1] + '==', 'base64').toString());
        const sub = JSON.parse(payload.sub);
        if (sub.type === 'guest') {
          guestToken = userUP.value;
          console.log('Guest token found in cookie!');
        }
      } catch(e) {}
    }
    
    // sessionUserUP bhi check karo
    const sessionUP = cookies.find(c => c.name === 'sessionUserUP');
    if (!guestToken && sessionUP) {
      guestToken = sessionUP.value;
      console.log('Token found in sessionUserUP!');
    }

    // Debug: sab cookies print karo
    console.log('All cookies:', cookies.map(c => c.name).join(', '));
  }

  await browser.close();

  if (guestToken) {
    fs.writeFileSync('guest_token.txt', guestToken);
    console.log('Token saved!');
    console.log('Token preview:', guestToken.substring(0, 50) + '...');
  } else {
    console.log('Token not found!');
    process.exit(1);
  }
})();
