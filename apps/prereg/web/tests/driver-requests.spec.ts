import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('uploads and submits a request, then paginates and sorts through the server', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_test_admin')
  await page.getByLabel(/^Password/).fill('Browser-Only-Password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  const run = randomUUID()
  await page.goto('/pre-registration/new')
  await page.getByLabel('Driver License Number (SIM)').fill('SIM-' + run)
  await page.getByLabel('Driver Full Name').fill('Browser request ' + run)
  await page.getByLabel(/^Place of Birth/).fill('Fixture city')
  await page.getByLabel(/^Date of Birth/).fill('1990-01-01')
  await page.getByLabel('Phone / WhatsApp Number').fill('0000000000')
  await page.getByLabel('Full Address').fill('Fixture address')
  await page.getByLabel('License Plate Number').fill('B-' + run.slice(0, 10))
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR5kAAAAASUVORK5CYII=',
        'base64',
      ),
    })
  await expect(page.getByText('Uploaded', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Submit Request', exact: true }).click()
  await expect(page).toHaveURL(/\/pre-registration$/)
  await expect(page.getByRole('row').filter({ hasText: 'Browser request ' + run })).toBeVisible()

  for (let index = 0; index < 21; index++) {
    const id = randomUUID()
    const response = await page.request.post('/api/driver-requests', {
      headers: { Origin: 'http://127.0.0.1:5176' },
      data: {
        driverLicenseNumber: id,
        driverName: 'Pagination fixture ' + index,
        driverAddress: 'Fixture address',
        driverBirthPlace: 'Fixture city',
        driverBirthDate: '1990-01-01',
        driverPhone: '0000000000',
        vehiclePlateNumber: id.slice(0, 18),
      },
    })
    expect(response.status()).toBe(201)
  }

  await page.reload()
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')
  const nextPage = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/driver-requests' && url.searchParams.get('page') === '2'
  })
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  expect((await nextPage).status()).toBe(200)
  await expect(page).toHaveURL(/page=2/)

  const sorted = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/driver-requests' && url.searchParams.get('sortBy') === 'driverName'
    )
  })
  await page.getByRole('table').getByRole('button', { name: 'Driver', exact: true }).click()
  expect((await sorted).status()).toBe(200)
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByRole('columnheader', { name: 'Driver', exact: true })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
})
