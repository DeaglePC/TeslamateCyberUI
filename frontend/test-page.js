import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
    });
    page.on('pageerror', err => console.log('UNCAUGHT EXCEPTION:', err.toString()));

    await page.goto('http://localhost:5173/drives/1', { waitUntil: 'networkidle0', timeout: 15000 });

    const rootHtml = await page.$eval('#root', el => el.innerHTML);
    if (!rootHtml || rootHtml.trim() === '') {
      console.log('CRITICAL: #root is completely empty! The app is blank.');
    } else {
      console.log('App seems to have rendered something length:', rootHtml.length);
    }
  } catch (e) {
    console.error('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
