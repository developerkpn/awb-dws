import { permissionCatalogue } from '@awb/contracts'

export { permissionCatalogue }
export const permissionCodes: ReadonlySet<string> = new Set(
  permissionCatalogue.map((permission) => permission[0]),
)
