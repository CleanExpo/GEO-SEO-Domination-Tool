import { test, expect } from '@playwright/test';

/**
 * Test: One-letter-at-a-time input bug
 *
 * ISSUE: Form inputs lose focus after typing each character
 * EXPECTED: User can type multiple characters without re-clicking
 */

test('should allow typing multiple characters in business name field', async ({ page }) => {
  // Navigate to onboarding page
  await page.goto('http://localhost:3000/onboarding');

  // Wait for form to load
  await page.waitForSelector('input[name="businessName"]');

  // Click the business name input
  const businessNameInput = page.locator('input[name="businessName"]');
  await businessNameInput.click();

  // Type multiple characters without re-clicking
  await businessNameInput.type('Disaster Recovery', { delay: 100 });

  // Check that all characters were entered
  const value = await businessNameInput.inputValue();

  console.log(`✅ Typed value: "${value}"`);
  console.log(`✅ Expected: "Disaster Recovery"`);
  console.log(`✅ Match: ${value === 'Disaster Recovery'}`);

  // Verify full text was entered
  expect(value).toBe('Disaster Recovery');
});

test('should maintain focus when typing in email field', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');

  await page.waitForSelector('input[name="email"]');

  const emailInput = page.locator('input[name="email"]');
  await emailInput.click();

  // Type email without re-clicking
  await emailInput.type('admin@disasterrecovery.com.au', { delay: 50 });

  const value = await emailInput.inputValue();

  console.log(`✅ Email typed: "${value}"`);

  expect(value).toBe('admin@disasterrecovery.com.au');
});

test('should allow rapid typing across multiple fields', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');

  // Business name
  const businessNameInput = page.locator('input[name="businessName"]');
  await businessNameInput.click();
  await businessNameInput.type('Test Company', { delay: 50 });

  // Contact name
  const contactNameInput = page.locator('input[name="contactName"]');
  await contactNameInput.click();
  await contactNameInput.type('John Smith', { delay: 50 });

  // Email
  const emailInput = page.locator('input[name="email"]');
  await emailInput.click();
  await emailInput.type('john@test.com', { delay: 50 });

  // Verify all values
  expect(await businessNameInput.inputValue()).toBe('Test Company');
  expect(await contactNameInput.inputValue()).toBe('John Smith');
  expect(await emailInput.inputValue()).toBe('john@test.com');

  console.log('✅ All fields retained focus correctly');
});
