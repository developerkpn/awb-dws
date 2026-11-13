import { useId, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { Button } from '@/ui/Button'
import { Camera, Profile, Trash } from '@/ui/icons'
import type { RegistrationSectionProps } from '@/types/registration'
import { CameraCapture } from './CameraCapture'

const pick = {
  shouldDirty: true,
  shouldValidate: true,
} as const

export function DriverPhotoField({ form }: RegistrationSectionProps) {
  const { control, formState, setValue } = form
  const id = useId()
  const [camera, setCamera] = useState(false)

  const photo = useWatch({
    control,
    name: 'driverPhoto',
  })

  const error = formState.errors.driverPhoto?.message

  return (
    <div role="group" aria-labelledby={id} className="ui-field">
      <p id={id} className="text-[0.8125rem] font-medium text-ink">
        Driver photo
        <span aria-hidden="true" className="ui-required">
          {' '}
          *
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-stone-50 ${
            error ? 'border-brand-500' : 'border-stone-200'
          }`}
        >
          {photo ? (
            <img src={photo} alt="Driver" className="size-full object-cover" />
          ) : (
            <Profile className="size-10! text-stone-300" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-invalid={!!error}
              onClick={() => setCamera(true)}
            >
              <Camera className="size-4" />
              {photo ? 'Retake' : 'Take photo'}
            </Button>
            {photo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue('driverPhoto', '', pick)}
              >
                <Trash className="size-4 text-rose-600" />
                Remove
              </Button>
            )}
          </div>
          {error ? (
            <p role="alert" className="ui-field-error">
              {error}
            </p>
          ) : (
            <p className="ui-field-hint">
              Taken with the desk camera. Each stage checks the driver against this photo.
            </p>
          )}
        </div>
      </div>
      {camera && (
        <CameraCapture
          onClose={() => setCamera(false)}
          onCapture={(dataUrl) => {
            setValue('driverPhoto', dataUrl, pick)
            setCamera(false)
          }}
        />
      )}
    </div>
  )
}
