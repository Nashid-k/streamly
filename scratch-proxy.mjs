import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('.m3u8') || url.includes('playlist.m3u8') || url.includes('/api/')) {
      console.log('INTERCEPTED:', url);
    }
  });
  
  console.log('Navigating to cinesrc via proxy...');
  await page.goto('https://streamly-proxy.nashidk1999.workers.dev/?url=https://cinesrc.st/embed/movie/1084242');
  
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
  process.exit(0);
})();
