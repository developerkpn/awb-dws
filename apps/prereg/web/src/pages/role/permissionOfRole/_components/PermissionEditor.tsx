import { tableLayout } from '@/ui/loadingLayouts'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Table, useConfirm } from '@awb/ui'
import { usePermissions } from '@/hooks/permission'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { permissionSortFields } from '@awb/contracts'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/ui/Field'
import { PageHeader } from '@/ui/Card'
import ErrorState from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/errorHandler'
import type { Permission } from '@/types/permission'
import type { PermissionEditorProps } from '@/types/permission'

const moduleLabel = (module: string) =>
  ({
    admin: 'Administration',
    prereg: 'Pre-registration',
    documents: 'Documents',
    sync: 'Synchronization',
  })[module] ?? module

export default function PermissionEditor({ role, onSave }: PermissionEditorProps) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const pagination = usePagination()
  const { sortBy, sortDirection, sorting } = useSorting(permissionSortFields, 'module')
  const q = useDebounce(pagination.q)

  const permissions = usePermissions({
    page: pagination.page,
    limit: pagination.limit,
    q,
    sortBy,
    sortDirection,
  })

  const [draft, setDraft] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const admin = role.code === 'ADMIN'
  const selected = draft ?? role.permissionCodes

  const dirty =
    !admin &&
    (selected.length !== role.permissionCodes.length ||
      selected.some((code) => !role.permissionCodes.includes(code)))

  const disabled = admin || !role.isActive || saving

  const toggle = (codes: string[], checked: boolean) => {
    setDraft(
      checked
        ? [...new Set([...selected, ...codes])]
        : selected.filter((code) => !codes.includes(code)),
    )

    setNotice('')
    setError('')
  }

  const save = async () => {
    setSaving(true)
    setError('')

    try {
      await onSave(role.id, selected)
      setDraft(null)
      setNotice('Permissions saved')
    } catch (failure) {
      setError(getErrorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  const leave = async () => {
    if (
      !dirty ||
      (await confirm({
        title: 'Discard permission changes?',
        description: 'Your unsaved permission changes will be lost.',
        confirmLabel: 'Discard changes',
        variant: 'danger',
      }))
    )
      navigate('/roles')
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => void leave()}>
        All roles
      </Button>
      <PageHeader
        title={`${role.name} permissions`}
        subtitle={role.description ?? `Manage access for ${role.code}.`}
        action={
          <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
            {role.code}
          </span>
        }
      />
      {admin && (
        <p className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-xs text-brand-800">
          Administrators always have full access. These permissions cannot be restricted.
        </p>
      )}
      {!role.isActive && (
        <p role="alert" className="text-sm text-brand-700">
          This role is inactive. Its permissions cannot be changed.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Input
            aria-label="Search permissions"
            placeholder="Find a permission or module…"
            value={pagination.q}
            onChange={(event) => pagination.onSearchChange(event.target.value)}
          />
        </div>
        <p className="text-xs text-stone-400">
          {admin ? 'Full access' : `${selected.length} permissions selected across all pages`}
        </p>
      </div>
      {permissions.error ? (
        <ErrorState
          message={getErrorMessage(permissions.error)}
          onRetry={() => void permissions.refetch()}
        />
      ) : (
        <Table<Permission>
          sorting={{
            ...sorting,
            isLoading: permissions.isFetching,
          }}
          aria-label="Role permissions"
          data={permissions.data?.items ?? []}
          keyExtractor={(permission) => permission.code}
          isLoading={permissions.isPending}
          pagination={{
            ...pagination,
            total: permissions.data?.total ?? 0,
            isLoading: permissions.isFetching,
          }}
          groupBy={(permission) => permission.module}
          renderGroupHeader={(module, items) => {
            const count = admin
              ? items.length
              : items.filter((permission) => selected.includes(permission.code)).length

            return (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                  {moduleLabel(module)}
                  <span className="text-xs font-normal text-stone-500">
                    {count} / {items.length} on this page
                  </span>
                </h2>
                <label className="flex items-center gap-2 whitespace-nowrap text-xs text-stone-500">
                  <input
                    type="checkbox"
                    aria-label={`Select page of ${moduleLabel(module)} permissions`}
                    checked={count === items.length}
                    ref={(input) => {
                      if (input) input.indeterminate = count > 0 && count < items.length
                    }}
                    disabled={disabled}
                    onChange={(event) =>
                      toggle(
                        items.map((permission) => permission.code),
                        event.target.checked,
                      )
                    }
                    className="size-4 accent-brand-700"
                  />
                  Select page
                </label>
              </div>
            )
          }}
          columns={tableLayout('permissions', [
            {
              key: 'select',
              header: 'Access',
              width: 70,
              render: (permission) => (
                <input
                  type="checkbox"
                  aria-label={`${role.code}: ${permission.name}`}
                  checked={admin || selected.includes(permission.code)}
                  disabled={disabled}
                  onChange={(event) => toggle([permission.code], event.target.checked)}
                  className="size-4 accent-brand-700"
                />
              ),
            },
            {
              key: 'permission',
              header: 'Permission',
              sortKey: 'name',
              sortHint: 'Sort permissions within each module',
              render: (permission) => (
                <div>
                  <p className="font-medium text-stone-700">{permission.name}</p>
                  <p className="mt-1 break-all text-xs text-stone-500">{permission.code}</p>
                </div>
              ),
            },
            {
              key: 'module',
              header: 'Module',
              sortKey: 'module',
              render: (permission) => (
                <span className="text-xs text-stone-500">{moduleLabel(permission.module)}</span>
              ),
            },
            {
              key: 'action',
              header: 'Action',
              sortKey: 'action',
              sortHint: 'Sort actions within each module',
              render: (permission) => (
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium capitalize text-stone-500">
                  {permission.code.split(':').at(-1)?.replaceAll('-', ' ')}
                </span>
              ),
            },
          ])}
        />
      )}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/95 px-5 py-4 shadow-lg shadow-stone-900/5 backdrop-blur">
        <div>
          {error ? (
            <p role="alert" className="text-xs text-brand-700">
              {error}
            </p>
          ) : notice ? (
            <p role="status" className="text-xs font-medium text-emerald-700">
              {notice}
            </p>
          ) : (
            <p className="text-xs text-stone-500">
              {dirty ? 'You have unsaved changes' : 'All changes saved'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => {
              setDraft(null)
              setError('')
              setNotice('')
            }}
          >
            Discard
          </Button>
          <Button
            size="sm"
            disabled={!dirty || disabled}
            isLoading={saving}
            onClick={() => void save()}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
