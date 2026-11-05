export const PERMISSION = {
  USER: {
    READ: 'admin:users:read',
    CREATE: 'admin:users:create',
    UPDATE: 'admin:users:update',
    RESET_PASSWORD: 'admin:users:reset-password',
  },
  ROLE: {
    READ: 'admin:roles:read',
    UPDATE: 'admin:roles:update',
  },
  PREREG: {
    READ: 'prereg:read',
    CREATE: 'prereg:create',
    UPDATE: 'prereg:update',
    DELETE: 'prereg:delete',
    APPROVE: 'prereg:approve',
  },
  DOCUMENT: {
    READ: 'documents:read',
    CREATE: 'documents:create',
  },
} as const

export const permissionCatalogue = [
  [PERMISSION.USER.READ, 'View accounts', 'admin'],
  [PERMISSION.USER.CREATE, 'Create accounts', 'admin'],
  [PERMISSION.USER.UPDATE, 'Update or deactivate accounts', 'admin'],
  [PERMISSION.USER.RESET_PASSWORD, 'Reset account passwords', 'admin'],
  [PERMISSION.ROLE.READ, 'View role permissions', 'admin'],
  [PERMISSION.ROLE.UPDATE, 'Update role permissions', 'admin'],
  [PERMISSION.PREREG.READ, 'View pre-registrations', 'prereg'],
  [PERMISSION.PREREG.CREATE, 'Create pre-registrations', 'prereg'],
  [PERMISSION.PREREG.UPDATE, 'Update pre-registrations', 'prereg'],
  [PERMISSION.PREREG.DELETE, 'Delete pre-registrations', 'prereg'],
  [PERMISSION.PREREG.APPROVE, 'Approve pre-registrations', 'prereg'],
  [PERMISSION.DOCUMENT.READ, 'Read permitted documents', 'documents'],
  [PERMISSION.DOCUMENT.CREATE, 'Upload documents', 'documents'],
] as const
