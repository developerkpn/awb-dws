import { expect, test } from '@playwright/test'

test('sorts tables through their headers, preserves URL state, and retains permission drafts', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_admin')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  await page.goto('/users?limit=2&page=2&q=browser')
  const table = page.getByRole('table', { name: 'User accounts' })
  const sorted = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/users' &&
      url.searchParams.get('sortBy') === 'name' &&
      url.searchParams.get('sortDirection') === 'asc'
    )
  })
  await table.getByRole('button', { name: 'User', exact: true }).click()
  const data = (await (await sorted).json()).data as { items: { name: string }[] }
  await expect(page).toHaveURL(/page=1/)
  await expect(page).toHaveURL(/q=browser/)
  await expect(table.getByRole('columnheader', { name: 'User', exact: true })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  await expect(table.getByRole('row').nth(1).getByRole('cell').first()).toContainText(
    data.items[0]!.name,
  )
  await table.getByRole('button', { name: 'User', exact: true }).press('Enter')
  await expect(table.getByRole('columnheader', { name: 'User', exact: true })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
  await page.reload()
  await expect(table.getByRole('columnheader', { name: 'User', exact: true })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
  await expect(
    table.getByRole('columnheader', { name: 'Actions', exact: true }).getByRole('button'),
  ).toHaveCount(0)

  let releaseRoles!: () => void
  let pauseRoles = true
  const rolesGate = new Promise<void>((resolve) => {
    releaseRoles = resolve
  })
  await page.route('**/api/access/roles?*', async (route) => {
    if (pauseRoles) {
      pauseRoles = false
      await rolesGate
    }
    await route.continue()
  })
  await page.goto('/roles?limit=2&page=2')
  const roles = page.getByRole('table', { name: 'Roles', exact: true })
  let loadingWidths: number[] = []
  try {
    await expect(roles).toHaveAttribute('aria-busy', 'true')
    await expect(roles.locator('[data-slot="skeleton"]').first()).toBeVisible()
    await expect(page.locator('.ui-spinner')).toHaveCount(0)
    loadingWidths = await roles
      .getByRole('columnheader')
      .evaluateAll((headers) => headers.map((header) => header.getBoundingClientRect().width))
  } finally {
    releaseRoles()
  }
  await roles.getByRole('button', { name: 'Access', exact: true }).click()
  const loadedWidths = await roles
    .getByRole('columnheader')
    .evaluateAll((headers) => headers.map((header) => header.getBoundingClientRect().width))
  loadedWidths.forEach((width, index) =>
    expect(Math.abs(width - loadingWidths[index]!)).toBeLessThanOrEqual(1),
  )
  await expect(roles.getByRole('button', { name: /^Manage .+ permissions$/ }).first()).toHaveText(
    '',
  )
  await expect(page).toHaveURL(/page=1/)
  await expect(page).toHaveURL(/sortBy=permissionCount/)
  await roles.getByRole('button', { name: 'Access', exact: true }).click()
  await expect(roles.getByRole('columnheader', { name: 'Access', exact: true })).toHaveAttribute(
    'aria-sort',
    'descending',
  )

  const response = await page.request.get('/api/access/roles?q=LOGISTIC')
  const role = (await response.json()).data.items[0] as { id: string }
  await page.goto(`/roles/${role.id}/permissions?limit=2`)
  const permissions = page.getByRole('table', { name: 'Role permissions' })
  const choice = permissions.getByRole('checkbox', {
    name: 'LOGISTIC: View role permissions',
    exact: true,
  })
  await expect(choice).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Administration/ }).locator('svg')).toHaveCount(0)
  const checked = await choice.isChecked()
  await choice.setChecked(!checked)
  await permissions.getByRole('button', { name: 'Permission', exact: true }).click()
  await expect(
    permissions.getByRole('columnheader', { name: 'Permission', exact: true }),
  ).toHaveAttribute('aria-sort', 'ascending')
  await permissions.getByRole('button', { name: 'Action', exact: true }).click()
  await expect(
    permissions.getByRole('columnheader', { name: 'Action', exact: true }),
  ).toHaveAttribute('aria-sort', 'ascending')
  await permissions.getByRole('button', { name: 'Module', exact: true }).click()
  await expect(choice).toBeChecked({ checked: !checked })
})
