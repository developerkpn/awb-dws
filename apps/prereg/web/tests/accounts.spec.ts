import { expect, test } from '@playwright/test'

test('restores real sessions, persists account edits and permissions, and logs out', async ({
  page,
}) => {
  await page.goto('/?view=admin')
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_admin')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  await page.reload()
  await page.getByRole('link', { name: 'User management', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  const username = `browser_${Date.now()}`
  await page.getByRole('button', { name: 'Add account', exact: true }).click()
  await expect(page).toHaveURL(/\/users\/new$/)
  await page.getByLabel('Full name').fill('Browser test account')
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill(username)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/users$/)
  await page.getByLabel('Search accounts').fill(username)
  const row = page.getByRole('row').filter({ hasText: username })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page).toHaveURL(/\/users\/[^/]+\/edit$/)
  await page.getByLabel('Full name').fill('Updated browser account')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page).toHaveURL(/\/users$/)

  await page.reload()
  await page.getByRole('link', { name: 'User management', exact: true }).click()
  await page.getByLabel('Search accounts').fill(username)
  await expect(page.getByRole('row').filter({ hasText: username })).toContainText(
    'Updated browser account',
  )

  await page.getByRole('link', { name: 'Role permissions', exact: true }).click()
  const permission = page.getByRole('checkbox', {
    name: 'LOGISTIC: View pre-registrations',
    exact: true,
  })
  const enabled = await permission.isChecked()
  await permission.setChecked(!enabled)
  await page
    .getByRole('row')
    .filter({ hasText: 'LOGISTIC' })
    .getByRole('button', { name: 'Save', exact: true })
    .click()
  await expect(
    page.getByRole('row').filter({ hasText: 'LOGISTIC' }).getByRole('status'),
  ).toHaveText('Saved')
  await page.reload()
  await page.getByRole('link', { name: 'Role permissions', exact: true }).click()
  if (enabled) await expect(permission).not.toBeChecked()
  else await expect(permission).toBeChecked()

  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()

  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_customer')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'User management' })).not.toBeVisible()
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
})
