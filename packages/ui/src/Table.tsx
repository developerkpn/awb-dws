import type { ReactNode, TableHTMLAttributes } from 'react'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  render: (item: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T, index: number) => string
  emptyMessage?: string
  isLoading?: boolean
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  isLoading = false,
  style,
  ...props
}: TableProps<T>) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <table
        {...props}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13.5px',
          fontFamily: 'inherit',
          ...style,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '13px 18px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#475569',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '40px 18px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                Loading data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '48px 18px',
                  textAlign: 'center',
                  color: '#94a3b8',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                style={{
                  borderBottom: index < data.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '14px 18px',
                      color: '#0f172a',
                      textAlign: col.align || 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
