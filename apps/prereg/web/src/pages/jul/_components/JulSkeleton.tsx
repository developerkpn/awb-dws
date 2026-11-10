import { PageSkeleton, Skeleton } from '@awb/ui'

export function JulSkeleton({ view, shell }: { view: 'form' | 'detail'; shell?: boolean }) {
  return (
    <PageSkeleton view="form" shell={shell}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex justify-between">
          <Skeleton
            style={{
              width: '18rem',
              height: '2rem',
            }}
          />
          <Skeleton
            style={{
              width: '6rem',
              height: '2.5rem',
            }}
          />
        </div>
        <Skeleton style={{ height: '3rem' }} />
        <div className="ui-loading-card space-y-4">
          <Skeleton style={{ width: '12rem' }} />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from(
              {
                length: view === 'form' ? 3 : 4,
              },
              (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton style={{ width: '7rem' }} />
                  <Skeleton style={{ height: '2.5rem' }} />
                </div>
              ),
            )}
          </div>
        </div>
        <div className="ui-loading-card space-y-5">
          <Skeleton style={{ width: '15rem' }} />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton style={{ width: '6rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton
            style={{
              width: '7rem',
              height: '2.5rem',
            }}
          />
          <Skeleton
            style={{
              width: '10rem',
              height: '2.5rem',
            }}
          />
        </div>
      </div>
    </PageSkeleton>
  )
}
