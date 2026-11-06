import { z } from 'zod'

const textOperators = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'is_empty',
  'is_not_empty',
] as const
const choiceOperators = ['equals', 'not_equals'] as const
const dateOperators = ['equals', 'before', 'after'] as const

export const accountFilterFields = [
  { key: 'name', label: 'Name', type: 'text', operators: textOperators },
  { key: 'username', label: 'Username', type: 'text', operators: textOperators },
  { key: 'email', label: 'Email', type: 'text', operators: textOperators },
  { key: 'phone', label: 'Phone', type: 'text', operators: textOperators },
  { key: 'accountType', label: 'Account type', type: 'choice', operators: choiceOperators },
  { key: 'role', label: 'Role', type: 'choice', operators: choiceOperators },
  { key: 'isActive', label: 'Status', type: 'choice', operators: choiceOperators },
  { key: 'sapCode', label: 'SAP code', type: 'text', operators: textOperators },
  { key: 'plant', label: 'Plant name', type: 'text', operators: textOperators },
  { key: 'id', label: 'Account ID', type: 'text', operators: choiceOperators },
  { key: 'createdAt', label: 'Created date (UTC)', type: 'date', operators: dateOperators },
  { key: 'updatedAt', label: 'Updated date (UTC)', type: 'date', operators: dateOperators },
] as const

export const accountFilterRule = z
  .object({
    field: z.enum([
      'name',
      'username',
      'email',
      'phone',
      'accountType',
      'role',
      'isActive',
      'sapCode',
      'plant',
      'id',
      'createdAt',
      'updatedAt',
    ]),
    operator: z.enum([...textOperators, 'before', 'after']),
    value: z.string().trim().max(150),
  })
  .superRefine((rule, ctx) => {
    const field = accountFilterFields.find((item) => item.key === rule.field)!
    if (!(field.operators as readonly string[]).includes(rule.operator)) {
      ctx.addIssue({
        code: 'custom',
        path: ['operator'],
        message: 'Operator is not supported for this field',
      })
    }
    if (['is_empty', 'is_not_empty'].includes(rule.operator)) return
    if (!rule.value) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a value' })
    if (field.type === 'date' && !z.iso.date().safeParse(rule.value).success)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a valid date' })
    if (rule.field === 'id' && !z.uuid().safeParse(rule.value).success)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a valid UUID' })
    if (rule.field === 'isActive' && !['true', 'false'].includes(rule.value))
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Choose a status' })
    if (rule.field === 'accountType' && !['INTERNAL', 'PARTNER'].includes(rule.value))
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Choose an account type' })
  })

export const accountFilterSet = z.object({
  match: z.enum(['all', 'any']),
  rules: z.array(accountFilterRule).max(12),
})

export type AccountFilterRule = z.infer<typeof accountFilterRule>
export type AccountFilterSet = z.infer<typeof accountFilterSet>
