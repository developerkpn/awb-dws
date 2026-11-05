import { Router, type Request, type Response, type NextFunction } from 'express'
import { CustomError, success } from '@awb/server-core'
import service from './role-permission.service'
import {
  checkAccessQuerySchema,
  roleIdParam,
  updateRolePermissionsSchema,
} from './role-permission.schema'

/**
 * Middleware: Verify that user's role has the requested permission
 * Checklist 2: API menolak akses yang tidak diizinkan (HTTP 403)
 */
export function requirePermission(permissionCode: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const role = (req.headers['x-user-role'] as string) || (req as any).user?.role
      if (!role) {
        throw new CustomError('Access denied: Role identifier required', 401)
      }

      const hasAccess = await service.checkRoleAccess(role, permissionCode)
      if (!hasAccess) {
        throw new CustomError(
          `Access denied: Role '${role}' lacks required permission '${permissionCode}'`,
          403
        )
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'] || (req as any).user?.role
  if (role !== 'ADMIN') {
    throw new CustomError('Access denied: ADMIN role required', 403)
  }
  next()
}

const router = Router()

// Public / Authenticated: Get all available permissions in the system
router.get('/permissions', async (_req, res, next) => {
  try {
    const permissions = await service.listPermissions()
    res.json(success(permissions))
  } catch (err) {
    next(err)
  }
})

// ADMIN Only: Get all roles with their assigned permissions (Permission Matrix)
router.get('/roles', requireAdminRole, async (_req, res, next) => {
  try {
    const matrix = await service.listRolesWithPermissions()
    res.json(success(matrix))
  } catch (err) {
    next(err)
  }
})

// ADMIN Only: Get permissions for a specific role
router.get('/roles/:id/permissions', requireAdminRole, async (req, res, next) => {
  try {
    const { id } = roleIdParam.parse(req.params)
    const rolePermissions = await service.getRolePermissions(id)
    res.json(success(rolePermissions))
  } catch (err) {
    next(err)
  }
})

// ADMIN Only: Update permissions for a role (Acceptance Checklist 3: Admin bisa mengatur hak akses per peran)
router.put('/roles/:id/permissions', requireAdminRole, async (req, res, next) => {
  try {
    const { id } = roleIdParam.parse(req.params)
    const { permissionCodes } = updateRolePermissionsSchema.parse(req.body)
    const updated = await service.updateRolePermissions(id, permissionCodes)
    res.json(success(updated))
  } catch (err) {
    next(err)
  }
})

// Check permission helper for frontend/gateways
router.get('/check-access', async (req, res, next) => {
  try {
    const { role, permission } = checkAccessQuerySchema.parse(req.query)
    const hasAccess = await service.checkRoleAccess(role, permission)
    res.json(success({ role, permission, hasAccess }))
  } catch (err) {
    next(err)
  }
})

// Example protected endpoint to test RBAC enforcement
router.get(
  '/protected/reports',
  requirePermission('reports:view'),
  (_req, res) => {
    res.json(success({ message: 'Welcome to operational reports data' }))
  }
)

router.get(
  '/protected/prereg-create',
  requirePermission('prereg:create'),
  (_req, res) => {
    res.json(success({ message: 'Ticket creation authorized' }))
  }
)

export default router
