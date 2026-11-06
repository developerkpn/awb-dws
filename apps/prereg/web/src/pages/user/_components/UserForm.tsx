import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Field,
  Input,
  Select,
  FormError,
  FormSection,
  PageHeader,
  PageSkeleton,
  useConfirm,
} from '@awb/ui'
import { ArrowLeft, Users, ShieldCheck, Save } from '@/ui/icons'
import { useUserOptions } from '@/hooks/user'
import { getErrorMessage } from '@/utils/errorHandler'
import type { User, UserFormData } from '@/types/user'
import { userFormSchema } from './schema'
import './account-form.css'

interface UserFormProps {
  user?: User
  isSubmitting: boolean
  error?: string
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
}
const defaults: UserFormData = {
  name: '',
  username: '',
  email: '',
  phone: '',
  accountType: 'INTERNAL',
  role: 'LOGISTIC',
  plantIds: [],
}

export default function UserForm({ user, isSubmitting, error, onSubmit, onCancel }: UserFormProps) {
  const confirm = useConfirm()
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
          plantIds: user.plantAccess.map((item) => item.id),
        }
      : defaults,
  })
  const values = form.watch()
  const errors = form.formState.errors
  const partnerAccount = values.accountType === 'PARTNER'
  const options = useUserOptions()
  const roles =
    options.data?.roles.filter(
      (role) => partnerAccount === ['CUSTOMER', 'VENDOR'].includes(role.code),
    ) ?? []
  const flags = { shouldDirty: true }

  const cancel = async () => {
    if (
      !form.formState.isDirty ||
      (await confirm({
        title: 'Discard account changes?',
        description: 'Your unsaved account details will be lost.',
        confirmLabel: 'Discard changes',
        variant: 'danger',
      }))
    )
      onCancel()
  }
  const changeType = (type: UserFormData['accountType']) => {
    form.setValue('accountType', type, flags)
    form.setValue('role', type === 'PARTNER' ? 'CUSTOMER' : 'LOGISTIC', flags)
    form.setValue('plantIds', [], flags)
    form.resetField('username', { defaultValue: '' })
    form.clearErrors(['accountType', 'role', 'plantIds'])
  }

  if (options.isPending)
    return (
      <PageSkeleton message="Loading account options…" view="form" back partner={partnerAccount} />
    )

  return (
    <div className="account-workspace">
      <Button
        size="sm"
        variant="ghost"
        icon={<ArrowLeft />}
        disabled={isSubmitting}
        onClick={() => void cancel()}
      >
        Back to accounts
      </Button>
      <PageHeader
        title={user ? 'Edit account' : 'Create a new account'}
        subtitle={
          user
            ? `Update the profile and access for ${user.username}.`
            : 'Set up a profile, choose a role, and assign the access they need.'
        }
      />
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FormError message={error} />
        {options.error && (
          <div className="account-options-error">
            <FormError message={getErrorMessage(options.error)} />
            <Button variant="secondary" size="sm" onClick={() => void options.refetch()}>
              Retry options
            </Button>
          </div>
        )}
        <div className="account-layout">
          <fieldset disabled={isSubmitting} className="account-sections">
            <FormSection
              step="01"
              title="Account identity"
              description="Who is this account for? Their account type determines the available roles."
            >
              <div className="account-type-options" role="radiogroup" aria-label="Account type">
                {(['INTERNAL', 'PARTNER'] as const).map((type) => (
                  <label
                    key={type}
                    className="account-type-card"
                    data-selected={values.accountType === type}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={type}
                      checked={values.accountType === type}
                      disabled={!!user}
                      onChange={() => changeType(type)}
                    />
                    <Users />
                    <span>
                      <strong>{type === 'INTERNAL' ? 'Internal staff' : 'Business partner'}</strong>
                      <small>
                        {type === 'INTERNAL'
                          ? 'Your operations and support teams'
                          : 'Customers, vendors and intercompany'}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              {user && (
                <p className="account-note">
                  Account type and username are permanent. You can update the profile and access
                  below.
                </p>
              )}
              <div className="account-fields">
                <Field
                  label={partnerAccount ? 'Company / partner name' : 'Full name'}
                  htmlFor="account-name"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    id="account-name"
                    autoComplete="name"
                    placeholder={partnerAccount ? 'Company name' : 'Enter their full name'}
                    maxLength={150}
                    {...form.register('name')}
                  />
                </Field>
                <Field label="Role" htmlFor="account-role" required error={errors.role?.message}>
                  <Select
                    id="account-role"
                    value={values.role}
                    onChange={(event) => {
                      form.setValue('role', event.target.value, {
                        ...flags,
                        shouldValidate: form.formState.isSubmitted,
                      })
                      if (!user && partnerAccount) form.resetField('username', { defaultValue: '' })
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="account-full-width">
                  <Field
                    label={partnerAccount ? 'Username (SAP Code)' : 'Username'}
                    htmlFor="account-username"
                    required
                    error={errors.username?.message}
                    hint={
                      partnerAccount
                        ? 'Use the business partner’s SAP code as their username.'
                        : 'Letters, numbers, dots, underscores, @ and hyphens are supported.'
                    }
                  >
                    <Input
                      id="account-username"
                      autoComplete="off"
                      placeholder={partnerAccount ? 'Enter the SAP code' : 'e.g. operations.team'}
                      maxLength={100}
                      readOnly={!!user}
                      {...form.register('username')}
                    />
                  </Field>
                </div>
              </div>
            </FormSection>
            <FormSection
              step="02"
              title="Contact details"
              description="Optional contact information for this person or business."
            >
              <div className="account-fields">
                <Field label="Email address" htmlFor="account-email" error={errors.email?.message}>
                  <Input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    maxLength={254}
                    {...form.register('email')}
                  />
                </Field>
                <Field label="Phone number" htmlFor="account-phone" error={errors.phone?.message}>
                  <Input
                    id="account-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+62"
                    maxLength={40}
                    {...form.register('phone')}
                  />
                </Field>
              </div>
            </FormSection>
            {partnerAccount && (
              <FormSection
                step="03"
                title="Plant access"
                description="Select the plants this business partner can access. No selection grants no plant access."
              >
                <div className="account-plant-options">
                  {options.data?.plants.map((plant) => (
                    <label key={plant.id} className="account-choice">
                      <input type="checkbox" value={plant.id} {...form.register('plantIds')} />
                      <span>
                        <strong>{plant.name}</strong>
                        <small>{plant.code}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </FormSection>
            )}
          </fieldset>
          <aside className="account-summary" aria-label="Account summary">
            <div className="account-summary-icon">
              <ShieldCheck />
            </div>
            <span className="account-eyebrow">Account preview</span>
            <h2>{values.name || 'Your new account'}</h2>
            <p>{values.username || 'Username not set'}</p>
            <dl>
              <div>
                <dt>Account type</dt>
                <dd>{partnerAccount ? 'Business partner' : 'Internal staff'}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{roles.find((role) => role.code === values.role)?.name ?? values.role}</dd>
              </div>
              {partnerAccount && (
                <div>
                  <dt>Plant access</dt>
                  <dd>{values.plantIds.length} selected</dd>
                </div>
              )}
            </dl>
            <div className="account-summary-note">
              {user
                ? 'Saving access changes ends this account’s existing sessions.'
                : 'Sign-in credentials are generated when the account is created.'}
            </div>
          </aside>
        </div>
        <div className="account-save-bar">
          <p>
            {form.formState.isDirty
              ? 'You have unsaved changes'
              : user
                ? 'Account details are up to date'
                : 'Complete the required fields to create this account'}
          </p>
          <div>
            <Button variant="secondary" disabled={isSubmitting} onClick={() => void cancel()}>
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Save />}
              isLoading={isSubmitting}
              disabled={options.isPending || !!options.error}
            >
              {user ? 'Save changes' : 'Create account'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
