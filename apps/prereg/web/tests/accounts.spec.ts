import { expect, test } from '@playwright/test'

test('restores real sessions, persists account edits and permissions, and logs out', async ({
  page,
}) => {
  await page.goto('/?view=admin')
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_admin')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeVisible()

  const sidebar = page.getByRole('complementary', { name: 'Sidebar' })
  await expect(sidebar).not.toContainText('AWB')
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(sidebar.getByRole('link', { name: 'User management' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'User management' })).toHaveText('')
  await expect(sidebar.getByRole('img', { name: 'KPN' })).toBeVisible()
  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect(sidebar.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Collapse sidebar' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Advanced', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /^Roles filter/ }).click()
  const rolesFilter = page.getByRole('dialog', { name: 'Roles filter', exact: true })
  await expect(rolesFilter.getByRole('textbox', { name: 'Search roles' })).toBeFocused()
  await rolesFilter.getByRole('textbox', { name: 'Search roles' }).fill('admin')
  await rolesFilter.locator('input[value="ADMIN"]').check()
  await rolesFilter.getByRole('textbox', { name: 'Search roles' }).fill('logistic')
  await rolesFilter.locator('input[value="LOGISTIC"]').check()
  await rolesFilter.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Roles filter, 2 selected' })).toBeVisible()
  await page.getByRole('button', { name: /^Plants filter/ }).click()
  const plantsFilter = page.getByRole('dialog', { name: 'Plants filter', exact: true })
  await plantsFilter.getByRole('checkbox').nth(0).check()
  await plantsFilter.getByRole('checkbox').nth(1).check()
  await plantsFilter.getByRole('button', { name: 'Done', exact: true }).click()
  expect(new URL(page.url()).searchParams.getAll('roles')).toEqual(['ADMIN', 'LOGISTIC'])
  expect(new URL(page.url()).searchParams.getAll('plantIds')).toHaveLength(2)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Roles filter, 2 selected' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plants filter, 2 selected' })).toBeVisible()
  await page.getByRole('button', { name: /^Roles filter/ }).click()
  await expect(rolesFilter.locator('input[value="ADMIN"]')).toBeChecked()
  await expect(rolesFilter.locator('input[value="LOGISTIC"]')).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(rolesFilter).not.toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('button', { name: 'Roles filter', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plants filter', exact: true })).toBeVisible()

  await page.reload()
  await page.getByRole('link', { name: 'User management', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  const username = `browser_${Date.now()}`
  await page.getByLabel('Search accounts').fill('browser_test_customer')
  const customerRow = page.getByRole('row').filter({ hasText: 'browser_test_customer' })
  await expect(customerRow).toContainText('25 plants')
  const beforeHeight = (await customerRow.boundingBox())!.height
  expect(beforeHeight).toBeLessThan(110)
  await customerRow
    .getByRole('button', { name: 'View Plant access for browser_test_customer', exact: true })
    .click()
  const access = page.getByRole('dialog', {
    name: 'Plant access for browser_test_customer',
    exact: true,
  })
  await expect(access.getByRole('listitem')).toHaveCount(25)
  await access.getByRole('textbox', { name: 'Search assigned plants' }).fill('plant 24')
  await expect(access.getByRole('listitem')).toHaveCount(1)
  expect((await customerRow.boundingBox())!.height).toBe(beforeHeight)
  await page.keyboard.press('Escape')
  await page.getByLabel('Search accounts').fill('')
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

  const savedRow = page.getByRole('row').filter({ hasText: username })
  await savedRow.getByRole('button', { name: 'Deactivate', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'Deactivate account?' })
  await expect(confirmation).toBeVisible()
  await expect(confirmation.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(confirmation).not.toBeVisible()
  await expect(savedRow.getByRole('button', { name: 'Deactivate', exact: true })).toBeFocused()
  await expect(savedRow).toContainText('Active')
  await savedRow.getByRole('button', { name: 'Deactivate', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Deactivate', exact: true }).click()
  await expect(savedRow).toContainText('Inactive')
  await savedRow.getByRole('button', { name: 'Activate', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Activate', exact: true }).click()
  await expect(savedRow.getByRole('button', { name: 'Deactivate', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Roles & permissions', exact: true }).click()
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')
  await page.getByRole('button', { name: 'Manage LOGISTIC permissions' }).click()
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')
  const permission = page.getByRole('checkbox', {
    name: 'LOGISTIC: View pre-registrations',
    exact: true,
  })
  const enabled = await permission.isChecked()
  await page.getByLabel('Search permissions').fill('pre-registrations')
  await page.getByRole('checkbox', { name: 'Select page of Pre-registration permissions' }).check()
  await expect(permission).toBeChecked()
  if (await page.getByRole('button', { name: 'Discard', exact: true }).isEnabled()) {
    await page.getByRole('button', { name: 'Discard', exact: true }).click()
  }
  await page.getByLabel('Search permissions').fill('')
  await permission.setChecked(!enabled)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Permissions saved')
  await page.reload()
  if (enabled) await expect(permission).not.toBeChecked()
  else await expect(permission).toBeChecked()

  await page.getByRole('button', { name: 'All roles', exact: true }).click()
  await page.getByRole('button', { name: 'Manage ADMIN permissions' }).click()
  await expect(
    page.getByRole('checkbox', { name: 'ADMIN: View accounts', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'ADMIN: View accounts', exact: true }),
  ).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled()

  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()

  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_customer')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'User management' })).not.toBeVisible()
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
})
