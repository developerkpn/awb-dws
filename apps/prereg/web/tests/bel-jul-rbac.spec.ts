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

test.describe('AWB-20: BEL and JUL role-based menu and route separation', () => {
  test('customer sees JUL menu, does not see BEL menu, and cannot access /bel routes', async ({
    page,
  }) => {
    await login(page, 'browser_test_customer')

    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })

    // Menu checks
    await expect(sidebar.getByRole('link', { name: 'JUL registrations' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'BEL registrations' })).not.toBeVisible()

    // Route checks: accessing /jul is allowed
    await page.goto('/jul')
    await expect(page).toHaveURL(/\/jul$/)

    // Route checks: accessing /bel redirects to /forbidden
    await page.goto('/bel')
    await expect(page).toHaveURL(/\/forbidden$/)
  })

  test('vendor sees BEL menu, does not see JUL menu, and cannot access /jul routes', async ({
    page,
  }) => {
    await login(page, 'browser_test_bel_vendor')

    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })

    // Menu checks
    await expect(sidebar.getByRole('link', { name: 'BEL registrations' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'JUL registrations' })).not.toBeVisible()

    // Route checks: accessing /bel is allowed
    await page.goto('/bel')
    await expect(page).toHaveURL(/\/bel$/)

    // Route checks: accessing /jul redirects to /forbidden
    await page.goto('/jul')
    await expect(page).toHaveURL(/\/forbidden$/)
  })

  test('admin sees both JUL and BEL registrations and review menus', async ({ page }) => {
    await login(page, 'browser_test_admin')

    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })

    await expect(sidebar.getByRole('link', { name: 'JUL registrations' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'JUL review' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'BEL registrations' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'BEL review' })).toBeVisible()

    // Route checks: admin can access both
    await page.goto('/jul')
    await expect(page).toHaveURL(/\/jul$/)

    await page.goto('/bel')
    await expect(page).toHaveURL(/\/bel$/)
  })
})
