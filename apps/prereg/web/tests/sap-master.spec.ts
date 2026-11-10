import { expect, test } from '@playwright/test'

test('administrator downloads SAP drivers and trucks', async ({ page }) => {
  await page.goto('/login')

  await page
    .getByRole('textbox', {
      name: 'Username',
      exact: true,
    })
    .fill('browser_test_admin')

  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')

  await page
    .getByRole('button', {
      name: 'Sign in',
      exact: true,
    })
    .click()

  await page.getByRole('link', { name: 'SAP drivers & trucks' }).click()
  await expect(page.getByRole('heading', { name: 'SAP drivers & trucks' })).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Download from SAP',
      exact: true,
    })
    .click()

  await expect(page.getByText('SUCCEEDED', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('2 drivers · 2 trucks', { exact: true })).toBeVisible()
})
