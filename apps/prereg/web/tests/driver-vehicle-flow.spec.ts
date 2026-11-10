import { randomInt, randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

const photo = {
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR5kAAAAASUVORK5CYII=',
    'base64',
  ),
}

async function signIn(page: Page, username: string) {
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

async function openDriversAndVehicles(page: Page) {
  await page.getByRole('link', { name: 'Drivers & vehicles' }).click()
  await expect(page.getByRole('heading', { name: 'Drivers & vehicles' })).toBeVisible()
}

test('customer registers a driver and a vehicle, Logistics reviews, customer revises', async ({
  page,
}) => {
  const run = randomUUID().slice(0, 6).toUpperCase()
  const driverName = 'Flow driver ' + run
  const digits = String(randomInt(1000, 10000))

  const letters = () =>
    Array.from({ length: 3 }, () => String.fromCharCode(randomInt(65, 91))).join('')

  const plate = `B ${digits} ${letters()}`
  const revisedPlate = `B ${digits} ${letters()}`

  await signIn(page, 'browser_test_customer')
  await openDriversAndVehicles(page)
  await page.getByRole('button', { name: 'New driver' }).click()
  await expect(page.getByRole('heading', { name: 'New driver request' })).toBeVisible()
  await page.getByLabel(/^Plant target/).selectOption({ index: 1 })
  await page.getByLabel(/^Full name/).fill(driverName)
  await page.getByLabel(/^License number/).fill('E2E' + run + '001')
  await page.getByLabel(/^Place of birth/).fill('Karawang')
  await page.getByLabel(/^Date of birth/).fill('1991-02-03')
  await page.getByLabel(/^Phone number/).fill('081200000000')
  await page.getByLabel(/^Home city/).fill('Karawang')
  await page.getByLabel(/^Address line 1/).fill('Jl. Flow 1')
  await page.getByLabel('Driver license (SIM)', { exact: true }).setInputFiles(photo)
  await page.getByLabel('Driver photo', { exact: true }).setInputFiles(photo)
  await expect(page.getByText('photo.png', { exact: true })).toHaveCount(2)
  await page.getByRole('button', { name: 'Submit request' }).click()
  await expect(page.getByText('Driver request submitted.')).toBeVisible()
  const driverRow = page.getByRole('row').filter({ hasText: driverName })

  await driverRow.getByText('In review').click()
  const ownDetail = page.getByRole('dialog', { name: 'Driver request' })

  await expect(ownDetail).toContainText('Waiting for Logistics to review.')
  await expect(ownDetail.getByRole('button', { name: /Approve|Reject/ })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await expect(driverRow).toContainText('In review')
  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await page.getByRole('button', { name: 'New vehicle' }).click()
  await expect(page.getByRole('heading', { name: 'New vehicle request' })).toBeVisible()
  await page.getByLabel(/^Plant target/).selectOption({ index: 1 })
  await page.getByLabel(/^Plate number/).fill(plate)
  await page.getByLabel('Vehicle registration (STNK)', { exact: true }).setInputFiles(photo)
  await expect(page.getByText('photo.png', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Submit request' }).click()
  await expect(page.getByText('Vehicle request submitted.')).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: plate })).toContainText('In review')
  await signOut(page)

  await signIn(page, 'browser_test_logistic')
  await openDriversAndVehicles(page)

  await page
    .getByRole('button', {
      name: new RegExp('^' + driverName),
    })
    .click()

  const detail = page.getByRole('dialog', { name: 'Driver request' })

  await expect(detail.getByRole('button', { name: 'Reject' })).toBeVisible()
  await detail.getByRole('button', { name: 'Preview License photo' }).click()
  const preview = page.getByRole('dialog', { name: 'License photo' })

  await expect(preview.getByRole('img', { name: 'License photo' })).toBeVisible()
  const download = page.waitForEvent('download')

  await preview.getByRole('link', { name: 'Download' }).click()
  expect((await download).suggestedFilename()).toBe('photo.png')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Driver request' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Approve ' + driverName }).click()
  const approve = page.getByRole('dialog', { name: 'Approve request' })

  await expect(page.getByRole('dialog', { name: 'Driver request' })).toHaveCount(0)

  await approve.getByLabel('Note for the requester').fill('Documents checked')

  await approve
    .getByRole('button', {
      name: 'Approve',
      exact: true,
    })
    .click()

  await expect(approve).not.toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: driverName })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await page.getByRole('button', { name: 'Reject ' + plate }).click()
  const reject = page.getByRole('dialog', { name: 'Reject request' })

  await reject.getByLabel(/^Rejection reason/).fill('Plate does not match the STNK')

  await reject
    .getByRole('button', {
      name: 'Reject',
      exact: true,
    })
    .click()

  await expect(reject).not.toBeVisible()
  await signOut(page)

  await signIn(page, 'browser_test_customer')
  await openDriversAndVehicles(page)

  await expect(page.getByRole('row').filter({ hasText: driverName })).toContainText('In review')

  await page.getByRole('row').filter({ hasText: driverName }).getByText('In review').click()

  const customerDetail = page.getByRole('dialog', { name: 'Driver request' })

  await expect(customerDetail).toContainText('Approved by Logistics')
  await expect(customerDetail).toContainText('Documents checked')
  await page.keyboard.press('Escape')

  await expect(page.getByRole('group', { name: 'Status filter' }).getByRole('button')).toHaveText([
    'All',
    'In review',
    'Ready to use',
    'Needs revision',
  ])

  await page
    .getByRole('button', {
      name: 'In review',
      exact: true,
    })
    .click()

  await expect(page.getByRole('row').filter({ hasText: driverName })).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Needs revision',
      exact: true,
    })
    .click()

  await expect(page.getByRole('row').filter({ hasText: driverName })).toHaveCount(0)

  await page
    .getByRole('button', {
      name: 'All',
      exact: true,
    })
    .click()

  await page.getByRole('tab', { name: 'Vehicles' }).click()
  const vehicleRow = page.getByRole('row').filter({ hasText: plate })

  await expect(vehicleRow).toContainText('Needs revision')
  await vehicleRow.getByRole('button', { name: 'Revise' }).click()
  await expect(page.getByRole('heading', { name: 'Revise vehicle request' })).toBeVisible()
  await expect(page.getByText('Plate does not match the STNK')).toBeVisible()
  await page.getByLabel(/^Plate number/).fill(revisedPlate)
  await page.getByRole('button', { name: 'Submit revision' }).click()
  await expect(page.getByText('Revision submitted.')).toBeVisible()

  await expect(page.getByRole('row').filter({ hasText: revisedPlate })).toContainText('In review')

  await signOut(page)

  await signIn(page, 'browser_test_logistic')
  await openDriversAndVehicles(page)
  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await page.getByRole('button', { name: 'Approve ' + revisedPlate }).click()

  await page
    .getByRole('dialog', { name: 'Approve request' })
    .getByRole('button', {
      name: 'Approve',
      exact: true,
    })
    .click()

  await page.getByRole('button', { name: 'Waiting for SAP' }).click()

  await expect(page.getByRole('row').filter({ hasText: revisedPlate })).toContainText(
    'Approved · waiting for SAP',
  )
})
