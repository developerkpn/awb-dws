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

async function chooseDocument(page: Page, index: number) {
  const documents = page.getByRole('combobox', {
    name: 'Delivery order',
    exact: true,
  })

  await documents.click()
  await documents.fill('')
  const option = page.getByRole('listbox').getByRole('option').nth(index)

  await expect(option).toBeVisible()
  await option.click()
}

async function chooseTransport(page: Page) {
  await page
    .getByRole('combobox', {
      name: 'Driver license',
      exact: true,
    })
    .fill('8800000000000001')

  await page
    .getByRole('listbox')
    .getByRole('option', { name: /8800000000000001/ })
    .click()

  await page
    .getByRole('combobox', {
      name: 'Vehicle plate',
      exact: true,
    })
    .fill('B 1001 DEMO')

  await page
    .getByRole('option', {
      name: 'B 1001 DEMO',
      exact: true,
    })
    .click()
}

test('customer submits JUL, Logistics confirms a loading note, and lists sort and paginate on the server', async ({
  page,
}) => {
  const external: string[] = []

  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname))
      external.push(request.url())
  })

  await login(page, 'browser_test_jul_customer')
  await page.goto('/jul/new')
  await chooseDocument(page, 0)

  await page
    .getByRole('button', {
      name: 'Check document',
      exact: true,
    })
    .click()

  await expect(page.getByText('Down payment eligible', { exact: true })).toBeVisible()

  for (const label of ['Material', 'Contract quantity', 'O/S SAP quantity', 'Holding quantity'])
    await expect(page.getByText(label, { exact: true })).toBeVisible()

  await expect(page.getByText('100,000 KG').first()).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Add allocation',
      exact: true,
    })
    .click()

  await page
    .getByRole('textbox', {
      name: 'Quantity',
      exact: true,
    })
    .fill('12')

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const date = ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-')

  await page.getByLabel('Loading date', { exact: true }).fill(date)
  await chooseTransport(page)

  await page
    .getByRole('button', {
      name: 'Submit for review',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/\/jul\/[0-9a-f-]{36}$/)
  await expect(page.getByText('SUBMITTED', { exact: true }).first()).toBeVisible()
  const detailUrl = page.url()
  const detail = await (await page.request.get('/api/jul/' + detailUrl.split('/').at(-1))).json()
  const documentId = detail.data.lines[0].documentId as string

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

  await login(page, 'browser_test_logistic')
  await page.goto('/jul/review')
  await expect(page.getByRole('heading', { name: 'JUL review' })).toBeVisible()
  await page.goto(detailUrl)
  await page.getByLabel('Approve this allocation', { exact: true }).check()
  await page.getByLabel('Your SAP password', { exact: true }).fill('Browser-SAP-Password')

  await page
    .getByRole('button', {
      name: 'Approve & create loading notes',
      exact: true,
    })
    .click()

  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: 'Approve and create',
      exact: true,
    })
    .click()

  await expect(page.getByText('COMPLETED', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/^DEMO-JUL-/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/^DEMO-JUL-/)).toBeVisible()

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

  await login(page, 'browser_test_jul_customer')
  await page.goto('/jul/new')
  await page.getByLabel('Registration mode', { exact: true }).selectOption('multi')
  await chooseDocument(page, 0)

  await page
    .getByRole('button', {
      name: 'Check document',
      exact: true,
    })
    .click()

  await page
    .getByRole('button', {
      name: 'Add allocation',
      exact: true,
    })
    .click()

  await chooseDocument(page, 3)

  await page
    .getByRole('button', {
      name: 'Check document',
      exact: true,
    })
    .click()

  await page
    .getByRole('button', {
      name: 'Add allocation',
      exact: true,
    })
    .click()

  const quantities = page.getByRole('textbox', { name: /^Quantity \(/ })

  await quantities.nth(0).fill('10')
  await quantities.nth(1).fill('15')
  await page.getByLabel('Loading date', { exact: true }).fill(date)
  await chooseTransport(page)

  await page
    .getByRole('button', {
      name: 'Submit for review',
      exact: true,
    })
    .click()

  await expect(page.getByText('Multi-DO trip')).toBeVisible()
  await expect(page.getByText('SUBMITTED', { exact: true }).first()).toBeVisible()

  for (let index = 0; index < 20; index++) {
    const result = await page.request.post('/api/jul', {
      headers: { Origin: 'http://127.0.0.1:5176' },
      data: {
        lines: [
          {
            documentId,
            variant: 'LCO',
            quantity: '1',
            mediaTransport: 'T',
          },
        ],
      },
    })

    expect(result.status()).toBe(201)
  }

  await page.goto('/jul')
  await expect(page.getByLabel('Rows per page')).toHaveValue('20')

  const next = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/jul' &&
      new URL(response.url()).searchParams.get('page') === '2',
  )

  await page
    .getByRole('button', {
      name: 'Next page',
      exact: true,
    })
    .click()

  expect((await next).status()).toBe(200)

  const sorted = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/jul' &&
      new URL(response.url()).searchParams.get('sortBy') === 'number',
  )

  await page
    .getByRole('columnheader', {
      name: 'Registration',
      exact: true,
    })
    .getByRole('button')
    .click()

  expect((await sorted).status()).toBe(200)

  await expect(
    page.getByRole('columnheader', {
      name: 'Registration',
      exact: true,
    }),
  ).toHaveAttribute('aria-sort', 'ascending')

  expect(external).toEqual([])
})
