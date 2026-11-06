import type { AccountFilterRule, AccountFilterSet } from '@awb/contracts'
import type { Prisma } from '../../generated/prisma/client'

function ruleWhere(rule: AccountFilterRule): Prisma.UserWhereInput {
  const { field, operator, value } = rule
  const negative = ['not_equals', 'not_contains', 'is_empty'].includes(operator)

  if (field === 'createdAt' || field === 'updatedAt') {
    const start = new Date(`${value}T00:00:00.000Z`)
    const end = new Date(start.getTime() + 86_400_000)
    return {
      [field]:
        operator === 'before'
          ? { lt: start }
          : operator === 'after'
            ? { gte: end }
            : { gte: start, lt: end },
    }
  }

  let clause: Prisma.UserWhereInput
  if (field === 'id') clause = { id: value }
  else if (field === 'isActive') clause = { isActive: value === 'true' }
  else {
    const literal = value.replace(/[\\%_]/g, '\\$&')
    const text = {
      mode: 'insensitive' as const,
      ...(['is_empty', 'is_not_empty'].includes(operator)
        ? { not: '' }
        : operator === 'contains' || operator === 'not_contains'
          ? { contains: literal }
          : operator === 'starts_with'
            ? { startsWith: literal }
            : operator === 'ends_with'
              ? { endsWith: literal }
              : { equals: value }),
    }
    switch (field) {
      case 'role':
        clause = { role: { code: text } }
        break
      case 'sapCode':
        clause = { accountType: 'PARTNER', username: text }
        break
      case 'plant':
        clause = { plants: { some: { plant: { name: text } } } }
        break
      default:
        clause = { [field]: text }
    }
  }

  if (field === 'email' || field === 'phone') {
    const nonNull: Prisma.UserWhereInput = { AND: [{ [field]: { not: null } }, clause] }
    return negative ? { OR: [{ [field]: null }, { NOT: clause }] } : nonNull
  }
  return negative ? { NOT: clause } : clause
}

export function accountFiltersWhere(filters?: AccountFilterSet): Prisma.UserWhereInput {
  if (!filters?.rules.length) return {}
  return { [filters.match === 'any' ? 'OR' : 'AND']: filters.rules.map(ruleWhere) }
}
