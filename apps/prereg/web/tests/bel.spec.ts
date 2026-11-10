import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const screenshotDir = process.env.BEL_SCREENSHOT_DIR

async function snap(page: Page, filename: string) {
  if (!screenshotDir) return

  fs.mkdirSync(screenshotDir, {
    recursive: true,
  })

  await page.screenshot({
    path: path.join(screenshotDir, filename),
    fullPage: true,
  })
}

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

async function signOut(page: Page) {
  await page
    .getByRole('button', {
      name: 'Sign out',
      exact: true,
    })
    .click()

  await expect(
    page.getByRole('button', {
      name: 'Sign in',
      exact: true,
    }),
  ).toBeVisible()
}

async function chooseTransport(page: Page, lineIndex: number, driver: string, vehicle: string) {
  await page
    .getByRole('combobox', {
      name: `Driver SIM line ${lineIndex}`,
      exact: true,
    })
    .fill(driver)

  const driverOption = page.getByRole('listbox').getByRole('option', {
    name: new RegExp(driver),
  })

  await expect(driverOption.first()).toBeVisible()
  await driverOption.first().click()

  await page
    .getByRole('combobox', {
      name: `Vehicle plate line ${lineIndex}`,
      exact: true,
    })
    .fill(vehicle)

  const vehicleOption = page.getByRole('listbox').getByRole('option', {
    name: new RegExp(vehicle),
  })

  await expect(vehicleOption.first()).toBeVisible()
  await vehicleOption.first().click()
}

test('vendor submits BEL without DP check, enforces PO quota, Logistics approves to Oracle BEL without SAP password, and lists sort', async ({
  page,
}) => {
  const external: string[] = []

  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) {
      external.push(request.url())
    }
  })

  await login(page, 'browser_test_bel_vendor')
  await page.goto('/bel/new')

  const poSelect = page.locator('select[aria-label="PO item line 1"]')

  await expect(poSelect.locator('option')).toHaveCount(4)

  await poSelect.selectOption({
    index: 1,
  })

  await expect(page.getByText('PO 4500000001 / 00010').first()).toBeVisible()
  await expect(page.getByText('650 KG', { exact: true }).first()).toBeVisible()

  const quantityInput = page.getByLabel('Quantity line 1', {
    exact: true,
  })

  await quantityInput.fill('700')
  await expect(page.getByText('Exceeds remaining PO quota (650 KG)')).toBeVisible()

  await quantityInput.fill('120')
  await chooseTransport(page, 1, '8800000000000001', 'B 1001 DEMO')
  await page.evaluate(() => document.querySelector('main')?.scrollTo(0, 0))
  await snap(page, 'bel-form.png')

  await page
    .getByRole('button', {
      name: 'Save & submit',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/bel\/[0-9a-f-]{36}$/)
  await expect(page.getByText('Submitted', { exact: true }).first()).toBeVisible()
  const detailUrl = page.url()

  await page.goto('/bel/new')
  const poSelectSecond = page.locator('select[aria-label="PO item line 1"]')

  await expect(poSelectSecond.locator('option')).toHaveCount(4)

  await poSelectSecond.selectOption({
    index: 2,
  })

  await page
    .getByLabel('Quantity line 1', {
      exact: true,
    })
    .fill('90')

  await chooseTransport(page, 1, '8800000000000002', 'B 1002 DEMO')

  await page
    .getByRole('button', {
      name: 'Save draft',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/bel\/[0-9a-f-]{36}$/)
  await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible()

  await page.goto('/bel')

  await expect(
    page.getByRole('heading', {
      name: 'BEL registrations',
      exact: true,
    }),
  ).toBeVisible()

  await expect(page.getByText('4500000001/00010').first()).toBeVisible()
  await expect(page.getByText('4500000001/00020').first()).toBeVisible()
  await snap(page, 'bel-list.png')

  await signOut(page)
  await login(page, 'browser_test_logistic')

  await page.goto('/bel/review')

  await expect(
    page.getByRole('heading', {
      name: 'BEL review',
      exact: true,
    }),
  ).toBeVisible()

  await expect(page.getByText('4500000001/00010').first()).toBeVisible()
  await snap(page, 'bel-review.png')

  await page.goto(detailUrl)
  await expect(page.getByLabel(/SAP password/i)).toHaveCount(0)

  await page
    .getByRole('button', {
      name: 'Approve',
      exact: true,
    })
    .click()

  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: 'Approve & stage',
      exact: true,
    })
    .click()

  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Staged to PREREG_BEL_SAP')).toBeVisible()
  await snap(page, 'bel-approved-detail.png')

  await page.goto('/bel')

  await page
    .getByRole('button', {
      name: 'Registration',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/sortBy=number/)

  expect(external).toEqual([])
})
