import type { ReactNode, TableHTMLAttributes } from 'react'
import { Fragment } from 'react'
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined'
import ArrowUpwardOutlined from '@mui/icons-material/ArrowUpwardOutlined'
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined'
import type { SortDirection } from '@awb/contracts'
import { SkeletonCell } from '../molecules/SkeletonCell'
import { Pagination } from '../molecules/Pagination'
import type { ServerPagination } from '../molecules/Pagination'
import '../styles/components.css'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  render: (item: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
  className?: string
  sortKey?: string
  sortHint?: string
  skeleton?: ReactNode
}
export interface ServerSorting {
  sortBy: string
  direction: SortDirection
  onSortChange: (key: string, direction: SortDirection) => void
  isLoading?: boolean
}
export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T, index: number) => string
  pagination: ServerPagination
  sorting?: ServerSorting
  minWidth?: string
  emptyMessage?: string
  emptyDescription?: string
  isLoading?: boolean
  groupBy?: (item: T) => string
  renderGroupHeader?: (group: string, items: T[]) => ReactNode
  onRowClick?: (item: T) => void
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  pagination,
  sorting,
  minWidth = '48rem',
  emptyMessage = 'No records found',
  emptyDescription,
  isLoading = false,
  groupBy,
  renderGroupHeader,
  onRowClick,
  className = '',
  style,
  ...props
}: TableProps<T>) {
  return (
    <section className="ui-data-table">
      {isLoading && (
        <span className="ui-sr-only" role="status">
          Loading records…
        </span>
      )}
      <div className="ui-table-scroll">
        <table
          {...props}
          style={{
            tableLayout: 'fixed',
            minWidth,
            ...style,
          }}
          aria-busy={isLoading || pagination.isLoading}
          className={`ui-table ${className}`}
        >
          <thead>
            <tr>
              {columns.map((column) => {
                const sortable = !!column.sortKey && !!sorting
                const active = sortable && sorting.sortBy === column.sortKey
                const direction = active && sorting.direction === 'asc' ? 'desc' : 'asc'

                const SortIcon = !active
                  ? UnfoldMoreOutlined
                  : sorting.direction === 'asc'
                    ? ArrowUpwardOutlined
                    : ArrowDownwardOutlined

                return (
                  <th
                    key={column.key}
                    scope="col"
                    data-sortable={sortable || undefined}
                    aria-sort={
                      sortable
                        ? active
                          ? sorting.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    style={{
                      width: column.width,
                      textAlign: column.align,
                    }}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="ui-table-sort"
                        data-active={active}
                        title={`${column.sortHint ?? 'Sort'} ${direction === 'asc' ? 'ascending' : 'descending'}`}
                        disabled={isLoading || sorting.isLoading}
                        onClick={() => sorting.onSortChange(column.sortKey!, direction)}
                      >
                        {column.header}
                        <SortIcon aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {groupBy && (
                  <tr className="ui-table-group" aria-hidden="true">
                    <td colSpan={columns.length}>
                      <div className="ui-table-skeleton-group">
                        <SkeletonCell width="10rem" />
                        <SkeletonCell kind="checkbox" />
                      </div>
                    </td>
                  </tr>
                )}
                {Array.from(
                  {
                    length: Math.min(pagination.limit ?? 20, 6),
                  },
                  (_, row) => (
                    <tr key={row} aria-hidden="true">
                      {columns.map((column, index) => (
                        <td key={column.key}>
                          {column.skeleton ?? <SkeletonCell lines={index === 0 ? 2 : 1} />}
                        </td>
                      ))}
                    </tr>
                  ),
                )}
              </>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="ui-table-state">
                    <strong>{emptyMessage}</strong>
                    {emptyDescription && <span>{emptyDescription}</span>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const group = groupBy?.(item)

                const firstInGroup =
                  group !== undefined && (index === 0 || groupBy?.(data[index - 1]!) !== group)

                return (
                  <Fragment key={keyExtractor(item, index)}>
                    {firstInGroup && renderGroupHeader && (
                      <tr className="ui-table-group">
                        <td colSpan={columns.length}>
                          {renderGroupHeader(
                            group,
                            data.filter((row) => groupBy?.(row) === group),
                          )}
                        </td>
                      </tr>
                    )}
                    <tr
                      data-clickable={onRowClick ? true : undefined}
                      onClick={
                        onRowClick
                          ? (event) => {
                              // Buttons, links and inputs inside the row keep their own action.
                              if (
                                !(event.target as HTMLElement).closest(
                                  'button, a, input, select, textarea, label',
                                )
                              )
                                onRowClick(item)
                            }
                          : undefined
                      }
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.className}
                          style={{ textAlign: column.align }}
                        >
                          {column.render(item, index)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...pagination} isLoading={isLoading || pagination.isLoading} />
    </section>
  )
}
