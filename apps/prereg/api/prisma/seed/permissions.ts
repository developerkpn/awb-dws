import { prisma } from '../../src/config/prisma'
import { permissionCatalogue } from '../../src/modules/role-permission/permissions'

export async function seedPermissions(rolesByCode: Map<string, string>) {
  console.log('🔐 Seeding permissions...')

  const permissionsData = permissionCatalogue.map(([code, name, module]) => ({
    code,
    name,
    module,
  }))

  const permissionsByCode = new Map<string, string>()

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        module: p.module,
      },
      create: {
        code: p.code,
        name: p.name,
        module: p.module,
      },
    })

    permissionsByCode.set(p.code, perm.id)
  }

  // Assign all permissions to ADMIN
  const adminRoleId = rolesByCode.get('ADMIN')!

  for (const permId of permissionsByCode.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRoleId,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId: permId,
      },
    })
  }

  console.log('✅ Permissions and role mappings seeded.')

  for (const code of ['LOGISTIC', 'COMMERCIAL', 'CUSTOMER', 'VENDOR']) {
    const allowed = permissionCatalogue.filter(
      ([permission]) =>
        permission.startsWith('documents:') ||
        (permission.startsWith('prereg:') &&
          (code === 'LOGISTIC' || !['prereg:delete', 'prereg:approve'].includes(permission))),
    )

    await prisma.rolePermission.createMany({
      data: allowed.map(([permission]) => ({
        roleId: rolesByCode.get(code)!,
        permissionId: permissionsByCode.get(permission)!,
      })),
      skipDuplicates: true,
    })
  }
}
