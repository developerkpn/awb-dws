import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requireAdmin, requirePermission } from '../../middlewares/auth'
import service from './role-permission.service'
import {
  roleIdParam,
  updateRolePermissionsSchema,
  permissionListQuery,
  roleListQuery,
} from './role-permission.schema'

const router = Router()
router.use(requireAdmin, requirePermission('admin:roles:read'))
router.get('/permissions', async (req, res) =>
  res.json(success(await service.listPermissions(permissionListQuery.parse(req.query)))),
)
router.get('/roles', async (req, res) =>
  res.json(success(await service.listRolesWithPermissions(roleListQuery.parse(req.query)))),
)
router.get('/roles/:id/permissions', async (req, res) =>
  res.json(success(await service.getRolePermissions(roleIdParam.parse(req.params).id))),
)
router.put('/roles/:id/permissions', requirePermission('admin:roles:update'), async (req, res) => {
  const { permissionCodes } = updateRolePermissionsSchema.parse(req.body)
  res.json(
    success(
      await service.updateRolePermissions(
        roleIdParam.parse(req.params).id,
        permissionCodes,
        currentUser(req).id,
      ),
    ),
  )
})
export default router
