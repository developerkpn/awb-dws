import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

test('uploads and submits a request, then paginates and sorts through the server', async ({
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

  const run = randomUUID()

  await page.goto('/driver-requests/new')
  await page.getByLabel(/^Plant target/).selectOption({ index: 1 })
  await page.getByLabel(/^Full name/).fill('Browser request ' + run)
  await page.getByLabel(/^License number/).fill(('SIM-' + run).slice(0, 25))
  await page.getByLabel(/^Place of birth/).fill('Karawang')
  await page.getByLabel(/^Date of birth/).fill('1990-01-01')
  await page.getByLabel(/^Phone number/).fill('0000000000')
  await page.getByLabel(/^Home city/).fill('Karawang')
  await page.getByLabel(/^Address line 1/).fill('Jl. Fixture 1')

  await page
    .getByRole('button', {
      name: 'Submit request',
      exact: true,
    })
    .click()

  await expect(page.getByText('Upload the license photo')).toBeVisible()

  for (const label of ['Driver license (SIM)', 'Driver photo'])
    await page.getByLabel(label, { exact: true }).setInputFiles({
      name: 'fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR5kAAAAASUVORK5CYII=',
        'base64',
      ),
    })

  await expect(page.getByText('fixture.png', { exact: true })).toHaveCount(2)

  await page
    .getByRole('button', {
      name: 'Submit request',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/driver-requests$/)
  await expect(page.getByRole('row').filter({ hasText: 'Browser request ' + run })).toBeVisible()

  const plants = await (await page.request.get('/api/driver-requests/plants')).json()
  const siteId = plants.data[0].code as string
  const documents = await uploads(page)

  for (let index = 0; index < 21; index++) {
    const id = randomUUID()

    const response = await page.request.post('/api/driver-requests', {
      headers: { Origin: 'http://127.0.0.1:5176' },
      data: driver(id.slice(0, 25), 'Pagination fixture ' + index, siteId, documents),
    })

    expect(response.status()).toBe(201)
  }

  await page.reload()
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')

  const nextPage = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return url.pathname === '/api/driver-requests' && url.searchParams.get('page') === '2'
  })

  await page
    .getByRole('button', {
      name: 'Next page',
      exact: true,
    })
    .click()

  expect((await nextPage).status()).toBe(200)
  await expect(page).toHaveURL(/page=2/)

  const sorted = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      url.pathname === '/api/driver-requests' && url.searchParams.get('sortBy') === 'driverName'
    )
  })

  await page
    .getByRole('table')
    .getByRole('button', {
      name: 'Driver',
      exact: true,
    })
    .click()

  expect((await sorted).status()).toBe(200)
  await expect(page).toHaveURL(/page=1/)

  await expect(
    page.getByRole('columnheader', {
      name: 'Driver',
      exact: true,
    }),
  ).toHaveAttribute('aria-sort', 'ascending')
})

test('Logistics reviews drivers and vehicles on the same page', async ({ page }) => {
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
  const plants = await (await page.request.get('/api/driver-requests/plants')).json()
  const siteId = plants.data[0].code as string
  const documents = await uploads(page)
  const names = ['Approve ' + randomUUID().slice(0, 8), 'Reject ' + randomUUID().slice(0, 8)]
  const plate = 'B ' + String(Date.now()).slice(-4) + ' REV'

  for (const name of names) {
    const response = await page.request.post('/api/driver-requests', {
      headers: { Origin: 'http://127.0.0.1:5176' },
      data: driver(randomUUID().slice(0, 25), name, siteId, documents),
    })

    expect(response.status()).toBe(201)
  }

  const vehicle = await page.request.post('/api/driver-requests', {
    headers: { Origin: 'http://127.0.0.1:5176' },
    data: {
      kind: 'VEHICLE',
      siteId,
      vehiclePlateNumber: plate,
      vehicleStnkPhotoUrl: documents.stnk,
    },
  })

  expect(vehicle.status()).toBe(201)
  await page.goto('/driver-requests?sortDirection=desc')
  await page.getByRole('button', { name: 'Approve ' + names[0] }).click()
  const approve = page.getByRole('dialog', { name: 'Approve request' })

  await expect(approve).toContainText('once SAP confirms it')
  await approve.getByLabel('Note for the requester').fill('Documents checked')

  await approve
    .getByRole('button', {
      name: 'Approve',
      exact: true,
    })
    .click()

  await expect(approve).not.toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: names[0] })).toHaveCount(0)
  await page.getByRole('button', { name: 'Reject ' + names[1] }).click()
  const reject = page.getByRole('dialog', { name: 'Reject request' })

  await reject
    .getByRole('button', {
      name: 'Reject',
      exact: true,
    })
    .click()

  await expect(reject.getByText('Enter a rejection reason.')).toBeVisible()
  await reject.getByLabel(/^Rejection reason/).fill('License photo is unreadable')

  await reject
    .getByRole('button', {
      name: 'Reject',
      exact: true,
    })
    .click()

  await expect(reject).not.toBeVisible()
  await page.getByRole('button', { name: 'Waiting for SAP' }).click()
  await page.getByRole('button', { name: names[0] }).click()
  const detail = page.getByRole('dialog', { name: 'Driver request' })

  await expect(detail).toContainText('Documents checked')
  await expect(detail).toContainText('Approved by')
  await page.keyboard.press('Escape')

  await page
    .getByRole('button', {
      name: 'Rejected',
      exact: true,
    })
    .click()

  await expect(page.getByRole('row').filter({ hasText: names[1] })).toContainText('Needs revision')
  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await page.getByRole('button', { name: 'Pending review' }).click()
  await page.getByRole('button', { name: 'Approve ' + plate }).click()

  await page
    .getByRole('dialog', { name: 'Approve request' })
    .getByRole('button', {
      name: 'Approve',
      exact: true,
    })
    .click()

  await expect(page.getByRole('row').filter({ hasText: plate })).toHaveCount(0)
})

async function uploads(page: Page) {
  const urls: Record<string, string> = {}

  for (const category of ['sim', 'driver', 'stnk']) {
    const response = await page.request.post('/api/documents/upload', {
      headers: { Origin: 'http://127.0.0.1:5176' },
      multipart: {
        category,
        file: {
          name: category + '.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR5kAAAAASUVORK5CYII=',
            'base64',
          ),
        },
      },
    })

    expect(response.status()).toBe(201)
    urls[category] = (await response.json()).data.url
  }

  return urls
}

function driver(
  licenseNumber: string,
  name: string,
  siteId: string,
  documents: Record<string, string>,
) {
  return {
    kind: 'DRIVER',
    siteId,
    driverLicenseNumber: licenseNumber,
    driverName: name,
    driverBirthPlace: 'Karawang',
    driverBirthDate: '1990-01-01',
    driverPhone: '0000000000',
    driverCity: 'Karawang',
    driverAddress: 'Jl. Fixture 1',
    driverLicensePhotoUrl: documents.sim,
    driverPhotoUrl: documents.driver,
  }
}
