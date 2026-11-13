import { useState } from 'react'
import { driverPhotoUrl } from '@/hooks/registration'
import { Camera } from '@/ui/icons'
import { Modal } from '@/ui/Modal'
import type { RegistrationCellProps } from '@/types/registration'

export function DriverPhotoButton({ row }: RegistrationCellProps) {
  const [open, setOpen] = useState(false)

  if (!row.hasDriverPhoto) return null

  const name = row.driverName || 'the driver'

  return (
    <>
      <button
        type="button"
        aria-label={`Show the photo of ${name}`}
        title="Driver photo"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
      >
        <Camera className="size-4" />
      </button>
      {open && (
        <Modal title={row.driverName || 'Driver photo'} onClose={() => setOpen(false)}>
          <img
            src={driverPhotoUrl(row.id)}
            alt={`Photo of ${name}`}
            className="w-full rounded-xl bg-stone-100"
          />
          <p className="mt-3 text-sm text-stone-500">
            {row.plateNumber} · {row.number}
            {row.licenseNumber && ` · SIM ${row.licenseNumber}`}
          </p>
        </Modal>
      )}
    </>
  )
}
