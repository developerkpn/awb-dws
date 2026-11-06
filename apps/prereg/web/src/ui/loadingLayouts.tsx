import { SkeletonCell, type TableColumn } from '@awb/ui'

export const tableLoadingColumns: Record<
  'accounts' | 'roles' | 'permissions' | 'requests',
  TableColumn<never>[]
> = {
  requests: [
    { key: 'driver', header: 'Driver', skeleton: <SkeletonCell lines={2} width="75%" /> },
    { key: 'vehicle', header: 'Vehicle', skeleton: <SkeletonCell width="7rem" /> },
    { key: 'createdAt', header: 'Submitted Date', skeleton: <SkeletonCell width="6rem" /> },
    { key: 'status', header: 'Status', skeleton: <SkeletonCell kind="badge" width="6rem" /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={1} />,
    },
  ].map((column) => ({ ...column, render: () => null })) as TableColumn<never>[],
  accounts: [
    { key: 'name', header: 'User', skeleton: <SkeletonCell lines={2} width="9rem" /> },
    { key: 'role', header: 'Role', skeleton: <SkeletonCell lines={2} width="7rem" /> },
    { key: 'contact', header: 'Contact', skeleton: <SkeletonCell lines={2} width="9rem" /> },
    { key: 'plants', header: 'Plant access', skeleton: <SkeletonCell lines={2} width="8rem" /> },
    { key: 'status', header: 'Status', skeleton: <SkeletonCell width="3rem" /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" />,
    },
  ].map((column) => ({ ...column, render: () => null })) as TableColumn<never>[],
  roles: [
    { key: 'role', header: 'Role', skeleton: <SkeletonCell lines={2} width="9rem" /> },
    { key: 'description', header: 'Description', skeleton: <SkeletonCell lines={2} width="80%" /> },
    { key: 'permissions', header: 'Access', skeleton: <SkeletonCell width="6rem" /> },
    { key: 'status', header: 'Status', skeleton: <SkeletonCell width="3rem" /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={1} />,
    },
  ].map((column) => ({ ...column, render: () => null })) as TableColumn<never>[],
  permissions: [
    { key: 'select', header: 'Access', width: 70, skeleton: <SkeletonCell kind="checkbox" /> },
    { key: 'permission', header: 'Permission', skeleton: <SkeletonCell lines={2} width="75%" /> },
    { key: 'module', header: 'Module', skeleton: <SkeletonCell width="6rem" /> },
    { key: 'action', header: 'Action', skeleton: <SkeletonCell kind="badge" /> },
  ].map((column) => ({ ...column, render: () => null })),
}

export const loadingCell = (view: keyof typeof tableLoadingColumns, key: string) =>
  tableLoadingColumns[view].find((column) => column.key === key)?.skeleton

const widths: Record<keyof typeof tableLoadingColumns, Record<string, string>> = {
  requests: { driver: '30%', vehicle: '20%', createdAt: '20%', status: '18%', actions: '12%' },
  accounts: {
    name: '23%',
    role: '16%',
    contact: '19%',
    plants: '17%',
    status: '10%',
    actions: '15%',
  },
  roles: { role: '22%', description: '35%', permissions: '18%', status: '13%', actions: '12%' },
  permissions: { select: '9%', permission: '51%', module: '22%', action: '18%' },
}
export function tableLayout<T>(
  view: keyof typeof tableLoadingColumns,
  columns: TableColumn<T>[],
): TableColumn<T>[] {
  return columns.map((column) => ({
    ...column,
    width: widths[view][column.key] ?? column.width,
    skeleton: loadingCell(view, column.key),
  }))
}
export const loadingColumnsFor = (view: keyof typeof tableLoadingColumns) =>
  tableLayout(view, tableLoadingColumns[view])
