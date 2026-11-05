import type { ReactNode } from 'react'
import { Button, Input, Table, type TableColumn } from '@awb/ui'

export type AccountType = 'PARTNER' | 'INTERNAL'
export type UserRole =
  | 'CUSTOMER'
  | 'VENDOR'
  | 'ADMIN'
  | 'MANAGER'
  | 'LOGISTIC'
  | 'COMMERCIAL'
  | 'KRANIWB'

export interface UserAccount {
  id: string
  name: string
  username: string
  email: string
  phone?: string
  accountType: AccountType
  role: UserRole
  sapCode?: string
  plant?: string
  isActive: boolean
  createdAt: string
}

export interface UserFormData {
  id?: string
  name: string
  username: string
  email: string
  phone: string
  accountType: AccountType
  role: UserRole
  sapCode: string
  plant: string
}

export interface UserManagementViewProps {
  users: UserAccount[]
  searchQuery: string
  typeFilter: string
  roleFilter: string
  plantFilter: string
  onSearchChange: (val: string) => void
  onTypeFilterChange: (val: string) => void
  onRoleFilterChange: (val: string) => void
  onPlantFilterChange: (val: string) => void
  onOpenAddModal: () => void
  onOpenEditModal: (user: UserAccount) => void
  onToggleStatus: (userId: string) => void
  onResetPassword: (userId: string) => void
  // Modal props
  isModalOpen: boolean
  modalMode: 'ADD' | 'EDIT'
  formData: UserFormData
  formErrors: Record<string, string>
  isSubmitting: boolean
  onFormChange: (field: keyof UserFormData, val: any) => void
  onSaveUser: (e: React.FormEvent) => void
  onCloseModal: () => void
  // Feedback alert
  feedbackMessage?: string
  onDismissFeedback?: () => void
}

export function UserManagementView({
  users,
  searchQuery,
  typeFilter,
  roleFilter,
  plantFilter,
  onSearchChange,
  onTypeFilterChange,
  onRoleFilterChange,
  onPlantFilterChange,
  onOpenAddModal,
  onOpenEditModal,
  onToggleStatus,
  onResetPassword,
  isModalOpen,
  modalMode,
  formData,
  formErrors,
  isSubmitting,
  onFormChange,
  onSaveUser,
  onCloseModal,
  feedbackMessage,
  onDismissFeedback,
}: UserManagementViewProps) {
  // Stat calculations
  const totalCount = users.length
  const activeCount = users.filter((u) => u.isActive).length
  const partnerCount = users.filter((u) => u.accountType === 'PARTNER').length
  const internalCount = users.filter((u) => u.accountType === 'INTERNAL').length

  const columns: TableColumn<UserAccount>[] = [
    {
      key: 'name',
      header: 'User & Organization',
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            {u.email} &bull; <span style={{ color: '#94a3b8' }}>@{u.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'accountType',
      header: 'Type',
      render: (u) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            backgroundColor: u.accountType === 'PARTNER' ? '#f0fdf4' : '#eff6ff',
            color: u.accountType === 'PARTNER' ? '#166534' : '#1e40af',
          }}
        >
          {u.accountType}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
            letterSpacing: '0.02em',
          }}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'plantAccess',
      header: 'Plant Access',
      render: (u) => (
        <span
          style={{
            fontSize: '13px',
            color: u.accountType === 'PARTNER' ? '#334155' : '#94a3b8',
            fontWeight: u.accountType === 'PARTNER' ? 500 : 400,
          }}
        >
          {u.accountType === 'PARTNER' ? (u.plant || 'All Plants') : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: u.isActive ? '#15803d' : '#94a3b8',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: u.isActive ? '#22c55e' : '#cbd5e1',
            }}
          />
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onOpenEditModal(u)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onResetPassword(u.id)}
            title="Reset password and email new credentials"
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#991b1b',
            }}
          >
            Reset Pwd
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(u.id)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: u.isActive ? '#fff1f2' : '#f0fdf4',
              border: `1px solid ${u.isActive ? '#fecdd3' : '#bbf7d0'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: u.isActive ? '#be123c' : '#15803d',
            }}
          >
            {u.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6px 0 24px' }}>
      {/* Top Banner & Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            User &amp; Partner Management
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748b' }}>
            Manage customer, vendor, and internal team accounts across all KPN plant locations.
          </p>
        </div>

        <Button type="button" variant="primary" onClick={onOpenAddModal}>
          + Add New User
        </Button>
      </div>

      {feedbackMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            color: '#15803d',
            fontSize: '13.5px',
            fontWeight: 500,
            marginBottom: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <span>{feedbackMessage}</span>
          {onDismissFeedback && (
            <button
              type="button"
              onClick={onDismissFeedback}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: '6px',
                marginLeft: '14px',
                opacity: 0.75,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
              title="Dismiss notification"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Total Accounts</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {totalCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Active Users</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            {activeCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Partners (Mitra)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {partnerCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Internal Staff</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {internalCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 280px', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by name, email, or SAP code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 14px',
              fontSize: '13.5px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Account Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="PARTNER">Partner (Mitra)</option>
            <option value="INTERNAL">Internal Staff</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="VENDOR">VENDOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="LOGISTIC">LOGISTIC</option>
            <option value="MANAGER">MANAGER</option>
            <option value="COMMERCIAL">COMMERCIAL</option>
            <option value="KRANIWB">KRANIWB</option>
          </select>

          {/* Plant Filter */}
          <select
            value={plantFilter}
            onChange={(e) => onPlantFilterChange(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Plants</option>
            <option value="Priscolin Karawang">Priscolin Karawang</option>
            <option value="Dumai Plant">Dumai Plant</option>
            <option value="Medan Plant">Medan Plant</option>
            <option value="Jakarta HO">Jakarta HO</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={users}
        keyExtractor={(item) => item.id}
        emptyMessage="No accounts match your search or filter criteria."
      />

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '28px 32px',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                {modalMode === 'ADD' ? 'Create New Account' : 'Edit Account Details'}
              </h2>
              <button
                type="button"
                onClick={onCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={onSaveUser}>
              {/* Type Switcher (Only in Add mode) */}
              {modalMode === 'ADD' && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Account Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onFormChange('accountType', 'PARTNER')
                        onFormChange('role', 'CUSTOMER')
                        onFormChange('plant', 'Priscolin Karawang')
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1.5px solid ${formData.accountType === 'PARTNER' ? '#8b2424' : '#cbd5e1'}`,
                        backgroundColor: formData.accountType === 'PARTNER' ? '#fef2f2' : '#ffffff',
                        color: formData.accountType === 'PARTNER' ? '#8b2424' : '#475569',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Partner (Customer / Vendor)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFormChange('accountType', 'INTERNAL')
                        onFormChange('role', 'LOGISTIC')
                        onFormChange('plant', '')
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1.5px solid ${formData.accountType === 'INTERNAL' ? '#8b2424' : '#cbd5e1'}`,
                        backgroundColor: formData.accountType === 'INTERNAL' ? '#fef2f2' : '#ffffff',
                        color: formData.accountType === 'INTERNAL' ? '#8b2424' : '#475569',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Internal Staff
                    </button>
                  </div>
                </div>
              )}

              {/* Role Dropdown */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Role <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: '3px' }}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => onFormChange('role', e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '9px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {formData.accountType === 'PARTNER' ? (
                    <>
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="VENDOR">VENDOR</option>
                    </>
                  ) : (
                    <>
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="LOGISTIC">LOGISTIC</option>
                      <option value="COMMERCIAL">COMMERCIAL</option>
                      <option value="KRANIWB">KRANIWB</option>
                    </>
                  )}
                </select>
              </div>

              {/* Plant Access (for Partner / Mitra) */}
              {formData.accountType === 'PARTNER' && (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Plant Access <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: '3px' }}>*</span>
                  </label>
                  <select
                    value={formData.plant}
                    onChange={(e) => onFormChange('plant', e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '9px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="All Plants">All Plants</option>
                    <option value="Priscolin Karawang">Priscolin Karawang</option>
                    <option value="Dumai Plant">Dumai Plant</option>
                    <option value="Medan Plant">Medan Plant</option>
                  </select>
                </div>
              )}

              <Input
                label={formData.accountType === 'PARTNER' ? 'Company / Partner Name' : 'Full Name'}
                type="text"
                value={formData.name}
                error={formErrors.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label={formData.accountType === 'PARTNER' ? 'Username (SAP Code)' : 'Username'}
                  type="text"
                  value={formData.username}
                  error={formErrors.username}
                  onChange={(e) => {
                    const val = e.target.value
                    onFormChange('username', val)
                    if (formData.accountType === 'PARTNER') {
                      onFormChange('sapCode', val)
                    }
                  }}
                  placeholder={
                    formData.accountType === 'PARTNER'
                      ? formData.role === 'CUSTOMER'
                        ? 'e.g. KUNNR-10042'
                        : 'e.g. LIFNR-20085'
                      : 'e.g. jdoe'
                  }
                  disabled={modalMode === 'EDIT'}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                error={formErrors.email}
                onChange={(e) => onFormChange('email', e.target.value)}
              />

              {modalMode === 'ADD' && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    color: '#475569',
                    marginBottom: '20px',
                    lineHeight: 1.45,
                  }}
                >
                  &bull; A strong, random password will be generated automatically by the system and emailed to the user upon creation.
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={onCloseModal}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    borderRadius: '9px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {modalMode === 'ADD' ? 'Create Account' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
