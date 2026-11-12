import { Navigate, useParams } from 'react-router'
import { masterKind, type MasterKind } from '@awb/contracts'
import ErrorState from '@/components/ErrorState'
import { useAuth } from '@/hooks/auth'
import { useDebounce } from '@/hooks/useDebounce'
import { useMasterList } from '@/hooks/master'
import { usePagination } from '@/hooks/usePagination'
import { PageHeader } from '@/ui/Card'
import { Input } from '@/ui/Field'
import { Search } from '@/ui/icons'
import { Table } from '@/ui/Table'
import { getErrorMessage } from '@/utils/errorHandler'
import { pullSummary } from '@/utils/master'
import type { MasterTableProps } from '@/types/master'
import { MASTER_COLUMNS } from '../_components/columns'
import { MASTER_INFO } from '../_components/kinds'
import { PullButton } from '../_components/PullButton'

function MasterTable<K extends MasterKind>({ kind }: MasterTableProps<K>) {
  const { user } = useAuth()
  const pagination = usePagination()
  const search = useDebounce(pagination.q, 300)

  const query = useMasterList(kind, {
    page: pagination.page,
    limit: pagination.limit,
    search: search || undefined,
  })

  const columns = MASTER_COLUMNS[kind]

  return (
    <div className="space-y-6">
      <PageHeader
        title={MASTER_INFO[kind].label}
        subtitle={`${MASTER_INFO[kind].description} ${pullSummary(query.data?.status)}.`}
        action={user?.role === 'ADMIN' ? <PullButton kind={kind} size="md" /> : undefined}
      />
      <Input
        aria-label={`Search ${MASTER_INFO[kind].label.toLowerCase()}`}
        placeholder="Search code or name…"
        leadingIcon={<Search className="size-4" />}
        value={pagination.q}
        onChange={(event) => pagination.onSearchChange(event.target.value)}
        className="sm:w-80"
      />
      {query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error, 'Unable to load this master.')}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <Table
          columns={columns}
          data={query.data?.items ?? []}
          keyExtractor={(_row, index) => `${kind}-${pagination.page}-${index}`}
          isLoading={query.isPending}
          pagination={{
            ...pagination,
            total: query.data?.total ?? 0,
            isLoading: query.isFetching,
          }}
          emptyMessage="No rows yet."
          emptyDescription="Rows appear after a pull from SAP or the WB.NET backfill."
        />
      )}
    </div>
  )
}

export default function ListMaster() {
  const parsed = masterKind.safeParse(useParams().kind)

  if (!parsed.success) return <Navigate to="/masters" replace />

  return <MasterTable key={parsed.data} kind={parsed.data} />
}
