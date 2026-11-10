import type { ReactNode } from 'react'
import { Skeleton } from '../atoms/Skeleton'
import { Table, type TableColumn } from '../organisms/Table'

export type SkeletonView = 'table' | 'form' | 'auth' | 'recovery' | 'cards' | 'message'
export interface PageSkeletonProps {
  children?: ReactNode
  message?: string
  view?: SkeletonView
  columns?: TableColumn<never>[]
  tableMinWidth?: string
  grouped?: boolean
  toolbar?: 'filters' | 'search'
  banner?: boolean
  subtitle?: boolean
  back?: boolean
  saveBar?: boolean
  action?: boolean
  partner?: boolean
  shell?: boolean
  heroImage?: string
  logo?: string
}

const shape = (width: string, height = '0.875rem') => (
  <Skeleton
    style={{
      width,
      height,
    }}
  />
)

function FieldShape({ full = false }: { full?: boolean }) {
  return (
    <div className={full ? 'ui-loading-field ui-loading-full' : 'ui-loading-field'}>
      {shape('6rem', '0.75rem')}
      {shape('100%', '2.625rem')}
    </div>
  )
}

function SaveBar() {
  return (
    <div className="ui-loading-save">
      {shape('11rem')}
      <div>
        {shape('6rem', '2.375rem')}
        {shape('8rem', '2.375rem')}
      </div>
    </div>
  )
}

function FormView({ partner }: { partner?: boolean }) {
  return (
    <>
      <div className="ui-loading-form-layout">
        <div className="ui-loading-form-sections">
          <div className="ui-loading-card">
            <div className="ui-loading-section-heading">
              {shape('12rem')}
              {shape('75%', '0.75rem')}
            </div>
            <div className="ui-loading-field-grid">
              <Skeleton style={{ height: '5rem' }} />
              <Skeleton style={{ height: '5rem' }} />
              <FieldShape />
              <FieldShape />
              <FieldShape full />
            </div>
          </div>
          <div className="ui-loading-card">
            <div className="ui-loading-section-heading">
              {shape('9rem')}
              {shape('60%', '0.75rem')}
            </div>
            <div className="ui-loading-field-grid">
              <FieldShape />
              <FieldShape />
            </div>
          </div>
          {partner && (
            <div className="ui-loading-card">
              <div className="ui-loading-section-heading">
                {shape('8rem')}
                {shape('75%', '0.75rem')}
              </div>
              <div className="ui-loading-field-grid">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} style={{ height: '3.5rem' }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="ui-loading-summary">
          {shape('2.75rem', '2.75rem')}
          {shape('6rem', '0.75rem')}
          {shape('85%', '1.25rem')}
          {shape('60%', '0.75rem')}
          {[0, 1, 2].map((i) => (
            <div key={i} className="ui-loading-field">
              {shape('45%', '0.625rem')}
              {shape('65%')}
            </div>
          ))}
        </aside>
      </div>
      <SaveBar />
    </>
  )
}

function AuthView({ heroImage, logo }: Pick<PageSkeletonProps, 'heroImage' | 'logo'>) {
  return (
    <div className="ui-loading-auth">
      <div
        className="ui-loading-auth-hero"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(#00000035, #00000080), url("${heroImage}")`
            : undefined,
        }}
      >
        {logo && <img src={logo} alt="" />}
        <div>
          {shape('15rem', '0.75rem')}
          {shape('85%', '2.5rem')}
          {shape('70%', '2.5rem')}
          {shape('90%')}
        </div>
      </div>
      <div className="ui-loading-auth-main">
        <div className="ui-loading-auth-form">
          {shape('6.5rem', '1.75rem')}
          {shape('16rem')}
          <div className="ui-loading-auth-fields">
            {shape('100%', '2.625rem')}
            <FieldShape />
            <div className="ui-loading-inline">
              {shape('1rem', '1rem')}
              {shape('11rem')}
            </div>
            {shape('100%', '2.375rem')}
          </div>
        </div>
      </div>
    </div>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="ui-loading-shell">
      <aside className="ui-loading-sidebar">
        {shape('9rem', '2rem')}
        <div className="ui-loading-nav">
          {[1, 2, 2].map((count, group) => (
            <div key={group} className="ui-loading-nav-group">
              {shape('5rem', '0.625rem')}
              {Array.from({ length: count }, (_, item) => (
                <div key={item} className="ui-loading-nav-item">
                  {shape('1rem', '1rem')}
                  {shape('7rem')}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ui-loading-profile">
          <Skeleton
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
            }}
          />
          {shape('5rem')}
        </div>
      </aside>
      <div className="ui-loading-shell-main">
        <header>
          {shape('1.25rem', '1.25rem')}
          {shape('14rem', '0.75rem')}
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}

export function PageSkeleton({
  children,
  message = 'Loading content…',
  view = 'message',
  columns = [],
  grouped,
  tableMinWidth,
  toolbar = 'search',
  banner,
  subtitle = true,
  back,
  saveBar,
  action,
  partner,
  shell,
  heroImage,
  logo,
}: PageSkeletonProps) {
  const content =
    children ??
    (view === 'auth' ? (
      <AuthView heroImage={heroImage} logo={logo} />
    ) : view === 'recovery' ? (
      <div className="ui-loading-recovery">
        {shape('3.5rem', '3.5rem')}
        {shape('15rem', '1.75rem')}
        {shape('100%')}
        {shape('90%')}
        {shape('100%', '2.625rem')}
      </div>
    ) : (
      <div className="ui-view-skeleton">
        {back && shape('9rem', '2rem')}
        <div className="ui-loading-page-heading">
          <div>
            {shape(view === 'form' ? '16rem' : '18rem', '2rem')}
            {subtitle && shape(view === 'form' ? '70%' : '6rem')}
          </div>
          {action && shape('9rem', '2.375rem')}
        </div>
        {view === 'form' ? (
          <FormView partner={partner} />
        ) : view === 'table' ? (
          <>
            {banner && (
              <div className="ui-loading-banner">
                {shape('16rem')}
                {shape('75%', '0.75rem')}
              </div>
            )}
            <div className="ui-loading-toolbar">
              {shape(toolbar === 'filters' ? '24rem' : '20rem', '2.625rem')}
              {toolbar === 'filters' ? (
                <>
                  {shape('8rem', '2.625rem')}
                  {shape('8rem', '2.625rem')}
                </>
              ) : (
                shape('4rem')
              )}
            </div>
            <Table
              columns={columns}
              groupBy={grouped ? () => '' : undefined}
              minWidth={tableMinWidth}
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
            {saveBar && <SaveBar />}
          </>
        ) : view === 'cards' ? (
          <div className="ui-loading-overview">
            {[0, 1].map((i) => (
              <div key={i} className="ui-loading-card">
                {shape('2.5rem', '2.5rem')}
                {shape('9rem')}
                {shape('85%', '0.75rem')}
              </div>
            ))}
          </div>
        ) : (
          <div className="ui-loading-placeholder">
            {shape('2.5rem', '2.5rem')}
            {shape('8rem')}
            {shape('18rem', '0.75rem')}
          </div>
        )}
      </div>
    ))

  return (
    <div role="status" aria-label={message} aria-busy="true" data-skeleton-view={view}>
      <span className="ui-sr-only">{message}</span>
      <div aria-hidden="true">
        {shell && !['auth', 'recovery'].includes(view) ? <Frame>{content}</Frame> : content}
      </div>
    </div>
  )
}
