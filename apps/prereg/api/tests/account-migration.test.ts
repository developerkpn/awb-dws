import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'

describe('Account master simplification migration', () => {
  it('preserves city names, primary partner location and account IDs before dropping master tables', async () => {
    const schema = `migration_test_${randomUUID().replaceAll('-', '')}`
    const ids = Array.from({ length: 9 }, () => randomUUID())

    const migration = readFileSync(
      new URL(
        '../prisma/migrations/20261106110000_simplify_account_masters/migration.sql',
        import.meta.url,
      ),
      'utf8',
    )

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`)
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`)
      for (const statement of [
        'CREATE TABLE mst_city (id UUID PRIMARY KEY, name TEXT)',
        'CREATE TABLE mst_transporter (id UUID PRIMARY KEY, city_id UUID REFERENCES mst_city(id))',
        'CREATE TABLE mst_driver (id UUID PRIMARY KEY, city_id UUID REFERENCES mst_city(id))',
        'CREATE TABLE awb_driver_request (id UUID PRIMARY KEY, driver_city_id UUID REFERENCES mst_city(id))',
        'CREATE TABLE mst_user (id UUID PRIMARY KEY, account_type TEXT)',
        'CREATE TABLE mst_partner (id UUID PRIMARY KEY, city TEXT, country TEXT)',
        'CREATE TABLE mst_user_partner (id UUID PRIMARY KEY, user_id UUID REFERENCES mst_user(id), partner_id UUID REFERENCES mst_partner(id), is_primary BOOLEAN)',
        `INSERT INTO mst_city VALUES ('${ids[0]}', 'Preserved city')`,
        `INSERT INTO mst_transporter VALUES ('${ids[1]}', '${ids[0]}'), ('${ids[2]}', NULL)`,
        `INSERT INTO mst_driver VALUES ('${ids[3]}', '${ids[0]}')`,
        `INSERT INTO awb_driver_request VALUES ('${ids[4]}', '${ids[0]}')`,
        `INSERT INTO mst_user VALUES ('${ids[5]}', 'PARTNER')`,
        `INSERT INTO mst_partner VALUES ('${ids[6]}', 'Primary city', 'ID'), ('${ids[7]}', 'Secondary city', 'MY')`,
        `INSERT INTO mst_user_partner VALUES ('${ids[8]}', '${ids[5]}', '${ids[6]}', TRUE), ('${randomUUID()}', '${ids[5]}', '${ids[7]}', FALSE)`,
      ])
        await tx.$executeRawUnsafe(statement)
      for (const statement of migration
        .split(';')
        .map((value) => value.trim())
        .filter((value) => value && !['BEGIN', 'COMMIT'].includes(value)))
        await tx.$executeRawUnsafe(statement)

      expect(
        await tx.$queryRawUnsafe('SELECT id, city FROM mst_transporter ORDER BY city NULLS LAST'),
      ).toEqual([
        {
          id: ids[1],
          city: 'Preserved city',
        },
        {
          id: ids[2],
          city: null,
        },
      ])

      expect(await tx.$queryRawUnsafe('SELECT city FROM mst_driver')).toEqual([
        { city: 'Preserved city' },
      ])

      expect(await tx.$queryRawUnsafe('SELECT driver_city FROM awb_driver_request')).toEqual([
        { driver_city: 'Preserved city' },
      ])

      expect(await tx.$queryRawUnsafe('SELECT id, city, country FROM mst_user')).toEqual([
        {
          id: ids[5],
          city: 'Primary city',
          country: 'ID',
        },
      ])

      expect(
        await tx.$queryRawUnsafe(
          "SELECT to_regclass('mst_city')::text AS city, to_regclass('mst_partner')::text AS partner, to_regclass('mst_user_partner')::text AS link",
        ),
      ).toEqual([
        {
          city: null,
          partner: null,
          link: null,
        },
      ])

      await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`)
    })
  })
})
