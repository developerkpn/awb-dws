import { Construction } from '@/ui/icons'
import { PageHeader } from '@/ui/Card'

export default function Approval() {
  return (
    <>
      <PageHeader
        title="Approval queue"
        subtitle="Review and approve pre-registration submissions."
      />
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <Construction className="size-10 text-stone-300" />
        <div>
          <p className="font-medium text-stone-700">Coming soon</p>
          <p className="mt-1 text-sm text-stone-500">
            This operational workflow is still being built.
          </p>
        </div>
      </div>
    </>
  )
}
