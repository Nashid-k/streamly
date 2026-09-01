import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();
  
  const html = `
    <html>
      <body>
        <iframe src="https://vidlink.pro/movie/1084242" width="100%" height="100%" allow="autoplay; fullscreen" id="player"></iframe>
        <script>
          window.addEventListener('message', (event) => {
            console.log('MSG_FROM_VIDLINK:', JSON.stringify(event.data));
          });
        </script>
      </body>
    </html>
  `;
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.setContent(html);
  
  console.log('Waiting for player to initialize...');
  await new Promise(r => setTimeout(r, 15000));
  
  await browser.close();
  process.exit(0);
})();
