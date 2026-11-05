import { useState } from 'react'
import { Button } from '@awb/ui'
import type { Permission, RolePermissions } from '@/types/permission'

type PermissionItem = Permission
type RoleMatrixItem = RolePermissions

interface RolePermissionsViewProps {
  roles: RoleMatrixItem[]
  permissions: PermissionItem[]
  onSaveRolePermissions: (roleId: string, codes: string[]) => Promise<void>
}

function RoleRow({
  role,
  permissions,
  onSave,
}: {
  role: RoleMatrixItem
  permissions: PermissionItem[]
  onSave: RolePermissionsViewProps['onSaveRolePermissions']
}) {
  const [draft, setDraft] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const selected = draft ?? role.permissionCodes
  const admin = role.code === 'ADMIN'

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      await onSave(role.id, selected)
      setDraft(null)
      setSaved(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save permissions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <th scope="row">
        {role.name}
        <small>{role.code}</small>
      </th>
      {permissions.map((permission) => (
        <td key={permission.code}>
          <input
            type="checkbox"
            aria-label={`${role.code}: ${permission.name}`}
            checked={admin || selected.includes(permission.code)}
            disabled={admin || saving}
            onChange={() => {
              setSaved(false)
              setDraft(
                selected.includes(permission.code)
                  ? selected.filter((code) => code !== permission.code)
                  : [...selected, permission.code],
              )
            }}
          />
        </td>
      ))}
      <td>
        {admin ? (
          'Full access'
        ) : (
          <Button
            variant="secondary"
            disabled={saving || draft === null}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
        {saved && <span role="status">Saved</span>}
        {error && (
          <p role="alert" className="awb-error">
            {error}
          </p>
        )}
      </td>
    </tr>
  )
}

export function RolePermissionsView({
  roles,
  permissions,
  onSaveRolePermissions,
}: RolePermissionsViewProps) {
  const [filter, setFilter] = useState('')

  return (
    <section className="awb-card">
      <div className="awb-toolbar">
        <div>
          <h1>Role permissions</h1>
          <p>Changes apply to active users on their next request.</p>
        </div>
        <select
          aria-label="Filter roles"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.code}>
              {role.code}
            </option>
          ))}
        </select>
      </div>
      <div className="awb-matrix">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              {permissions.map((permission) => (
                <th key={permission.code}>{permission.name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles
              .filter((role) => !filter || role.code === filter)
              .map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  permissions={permissions}
                  onSave={onSaveRolePermissions}
                />
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
