import { useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Field,
  Input,
  Select,
  FormError,
  FormSection,
  PageHeader,
  useConfirm,
} from '@awb/ui'
import { ArrowLeft, Save, AlertTriangle, Upload, CheckCircle } from '@/ui/icons'
import { useTransporters, useUploadDocument } from '@/hooks/driverRequest'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DriverRequestDetail, DriverRequestFormData } from '@/types/driverRequest'
import { driverRequestFormSchema, type DriverRequestFormValues } from './schema'

interface RequestFormProps {
  request?: DriverRequestDetail
  isSubmitting: boolean
  error?: string
  onSubmit: (data: DriverRequestFormData) => Promise<void>
  onCancel: () => void
}

interface UploadSlotProps {
  label: string
  category: 'sim' | 'driver' | 'stnk'
  currentUrl?: string
  onChange: (url: string) => void
  disabled: boolean
  onPending: (category: string, pending: boolean) => void
}

function UploadSlot({
  label,
  category,
  currentUrl,
  onChange,
  disabled,
  onPending,
}: UploadSlotProps) {
  const upload = useUploadDocument()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    onPending(category, true)
    try {
      const result = await upload.mutateAsync({ file, category })
      onChange(result.url)
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      onPending(category, false)
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-stone-50/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        {currentUrl ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="size-4" /> Uploaded
          </span>
        ) : (
          <span className="text-xs text-stone-400">Optional (JPEG/PNG/PDF)</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50">
          <Upload className="size-4 text-stone-500" />
          <span>
            {upload.isPending ? 'Uploading...' : currentUrl ? 'Change File' : 'Choose File'}
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,application/pdf"
            disabled={disabled || upload.isPending}
            onChange={handleFileChange}
          />
        </label>
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View document
          </a>
        )}
      </div>

      {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
    </div>
  )
}

export default function RequestForm({
  request,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: RequestFormProps) {
  const confirm = useConfirm()
  const transporters = useTransporters()
  const [pendingUploads, setPendingUploads] = useState<Record<string, boolean>>({})
  const uploading = Object.values(pendingUploads).some(Boolean)
  const onPending = (category: string, pending: boolean) =>
    setPendingUploads((current) => ({ ...current, [category]: pending }))

  const defaultBirthDate = request?.driverBirthDate
    ? new Date(request.driverBirthDate).toISOString().split('T')[0]
    : ''

  const form = useForm<DriverRequestFormValues>({
    resolver: zodResolver(driverRequestFormSchema),
    defaultValues: {
      driverLicenseNumber: request?.driverLicenseNumber ?? '',
      driverName: request?.driverName ?? '',
      driverAddress: request?.driverAddress ?? '',
      driverBirthPlace: request?.driverBirthPlace ?? '',
      driverBirthDate: defaultBirthDate,
      driverPhone: request?.driverPhone ?? '',
      driverCity: request?.driverCity ?? '',
      driverLicensePhotoUrl: request?.driverLicensePhotoUrl ?? '',
      driverPhotoUrl: request?.driverPhotoUrl ?? '',
      vehiclePlateNumber: request?.vehiclePlateNumber ?? '',
      transporterId: request?.transporterId ?? '',
      vehicleStnkPhotoUrl: request?.vehicleStnkPhotoUrl ?? '',
    },
  })

  const { register, handleSubmit, formState, watch, setValue } = form
  const errors = formState.errors

  const cancel = async () => {
    if (
      !formState.isDirty ||
      (await confirm({
        title: 'Discard changes?',
        description: 'Any unsaved changes will be lost.',
        confirmLabel: 'Discard',
        variant: 'danger',
      }))
    ) {
      onCancel()
    }
  }

  const handleFormSubmit = async (values: DriverRequestFormValues) => {
    if (uploading || isSubmitting) return
    const payload: DriverRequestFormData = {
      driverLicenseNumber: values.driverLicenseNumber,
      driverName: values.driverName,
      driverAddress: values.driverAddress,
      driverBirthPlace: values.driverBirthPlace,
      driverBirthDate: values.driverBirthDate,
      driverPhone: values.driverPhone,
      driverCity: values.driverCity || undefined,
      driverLicensePhotoUrl: values.driverLicensePhotoUrl || undefined,
      driverPhotoUrl: values.driverPhotoUrl || undefined,
      vehiclePlateNumber: values.vehiclePlateNumber,
      transporterId: values.transporterId || undefined,
      vehicleStnkPhotoUrl: values.vehicleStnkPhotoUrl || undefined,
    }
    await onSubmit(payload)
  }

  const isEdit = Boolean(request)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={isEdit ? 'Revise Driver & Vehicle Request' : 'New Driver & Vehicle Request'}
          subtitle={
            isEdit
              ? 'Update rejected fields before resubmitting for Logistics review.'
              : 'Submit driver and vehicle details for review and plant access approval.'
          }
        />
        <Button variant="secondary" onClick={cancel} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      {request?.status === 'REJECTED' && request.rejectionReason && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertTriangle className="size-5 shrink-0 text-rose-600" />
          <div>
            <h4 className="text-sm font-semibold">Rejection Reason:</h4>
            <p className="mt-1 text-sm">{request.rejectionReason}</p>
          </div>
        </div>
      )}

      {error && <FormError message={error} />}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormSection
          step="1"
          title="Driver Details"
          description="Provide valid driver identity according to the official driver license."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Driver License Number (SIM)"
              error={errors.driverLicenseNumber?.message}
              required
            >
              <Input
                {...register('driverLicenseNumber')}
                placeholder="e.g. 1234-5678-901234"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Driver Full Name" error={errors.driverName?.message} required>
              <Input
                {...register('driverName')}
                placeholder="Full name as printed on license"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Place of Birth" error={errors.driverBirthPlace?.message} required>
              <Input
                {...register('driverBirthPlace')}
                placeholder="City of birth"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Date of Birth" error={errors.driverBirthDate?.message} required>
              <Input type="date" {...register('driverBirthDate')} disabled={isSubmitting} />
            </Field>

            <Field label="Phone / WhatsApp Number" error={errors.driverPhone?.message} required>
              <Input
                {...register('driverPhone')}
                placeholder="e.g. 08123456789"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Domicile City" error={errors.driverCity?.message}>
              <Input
                {...register('driverCity')}
                placeholder="Current city of residence"
                disabled={isSubmitting}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Full Address" error={errors.driverAddress?.message} required>
                <Input
                  {...register('driverAddress')}
                  placeholder="Street address, district, city"
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          step="2"
          title="Vehicle Details"
          description="Truck and transporter assignment for plant gate operations."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="License Plate Number" error={errors.vehiclePlateNumber?.message} required>
              <Input
                {...register('vehiclePlateNumber')}
                placeholder="e.g. B 1234 XYZ"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Transporter / Carrier" error={errors.transporterId?.message}>
              <Select
                {...register('transporterId')}
                disabled={isSubmitting || transporters.isLoading}
              >
                <option value="">-- Select Transporter (Optional) --</option>
                {transporters.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          step="3"
          title="Documents & Photos"
          description="Upload official document photos to accelerate verification by Logistics."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UploadSlot
              label="Driver License (SIM)"
              category="sim"
              disabled={isSubmitting}
              onPending={onPending}
              currentUrl={watch('driverLicensePhotoUrl')}
              onChange={(url) => setValue('driverLicensePhotoUrl', url, { shouldDirty: true })}
            />

            <UploadSlot
              label="Driver Photo"
              category="driver"
              disabled={isSubmitting}
              onPending={onPending}
              currentUrl={watch('driverPhotoUrl')}
              onChange={(url) => setValue('driverPhotoUrl', url, { shouldDirty: true })}
            />

            <UploadSlot
              label="Vehicle Registration (STNK)"
              category="stnk"
              disabled={isSubmitting}
              onPending={onPending}
              currentUrl={watch('vehicleStnkPhotoUrl')}
              onChange={(url) => setValue('vehicleStnkPhotoUrl', url, { shouldDirty: true })}
            />
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={cancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || uploading}
            className="gap-1.5"
          >
            <Save className="size-4" />
            {isSubmitting ? 'Saving...' : isEdit ? 'Submit Revision' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
