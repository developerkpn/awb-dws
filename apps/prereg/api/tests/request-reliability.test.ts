import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { expect, it, vi } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import repository from '../src/modules/driver-request/driver-request.repository'
import { createTestUser, grant, origin, sessionFor, plantFor, driverBody } from './helpers'

it('allows only one simultaneous submission for the same license', async () => {
  const owner = await sessionFor('CUSTOMER')

  await grant(owner.user.roleId, 'prereg:create')
  const token = randomUUID()
  const siteId = await plantFor(owner.user.id)

  const body = await driverBody(owner.user.id, siteId, `REVIEW-${token}`.slice(0, 25))

  const lookup = repository.findConflicts.bind(repository)
  let arrivals = 0
  let release!: () => void

  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  const spy = vi.spyOn(repository, 'findConflicts').mockImplementation(async (...args) => {
    const result = await lookup(...args)

    if (++arrivals === 2) release()

    await gate

    return result
  })

  try {
    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app)
          .post('/api/driver-requests')
          .set('Origin', origin)
          .set('Cookie', owner.cookie)
          .send(body),
      ),
    )

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409])
  } finally {
    spy.mockRestore()

    await prisma.driverRequest.deleteMany({
      where: { submittedBy: owner.user.id },
    })
  }
})

it('paginates and sorts all owned requests on the server with a default of 20', async () => {
  const owner = await sessionFor('CUSTOMER')

  await grant(owner.user.roleId, 'prereg:read')

  await prisma.driverRequest.createMany({
    data: Array.from({ length: 23 }, (_, index) => ({
      submittedBy: owner.user.id,
      driverLicenseNumber: randomUUID(),
      driverName: 'Fixture ' + String(index).padStart(2, '0'),
      driverAddress: 'Fixture address',
      driverBirthPlace: 'Fixture city',
      driverBirthDate: new Date('1990-01-01'),
      driverPhone: '0000000000',
    })),
  })

  const first = await request(app).get('/api/driver-requests').set('Cookie', owner.cookie)

  expect(first.body.data).toMatchObject({
    page: 1,
    limit: 20,
    total: 23,
  })

  expect(first.body.data.items).toHaveLength(20)

  const second = await request(app)
    .get('/api/driver-requests?page=2&sortBy=driverName&sortDirection=asc')
    .set('Cookie', owner.cookie)

  expect(second.body.data.items.map((row: { driverName: string }) => row.driverName)).toEqual([
    'Fixture 20',
    'Fixture 21',
    'Fixture 22',
  ])

  expect(
    (await request(app).get('/api/driver-requests?sortBy=passwordHash').set('Cookie', owner.cookie))
      .status,
  ).toBe(422)

  const list = (query: string) =>
    request(app)
      .get('/api/driver-requests?' + query)
      .set('Cookie', owner.cookie)

  expect((await list('status=SUBMITTED,APPROVED')).body.data.total).toBe(23)
  expect((await list('status=REJECTED,SENT_TO_PLANT')).body.data.total).toBe(0)
  expect((await list('status=SUBMITTED,UNKNOWN')).status).toBe(422)
})

it('rejects document references belonging to another account or the wrong category', async () => {
  const owner = await sessionFor('CUSTOMER')

  await grant(owner.user.roleId, 'prereg:create')
  const other = await createTestUser('VENDOR')

  const document = await prisma.document.create({
    data: {
      fileKey: randomUUID(),
      fileName: 'fixture.png',
      mimeType: 'image/png',
      fileSize: 1,
      category: 'sim',
      uploadedBy: other.id,
    },
  })

  const body = {
    ...(await driverBody(owner.user.id, await plantFor(owner.user.id), randomUUID().slice(0, 25))),
    driverLicensePhotoUrl: '/api/documents/' + document.id,
  }

  const submit = (data: typeof body) =>
    request(app)
      .post('/api/driver-requests')
      .set('Origin', origin)
      .set('Cookie', owner.cookie)
      .send(data)

  expect((await submit(body)).status).toBe(422)

  await prisma.document.update({
    where: { id: document.id },
    data: {
      uploadedBy: owner.user.id,
      category: 'stnk',
    },
  })

  expect((await submit(body)).status).toBe(422)

  await prisma.document.update({
    where: { id: document.id },
    data: { category: 'sim' },
  })

  expect((await submit(body)).status).toBe(201)
})
