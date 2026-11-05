import { useState, type FC } from 'react'
import {
  RolePermissionsView,
  type PermissionItem,
  type RoleMatrixItem,
} from '../../components/admin/RolePermissionsView'

const DEFAULT_PERMISSIONS: PermissionItem[] = [
  { code: 'prereg:view', name: 'View Pre-Reg', module: 'prereg', description: 'View pre-registration queue' },
  { code: 'prereg:create', name: 'Create Pre-Reg', module: 'prereg', description: 'Create new pre-registration ticket' },
  { code: 'prereg:approval', name: 'Approval Pre-Reg', module: 'prereg', description: 'Approve partner truck registration' },
  { code: 'weighbridge:view', name: 'Weighbridge WB', module: 'weighbridge', description: 'View weighbridge status' },
  { code: 'reports:view', name: 'Reports', module: 'reports', description: 'View operational analytics and reports' },
  { code: 'admin:users', name: 'User Management', module: 'admin', description: 'Manage internal and partner user accounts' },
  { code: 'admin:roles', name: 'Role Matrix', module: 'admin', description: 'Configure role permissions and menu access' },
]

const INITIAL_ROLES: RoleMatrixItem[] = [
  {
    id: 'role-admin',
    code: 'ADMIN',
    name: 'Head Office Admin',
    permissions: ['prereg:view', 'prereg:create', 'prereg:approval', 'weighbridge:view', 'reports:view', 'admin:users', 'admin:roles'],
  },
  {
    id: 'role-manager',
    code: 'MANAGER',
    name: 'Plant Manager',
    permissions: ['prereg:view', 'prereg:approval', 'weighbridge:view', 'reports:view'],
  },
  {
    id: 'role-logistic',
    code: 'LOGISTIC',
    name: 'Logistics HO',
    permissions: ['prereg:view', 'prereg:create', 'prereg:approval', 'reports:view'],
  },
  {
    id: 'role-commercial',
    code: 'COMMERCIAL',
    name: 'Commercial & Sales',
    permissions: ['prereg:view', 'reports:view'],
  },
  {
    id: 'role-kraniwb',
    code: 'KRANIWB',
    name: 'Krani Weighbridge',
    permissions: ['weighbridge:view'],
  },
  {
    id: 'role-customer',
    code: 'CUSTOMER',
    name: 'Customer Partner',
    permissions: ['prereg:view', 'prereg:create'],
  },
  {
    id: 'role-vendor',
    code: 'VENDOR',
    name: 'Vendor Partner',
    permissions: ['prereg:view', 'prereg:create'],
  },
]

export interface RolePermissionsPageProps {
  onPermissionsChange?: (updatedRoles: RoleMatrixItem[]) => void
}

export const RolePermissionsPage: FC<RolePermissionsPageProps> = ({ onPermissionsChange }) => {
  const [roles, setRoles] = useState<RoleMatrixItem[]>(INITIAL_ROLES)
  const [permissions] = useState<PermissionItem[]>(DEFAULT_PERMISSIONS)

  const handleSaveRolePermissions = async (roleId: string, permissionCodes: string[]) => {
    // In dev / standalone, update local state
    setRoles((prev) => {
      const next = prev.map((r) => (r.id === roleId ? { ...r, permissions: permissionCodes } : r))
      if (onPermissionsChange) {
        onPermissionsChange(next)
      }
      return next
    })
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <RolePermissionsView
        roles={roles}
        permissions={permissions}
        onSaveRolePermissions={handleSaveRolePermissions}
      />
    </div>
  )
}

export default RolePermissionsPage
