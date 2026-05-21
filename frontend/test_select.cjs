const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for console errors
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`BROWSER ERROR: ${err.message}`);
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'admin@sf-dgci.gw');
    await page.fill('input[type="password"]', 'Admin@2026!');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for dashboard...');
    await page.waitForURL('**/dashboard');
    
    console.log('Navigating to members form...');
    await page.goto('http://localhost:5173/membros/novo');
    await page.waitForSelector('select[name="sexo"]');
    
    console.log('Selecting sexo: feminino...');
    await page.selectOption('select[name="sexo"]', 'feminino');
    
    const value = await page.$eval('select[name="sexo"]', el => el.value);
    console.log('Current sexo value after selection:', value);
    
    // Let's also go to /financeiro and test month/year
    console.log('Navigating to financeiro...');
    await page.goto('http://localhost:5173/financeiro');
    await page.waitForTimeout(2000);
    
    // Find the first select
    const selects = await page.$$('select');
    console.log(`Found ${selects.length} select elements on financeiro page`);
    
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
}

run();
