import { expect, test } from '@playwright/test'

test('uses the SAP code as the partner username and preserves plant access when editing', async ({
  page,
}) => {
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

  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()
  const username = `000-E2E-${Date.now()}`

  await page
    .getByRole('button', {
      name: 'Add account',
      exact: true,
    })
    .click()

  await page.getByRole('radio', { name: /Business partner/ }).check()

  const usernameError = page.getByText('Username must contain at least 3 characters', {
    exact: true,
  })

  await expect(usernameError).toHaveCount(0)
  await expect(page.getByLabel('Username (SAP Code)')).toHaveAttribute('aria-invalid', 'false')
  await page.getByLabel('Company / partner name').fill('Browser partner company')

  await page
    .getByRole('button', {
      name: 'Create account',
      exact: true,
    })
    .click()

  await expect(usernameError).toBeVisible()
  await page.getByRole('radio', { name: /Internal staff/ }).check()
  await expect(usernameError).toHaveCount(0)
  await expect(page.getByLabel('Full name')).toHaveValue('Browser partner company')
  await page.getByRole('radio', { name: /Business partner/ }).check()
  await expect(usernameError).toHaveCount(0)
  await expect(page.getByLabel('Username (SAP Code)')).toHaveAttribute('aria-invalid', 'false')

  const role = page.getByRole('combobox', {
    name: 'Role',
    exact: true,
  })

  await expect(role).toHaveValue('CUSTOMER')
  await page.getByRole('checkbox', { name: /Browser test plant/ }).check()
  const roleCount = await role.locator('option').count()
  const roleLabel = await role.locator('option:checked').textContent()

  const previewRole = page
    .getByRole('complementary', { name: 'Account summary' })
    .locator('dd')
    .nth(1)

  await page.getByLabel('Username (SAP Code)').fill(username)
  await expect(role).toHaveValue('CUSTOMER')
  await expect(role.locator('option')).toHaveCount(roleCount)
  await expect(previewRole).toHaveText(roleLabel!)
  await expect(page.getByRole('checkbox', { name: /Browser test plant/ })).toBeChecked()
  await expect(page.getByRole('heading', { name: 'Partner connections' })).toHaveCount(0)
  expect(username).toMatch(/^000-E2E-/)

  await page
    .getByRole('button', {
      name: 'Create account',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/users$/)
  await page.getByLabel('Search accounts').fill(username)
  const row = page.getByRole('row').filter({ hasText: username })

  await expect(row).toContainText('Browser partner company')
  await expect(row.getByRole('cell').first().locator('p').nth(1)).toHaveText(username)
  await expect(row.getByRole('cell').first().locator('p').nth(1)).not.toHaveClass(/rounded/)

  await row
    .getByRole('button', {
      name: 'Edit',
      exact: true,
    })
    .click()

  await expect(page.getByLabel('Username (SAP Code)')).toHaveAttribute('readonly', '')
  await expect(page.getByRole('radio', { name: /Business partner/ })).toBeDisabled()
  await page.getByLabel('Company / partner name').fill('Updated partner company')

  await page
    .getByRole('button', {
      name: 'Save changes',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/users$/)
  await page.getByLabel('Search accounts').fill(username)

  await row
    .getByRole('button', {
      name: 'Edit',
      exact: true,
    })
    .click()

  await expect(page.getByLabel('Company / partner name')).toHaveValue('Updated partner company')
  await expect(page.getByRole('checkbox', { name: /Browser test plant/ })).toBeChecked()
})
