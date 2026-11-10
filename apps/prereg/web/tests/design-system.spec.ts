import { expect, test } from '@playwright/test'

test('persists dark mode, uses shared dialogs, and preserves selections across permission pages', async ({
  page,
}) => {
  page.on('dialog', () => {
    throw new Error('Unexpected native browser prompt')
  })

  await page.goto('/login')

  await page
    .getByRole('button', {
      name: 'Change theme',
      exact: true,
    })
    .click()

  await page
    .getByRole('button', {
      name: 'Dark mode',
      exact: true,
    })
    .click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

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
  await page.evaluate(() => document.fonts.ready)

  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain('Inter Variable')

  expect(await page.evaluate(() => document.fonts.check('400 14px "Inter Variable"'))).toBe(true)

  await expect(page.getByRole('banner').getByRole('button', { name: 'Change theme' })).toHaveCount(
    0,
  )

  await expect(
    page
      .getByRole('complementary', { name: 'Sidebar' })
      .getByRole('button', { name: 'Change theme' }),
  ).toBeVisible()

  const search = page.getByRole('searchbox', { name: 'Search accounts' })

  const spacing = await search.evaluate((input) => {
    const icon = input.parentElement!.querySelector('svg')!.getBoundingClientRect()
    const bounds = input.getBoundingClientRect()
    const textLeft = bounds.left + parseFloat(getComputedStyle(input).paddingLeft)

    return textLeft - icon.right
  })

  expect(spacing).toBeGreaterThanOrEqual(8)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Add account' }).click()
  await page.getByLabel('Full name').fill('Unsaved draft')

  await expect(page.getByRole('complementary', { name: 'Account summary' })).toContainText(
    'Unsaved draft',
  )

  await page
    .getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    .click()

  await expect(page.getByRole('dialog', { name: 'Discard account changes?' })).toBeVisible()

  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    .click()

  await expect(page.getByLabel('Full name')).toHaveValue('Unsaved draft')

  await expect(
    page.getByRole('button', {
      name: 'Cancel',
      exact: true,
    }),
  ).toHaveCSS('background-color', 'rgb(27, 27, 27)')

  await page.setViewportSize({
    width: 390,
    height: 844,
  })

  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await page.setViewportSize({
    width: 1280,
    height: 900,
  })

  await page
    .getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    .click()

  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: 'Discard changes',
      exact: true,
    })
    .click()

  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  const list = await page.request.get('/api/access/roles?q=LOGISTIC')
  const role = (await list.json()).data.items[0] as { id: string }

  await page.goto(`/roles/${role.id}/permissions?limit=2`)

  const first = page.getByRole('checkbox', {
    name: 'LOGISTIC: View role permissions',
    exact: true,
  })

  await expect(first).toBeVisible()
  const enabled = await first.isChecked()

  await first.setChecked(!enabled)

  await page
    .getByRole('button', {
      name: 'Next page',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/page=2/)

  await page
    .getByRole('button', {
      name: 'Previous page',
      exact: true,
    })
    .click()

  await expect(first).toHaveJSProperty('checked', !enabled)

  await page
    .getByRole('button', {
      name: 'Save changes',
      exact: true,
    })
    .click()

  await expect(page.getByRole('status')).toHaveText('Permissions saved')
  await page.reload()
  await expect(first).toHaveJSProperty('checked', !enabled)

  await page
    .getByRole('button', {
      name: 'Change theme',
      exact: true,
    })
    .click()

  await page
    .getByRole('button', {
      name: 'Light mode',
      exact: true,
    })
    .click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
