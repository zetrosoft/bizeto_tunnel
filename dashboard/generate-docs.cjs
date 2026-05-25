const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:6500';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('🚀 Starting documentation capture...');

  async function takeScreenshot(name) {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
    console.log(`✅ Captured: ${name}.png`);
  }

  async function safeClick(selector) {
    try {
      // Try multiple types of matches
      const locators = [
        page.locator(selector),
        page.getByText(selector, { exact: false }),
        page.getByRole('button', { name: selector, exact: false })
      ];
      
      for (const loc of locators) {
        if (await loc.isVisible()) {
          await loc.click({ timeout: 2000 });
          return;
        }
      }
      // Fallback to raw selector
      await page.click(selector, { timeout: 2000 });
    } catch (e) {
      console.warn(`⚠️ Warning: Could not click ${selector}, skipping...`);
    }
  }

  // --- USER FLOW ---
  console.log('👤 Capturing User Portal...');
  await page.goto(`${BASE_URL}/login?mock=true`);
  await page.click('text=Login as User');
  await page.waitForURL('**/user**');

  // Overview
  await takeScreenshot('user-overview');

  // Tunnels
  await safeClick('text=Tunnels');
  await takeScreenshot('user-tunnels');

  // Add Tunnel Wizard
  await safeClick('text=Add Tunnel');
  await takeScreenshot('user-add-tunnel-step1');
  await safeClick('text=Cancel');

  // API Keys
  await safeClick('text=API Keys');
  await takeScreenshot('user-api-keys');

  // Billing
  await safeClick('text=Billing & Plan');
  await takeScreenshot('user-billing');

  // Logout (Using icon button)
  await page.click('aside button.ml-auto');

  // --- OWNER FLOW ---
  console.log('👑 Capturing Owner Dashboard...');
  await page.goto(`${BASE_URL}/login?mock=true`);
  await page.click('text=Login as Owner');
  await page.waitForURL('**/owner**');

  // Platform Overview
  await takeScreenshot('owner-overview');

  // Tenants
  await safeClick('text=Tenants & Users');
  await takeScreenshot('owner-tenants');

  // Pricing
  await safeClick('text=Pricing Plans');
  await takeScreenshot('owner-pricing');

  // Settings
  await safeClick('text=System Settings');
  await takeScreenshot('owner-settings');

  await browser.close();
  console.log('🏁 Documentation capture complete! Files are in docs/screenshots/');
}

captureScreenshots().catch(console.error);
