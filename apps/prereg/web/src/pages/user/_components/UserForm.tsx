import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@awb/ui'
import { useUserOptions } from '@/hooks/user'
import { useDebounce } from '@/hooks/useDebounce'
import { getErrorMessage } from '@/utils/errorHandler'
import type { Partner, User, UserFormData } from '@/types/user'
import { userFormSchema } from './schema'

interface UserFormProps {
  user?: User
  isSubmitting: boolean
  error?: string
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
}

const defaultValues: UserFormData = {
  name: '',
  username: '',
  email: '',
  phone: '',
  accountType: 'INTERNAL',
  role: 'LOGISTIC',
  partnerIds: [],
  plantIds: [],
}

export default function UserForm({ user, isSubmitting, error, onSubmit, onCancel }: UserFormProps) {
  const [search, setSearch] = useState('')
  const [selectedPartners, setSelectedPartners] = useState<Partner[]>(user?.partners ?? [])
  const partnerSearch = useDebounce(search)
  const options = useUserOptions(partnerSearch)
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          name: user.name,
          username: user.username,
          email: user.email ?? '',
          phone: user.phone ?? '',
          accountType: user.accountType,
          role: user.role,
          partnerIds: user.partners.map((partner) => partner.id),
          plantIds: user.plantAccess.map((plant) => plant.id),
        }
      : defaultValues,
  })

  const accountType = form.watch('accountType')
  const role = form.watch('role')
  const partners = Array.from(
    new Map(
      [...selectedPartners, ...(options.data?.partners ?? [])].map((partner) => [
        partner.id,
        partner,
      ]),
    ).values(),
  )
  const roles =
    options.data?.roles.filter((item) =>
      accountType === 'PARTNER'
        ? ['CUSTOMER', 'VENDOR', 'INTERCO'].includes(item.code)
        : !['CUSTOMER', 'VENDOR', 'INTERCO'].includes(item.code),
    ) ?? []
  const errors = form.formState.errors

  return (
    <form className="awb-card awb-user-form" onSubmit={form.handleSubmit(onSubmit)}>
      <h1>{user ? 'Edit account' : 'Add account'}</h1>
      {error && (
        <p role="alert" className="awb-error">
          {error}
        </p>
      )}
      {options.error && (
        <p role="alert" className="awb-error">
          {getErrorMessage(options.error)}
        </p>
      )}
      <fieldset disabled={isSubmitting}>
        <label className="awb-field">
          Account type
          <select
            value={accountType}
            disabled={!!user}
            onChange={(event) => {
              const value = event.target.value as UserFormData['accountType']
              form.reset({
                ...defaultValues,
                accountType: value,
                role: value === 'PARTNER' ? 'CUSTOMER' : 'LOGISTIC',
              })
              setSelectedPartners([])
            }}
          >
            <option value="INTERNAL">Internal staff</option>
            <option value="PARTNER">Partner</option>
          </select>
        </label>
        <label className="awb-field">
          Role *
          <select
            value={role}
            onChange={(event) => {
              form.setValue('role', event.target.value, { shouldValidate: true })
              form.setValue('partnerIds', [])
              if (!user && accountType === 'PARTNER') form.setValue('username', '')
              setSelectedPartners([])
            }}
          >
            {roles.map((item) => (
              <option key={item.id} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </label>
        <Input
          label={accountType === 'PARTNER' ? 'Company / partner name' : 'Full name'}
          required
          maxLength={150}
          {...form.register('name')}
          error={errors.name?.message}
        />
        {accountType === 'PARTNER' && (
          <>
            <Input
              label="Search SAP partners"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={100}
            />
            <label className="awb-field">
              SAP partner codes *
              <select
                aria-label="SAP partner codes"
                multiple
                required
                value={form.watch('partnerIds')}
                onChange={(event) => {
                  const ids = Array.from(event.target.selectedOptions).map((option) => option.value)
                  form.setValue('partnerIds', ids, { shouldValidate: true })
                  setSelectedPartners(partners.filter((partner) => ids.includes(partner.id)))
                  if (!user)
                    form.setValue(
                      'username',
                      partners.find((partner) => partner.id === ids[0])?.sapCode ?? '',
                      { shouldValidate: true },
                    )
                }}
              >
                {partners
                  .filter((partner) => partner.partnerType === role)
                  .map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.sapCode} — {partner.name}
                    </option>
                  ))}
              </select>
              <small>
                Search to find more codes. Hold Ctrl or Command to select multiple codes.
              </small>
              {errors.partnerIds && <span role="alert">{errors.partnerIds.message}</span>}
            </label>
          </>
        )}
        <Input
          label={accountType === 'PARTNER' ? 'Username (SAP Code)' : 'Username'}
          required
          maxLength={100}
          readOnly={!!user || accountType === 'PARTNER'}
          {...form.register('username')}
          error={errors.username?.message}
        />
        <Input
          label="Email address"
          type="email"
          maxLength={254}
          {...form.register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone number"
          maxLength={40}
          {...form.register('phone')}
          error={errors.phone?.message}
        />
        {accountType === 'PARTNER' && (
          <label className="awb-field">
            Plant access
            <select aria-label="Plant access" multiple {...form.register('plantIds')}>
              {options.data?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <small>Only selected plants are assigned. No selection grants no plant access.</small>
          </label>
        )}
        <div className="awb-toolbar">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={options.isPending || !!options.error}
          >
            {user ? 'Save changes' : 'Create account'}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
