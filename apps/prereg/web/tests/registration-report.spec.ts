import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, username: string) {
  await page.goto('/login')

  await page
    .getByRole('textbox', {
      name: 'Username',
      exact: true,
    })
    .fill(username)

  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')

  await page
    .getByRole('button', {
      name: 'Sign in',
      exact: true,
    })
    .click()

  await expect(page).not.toHaveURL(/\/login/)
}

test.describe('AWB-25: Registration report on Overview page', () => {
  test('customer sees registration report on Overview without partner/plant filters', async ({
    page,
  }) => {
    await login(page, 'browser_test_jul_customer')

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /Registration report|Laporan registrasi/i }),
    ).toBeVisible()

    // Search and generic filters are present
    await expect(page.getByRole('textbox', { name: 'Search registrations' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Registration type' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible()

    // Internal-only filters (Plant & Customer/Vendor) should NOT be visible for customer
    await expect(page.getByRole('combobox', { name: 'Plant' })).not.toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Customer / vendor' })).not.toBeVisible()

    // Export Excel button is visible
    await expect(page.getByRole('button', { name: 'Export Excel' })).toBeVisible()
  })

  test('vendor sees registration report on Overview without partner/plant filters', async ({
    page,
  }) => {
    await login(page, 'browser_test_bel_vendor')

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /Registration report|Laporan registrasi/i }),
    ).toBeVisible()

    // Generic filters
    await expect(page.getByRole('textbox', { name: 'Search registrations' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Registration type' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible()

    // Internal-only filters should NOT be visible for vendor
    await expect(page.getByRole('combobox', { name: 'Plant' })).not.toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Customer / vendor' })).not.toBeVisible()

    // Export Excel button is visible
    await expect(page.getByRole('button', { name: 'Export Excel' })).toBeVisible()
  })

  test('admin sees registration report with plant/partner filters and filter persistence in URL', async ({
    page,
  }) => {
    await login(page, 'browser_test_admin')

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /Registration report|Laporan registrasi/i }),
    ).toBeVisible()

    // Admin sees generic filters
    await expect(page.getByRole('textbox', { name: 'Search registrations' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Registration type' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible()

    // Admin sees Export Excel
    await expect(page.getByRole('button', { name: 'Export Excel' })).toBeVisible()

    // Changing type filter persists in URL
    await page.getByRole('combobox', { name: 'Registration type' }).selectOption('JUL')
    await expect(page).toHaveURL(/type=JUL/)

    // Changing status filter persists in URL
    await page.getByRole('combobox', { name: 'Status' }).selectOption('Approved')
    await expect(page).toHaveURL(/status=APPROVED/)
  })
})
