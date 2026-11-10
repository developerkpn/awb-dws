import { SkeletonCell, type TableColumn } from '@awb/ui'

export const tableLoadingColumns: Record<
  'accounts' | 'roles' | 'permissions' | 'requests' | 'vehicles' | 'jul',
  TableColumn<never>[]
> = {
  jul: [
    {
      key: 'number',
      header: 'Registration',
      skeleton: <SkeletonCell lines={2} width="80%" />,
    },
    {
      key: 'customer',
      header: 'Customer / vendor',
      skeleton: <SkeletonCell lines={2} width="75%" />,
    },
    {
      key: 'status',
      header: 'Status',
      skeleton: <SkeletonCell lines={2} width="70%" />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={1} />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })) as TableColumn<never>[],
  requests: [
    {
      key: 'driver',
      header: 'Driver',
      skeleton: <SkeletonCell lines={2} width="75%" />,
    },
    {
      key: 'plant',
      header: 'Plant',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'status',
      header: 'Status',
      skeleton: <SkeletonCell kind="badge" width="6rem" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={2} />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })) as TableColumn<never>[],
  vehicles: [
    {
      key: 'vehicle',
      header: 'Vehicle',
      skeleton: <SkeletonCell width="7rem" />,
    },
    {
      key: 'plant',
      header: 'Plant',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'status',
      header: 'Status',
      skeleton: <SkeletonCell kind="badge" width="6rem" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={2} />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })) as TableColumn<never>[],
  accounts: [
    {
      key: 'name',
      header: 'User',
      skeleton: <SkeletonCell lines={2} width="9rem" />,
    },
    {
      key: 'role',
      header: 'Role',
      skeleton: <SkeletonCell lines={2} width="7rem" />,
    },
    {
      key: 'contact',
      header: 'Contact',
      skeleton: <SkeletonCell lines={2} width="9rem" />,
    },
    {
      key: 'plants',
      header: 'Plant access',
      skeleton: <SkeletonCell lines={2} width="8rem" />,
    },
    {
      key: 'status',
      header: 'Status',
      skeleton: <SkeletonCell width="3rem" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })) as TableColumn<never>[],
  roles: [
    {
      key: 'role',
      header: 'Role',
      skeleton: <SkeletonCell lines={2} width="9rem" />,
    },
    {
      key: 'description',
      header: 'Description',
      skeleton: <SkeletonCell lines={2} width="80%" />,
    },
    {
      key: 'permissions',
      header: 'Access',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'status',
      header: 'Status',
      skeleton: <SkeletonCell width="3rem" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={1} />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })) as TableColumn<never>[],
  permissions: [
    {
      key: 'select',
      header: 'Access',
      width: 70,
      skeleton: <SkeletonCell kind="checkbox" />,
    },
    {
      key: 'permission',
      header: 'Permission',
      skeleton: <SkeletonCell lines={2} width="75%" />,
    },
    {
      key: 'module',
      header: 'Module',
      skeleton: <SkeletonCell width="6rem" />,
    },
    {
      key: 'action',
      header: 'Action',
      skeleton: <SkeletonCell kind="badge" />,
    },
  ].map((column) => ({
    ...column,
    render: () => null,
  })),
}

export const loadingCell = (view: keyof typeof tableLoadingColumns, key: string) =>
  tableLoadingColumns[view].find((column) => column.key === key)?.skeleton

const widths: Record<keyof typeof tableLoadingColumns, Record<string, string>> = {
  jul: {
    number: '24%',
    customer: '24%',
    status: '20%',
    createdAt: '20%',
    actions: '12%',
  },
  requests: {
    driver: '32%',
    plant: '18%',
    createdAt: '14%',
    status: '18%',
    actions: '18%',
  },
  vehicles: {
    vehicle: '32%',
    plant: '18%',
    createdAt: '14%',
    status: '18%',
    actions: '18%',
  },
  accounts: {
    name: '23%',
    role: '16%',
    contact: '19%',
    plants: '17%',
    status: '10%',
    actions: '15%',
  },
  roles: {
    role: '22%',
    description: '35%',
    permissions: '18%',
    status: '13%',
    actions: '12%',
  },
  permissions: {
    select: '9%',
    permission: '51%',
    module: '22%',
    action: '18%',
  },
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
