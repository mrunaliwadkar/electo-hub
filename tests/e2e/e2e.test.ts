import { test, expect } from '@playwright/test';

test.describe('ElectroHub E2E Tests', () => {
  test('Landing Page search flow', async ({ page }) => {
    // 1. Go to landing page
    await page.goto('/');
    
    // 2. Check that the landing page has the search input
    const searchInput = page.locator('input[placeholder*="Search by MPN"]');
    await expect(searchInput).toBeVisible();
    
    // 3. Type search query
    await searchInput.fill('NE555');
    
    // 4. Submit search (press Enter)
    await searchInput.press('Enter');
    
    // 5. Verify it navigated to the search page with the correct query param
    await expect(page).toHaveURL(/.*\/search\?q=NE555.*/);
  });

  test('Component Explorer filters', async ({ page }) => {
    // 1. Go to search page
    await page.goto('/search');
    
    // 2. Click on Category Filter "Microcontrollers"
    const categoryButton = page.locator('button:has-text("Microcontrollers")');
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();
    
    // 3. Toggle "In Stock Only" checkbox
    const checkbox = page.locator('label:has-text("In Stock Only") input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    
    // 4. Verify filters applied (results should be filtered, e.g. showing ESP32-S3)
    const componentCard = page.locator('h3:has-text("ESP32-S3")');
    await expect(componentCard).toBeVisible();
  });

  test('Component Detail Page tabs', async ({ page }) => {
    // 1. Go to component detail page
    await page.goto('/components/esp32-s3');
    
    // 2. Verify we see the component details
    await expect(page.locator('h1')).toContainText('ESP32-S3-WROOM-1-N16R8');
    
    // 3. Click on "Interactive Pinout" tab
    const pinoutTab = page.locator('button:has-text("Interactive Pinout")');
    await expect(pinoutTab).toBeVisible();
    await pinoutTab.click();
    
    // Verify pinout content is visible
    await expect(page.locator('text=Interactive Package Canvas')).toBeVisible();
    
    // 4. Click on "Official Datasheet" tab
    const datasheetTab = page.locator('button:has-text("Official Datasheet")');
    await expect(datasheetTab).toBeVisible();
    await datasheetTab.click();
    
    // Verify datasheet content
    await expect(page.locator('iframe')).toBeVisible();
    
    // 5. Click on "Alternatives Comparison" tab
    const alternativesTab = page.locator('button:has-text("Alternatives Comparison")');
    await expect(alternativesTab).toBeVisible();
    await alternativesTab.click();
    
    // Verify alternatives table
    await expect(page.locator('text=AI Alternative Matching Matrix')).toBeVisible();
  });
});
