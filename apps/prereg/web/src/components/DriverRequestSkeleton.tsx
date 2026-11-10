import { PageSkeleton, Skeleton, Table } from '@awb/ui'
import { loadingColumnsFor } from '@/ui/loadingLayouts'

export function RequestFormSkeleton({ shell }: { shell?: boolean }) {
  return (
    <PageSkeleton view="form" shell={shell}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton
              style={{
                width: '24rem',
                height: '2rem',
              }}
            />
            <Skeleton
              style={{
                width: '30rem',
                maxWidth: '100%',
              }}
            />
          </div>
          <Skeleton
            style={{
              width: '5rem',
              height: '2.375rem',
            }}
          />
        </div>
        {[7, 2, 3].map((count, section) => (
          <div className="ui-loading-card space-y-5" key={section}>
            <div className="space-y-2">
              <Skeleton style={{ width: '12rem' }} />
              <Skeleton style={{ width: '70%' }} />
            </div>
            <div
              className={section === 2 ? 'grid gap-4 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'}
            >
              {Array.from({ length: count }, (_, index) => (
                <div
                  className={section === 0 && index === 6 ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
                  key={index}
                >
                  <Skeleton
                    style={{
                      width: '7rem',
                      height: '0.75rem',
                    }}
                  />
                  <Skeleton
                    style={{
                      height: section === 2 ? '5rem' : '2.625rem',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <Skeleton
            style={{
              width: '5rem',
              height: '2.375rem',
            }}
          />
          <Skeleton
            style={{
              width: '9rem',
              height: '2.375rem',
            }}
          />
        </div>
      </div>
    </PageSkeleton>
  )
}

export function RequestListSkeleton({ shell }: { shell?: boolean }) {
  return (
    <PageSkeleton view="table" shell={shell}>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <Skeleton
            style={{
              width: '16rem',
              height: '2rem',
            }}
          />
          <Skeleton
            style={{
              width: '9rem',
              height: '2.375rem',
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton
              key={index}
              style={{
                width: '6rem',
                height: '2rem',
              }}
            />
          ))}
        </div>
        <Table
          columns={loadingColumnsFor('requests')}
          data={[]}
          keyExtractor={() => ''}
          isLoading
          pagination={{
            page: 1,
            limit: 20,
            total: 0,
            onPageChange: () => {},
            onPageSizeChange: () => {},
          }}
        />
      </div>
    </PageSkeleton>
  )
}
