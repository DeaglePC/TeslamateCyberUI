import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        // Simulate mobile viewport or standard viewport
        await page.setViewport({ width: 1280, height: 800 });

        await page.goto('http://localhost:5173/drives/1', { waitUntil: 'networkidle0', timeout: 15000 });

        await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
        console.log("Screenshot saved to test-screenshot.png");
    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        await browser.close();
    }
})();
