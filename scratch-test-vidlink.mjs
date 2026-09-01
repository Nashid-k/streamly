import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      console.log('API:', url);
      try {
        const text = await response.text();
        console.log('DATA:', text.substring(0, 500));
      } catch (e) {
        console.log('DATA:', e.message);
      }
    }
  });
  
  console.log('Navigating to vidlink.pro...');
  await page.goto('https://vidlink.pro/movie/1084242');
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  process.exit(0);
})();
