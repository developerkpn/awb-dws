import { useState, type FC } from 'react'
import { Button, Table, type TableColumn } from '@awb/ui'

export interface PermissionItem {
  code: string
  name: string
  module: string
  description?: string
}

export interface RoleMatrixItem {
  id: string
  code: string
  name: string
  permissions: string[] // array of permission codes
}

export interface RolePermissionsViewProps {
  roles: RoleMatrixItem[]
  permissions: PermissionItem[]
  onSaveRolePermissions: (roleId: string, permissionCodes: string[]) => Promise<void> | void
  isLoading?: boolean
}

export const RolePermissionsView: FC<RolePermissionsViewProps> = ({
  roles,
  permissions,
  onSaveRolePermissions,
  isLoading = false,
}) => {
  // Track modified permission matrix locally before saving
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {}
    for (const r of roles) {
      init[r.id] = new Set(r.permissions)
    }
    return init
  })

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL')

  const togglePermission = (roleId: string, permCode: string, isReadOnlyAdmin: boolean) => {
    if (isReadOnlyAdmin) return // Admin always has full access

    setMatrix((prev) => {
      const currentSet = new Set(prev[roleId] || [])
      if (currentSet.has(permCode)) {
        currentSet.delete(permCode)
      } else {
        currentSet.add(permCode)
      }
      return {
        ...prev,
        [roleId]: currentSet,
      }
    })
    setSuccessMessage(null)
  }

  const handleSave = async (role: RoleMatrixItem) => {
    try {
      setSavingRoleId(role.id)
      const currentCodes = Array.from(matrix[role.id] || [])
      await onSaveRolePermissions(role.id, currentCodes)
      setSuccessMessage(`Permissions for role '${role.name}' updated successfully!`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } finally {
      setSavingRoleId(null)
    }
  }

  const filteredRoles = selectedRoleFilter === 'ALL'
    ? roles
    : roles.filter((r) => r.code === selectedRoleFilter)

  const columns: TableColumn<RoleMatrixItem>[] = [
    {
      key: 'role',
      header: 'Role & Description',
      width: '200px',
      render: (role) => {
        const isAdmin = role.code === 'ADMIN'
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{role.name}</div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: isAdmin ? '#fef2f2' : '#f1f5f9',
                color: isAdmin ? '#991b1b' : '#475569',
              }}
            >
              {role.code}
            </span>
          </div>
        )
      },
    },
    ...permissions.map((perm): TableColumn<RoleMatrixItem> => ({
      key: perm.code,
      align: 'center',
      header: (
        <div style={{ textAlign: 'center' }}>
          <div>{perm.name}</div>
          <code style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
            {perm.code}
          </code>
        </div>
      ),
      render: (role) => {
        const isAdmin = role.code === 'ADMIN'
        const rolePerms = matrix[role.id] || new Set()
        const isChecked = isAdmin || rolePerms.has(perm.code)

        return (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isAdmin ? 'not-allowed' : 'pointer',
              width: '24px',
              height: '24px',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isAdmin}
              onChange={() => togglePermission(role.id, perm.code, isAdmin)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#8b2424',
                cursor: isAdmin ? 'not-allowed' : 'pointer',
              }}
            />
          </label>
        )
      },
    })),
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '130px',
      render: (role) => {
        const isAdmin = role.code === 'ADMIN'
        const isSaving = savingRoleId === role.id

        if (isAdmin) {
          return (
            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
              Full Access
            </span>
          )
        }

        return (
          <Button
            variant="secondary"
            style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
            onClick={() => handleSave(role)}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filter Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Role &amp; Menu Permissions (Permission Matrix)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Configure menu visibility and operational authorization per role according to KPN security policies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Filter Role:
          </label>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '13.5px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Roles ({roles.length})</option>
            {roles.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Permissions Matrix Table via @awb/ui Table */}
      <Table<RoleMatrixItem>
        columns={columns}
        data={filteredRoles}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
      />
    </div>
  )
}
