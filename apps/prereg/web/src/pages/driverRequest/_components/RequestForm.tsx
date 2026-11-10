import { useState } from 'react'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
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
import { ArrowLeft, Save, AlertTriangle } from '@/ui/icons'
import { useDriverRequestPlants } from '@/hooks/driverRequest'
import { driverFormSchema, vehicleFormSchema } from './schema'
import { UploadSlot } from './UploadSlot'
import type {
  DriverFormValues,
  DriverRequestFormProps,
  PlantFieldProps,
  RequestFormShellProps,
  VehicleFormValues,
} from '@/types/driverRequest'

function usePendingUploads() {
  const [pending, setPending] = useState<Record<string, boolean>>({})

  return {
    uploading: Object.values(pending).some(Boolean),
    onPending: (category: string, value: boolean) =>
      setPending((current) => ({
        ...current,
        [category]: value,
      })),
  }
}

function useCancel(form: UseFormReturn<FieldValues>, onCancel: () => void) {
  const confirm = useConfirm()

  return async () => {
    if (
      !form.formState.isDirty ||
      (await confirm({
        title: 'Discard changes?',
        description: 'Any unsaved changes will be lost.',
        confirmLabel: 'Discard',
        variant: 'danger',
      }))
    )
      onCancel()
  }
}

function PlantField({ form, disabled }: PlantFieldProps) {
  const plants = useDriverRequestPlants()

  return (
    <Field
      label="Plant target"
      error={form.formState.errors.siteId?.message as string | undefined}
      hint="The plant this will be sent to once SAP confirms it."
      required
    >
      <Select {...form.register('siteId')} disabled={disabled || plants.isLoading}>
        <option value="">{plants.isLoading ? 'Loading plants…' : 'Select a plant'}</option>
        {plants.data?.map((plant) => (
          <option key={plant.code} value={plant.code}>
            {plant.name}
          </option>
        ))}
      </Select>
    </Field>
  )
}

function DriverForm({ request, isSubmitting, error, onSubmit, onCancel }: DriverRequestFormProps) {
  const { uploading, onPending } = usePendingUploads()

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      siteId: request?.siteId ?? '',
      driverName: request?.driverName ?? '',
      driverLicenseNumber: request?.driverLicenseNumber ?? '',
      driverBirthPlace: request?.driverBirthPlace ?? '',
      driverBirthDate: request?.driverBirthDate?.slice(0, 10) ?? '',
      driverPhone: request?.driverPhone ?? '',
      driverCity: request?.driverCity ?? '',
      driverAddress: request?.driverAddress ?? '',
      driverAddress2: request?.driverAddress2 ?? '',
      driverAddress3: request?.driverAddress3 ?? '',
      driverLicensePhotoUrl: request?.driverLicensePhotoUrl ?? '',
      driverPhotoUrl: request?.driverPhotoUrl ?? '',
    },
  })

  const generic = form as unknown as UseFormReturn<FieldValues>
  const cancel = useCancel(generic, onCancel)
  const { register, formState, watch, setValue } = form
  const errors = formState.errors

  return (
    <FormShell
      kind="driver"
      request={request}
      error={error}
      isSubmitting={isSubmitting}
      uploading={uploading}
      onCancel={cancel}
      onSubmit={form.handleSubmit(async (values) => {
        if (uploading || isSubmitting) return

        await onSubmit({
          ...values,
          kind: 'DRIVER',
          driverAddress2: values.driverAddress2 || undefined,
          driverAddress3: values.driverAddress3 || undefined,
        })
      })}
    >
      <FormSection
        step="1"
        title="Driver details"
        description="As printed on the driver license (SIM)."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PlantField form={generic} disabled={isSubmitting} />
          </div>
          <Field label="Full name" error={errors.driverName?.message} required>
            <Input {...register('driverName')} maxLength={100} disabled={isSubmitting} />
          </Field>
          <Field label="License number (SIM)" error={errors.driverLicenseNumber?.message} required>
            <Input {...register('driverLicenseNumber')} maxLength={25} disabled={isSubmitting} />
          </Field>
          <Field label="Place of birth" error={errors.driverBirthPlace?.message} required>
            <Input {...register('driverBirthPlace')} maxLength={25} disabled={isSubmitting} />
          </Field>
          <Field label="Date of birth" error={errors.driverBirthDate?.message} required>
            <Input type="date" {...register('driverBirthDate')} disabled={isSubmitting} />
          </Field>
          <Field label="Phone number" error={errors.driverPhone?.message} required>
            <Input
              {...register('driverPhone')}
              placeholder="e.g. 08123456789"
              maxLength={30}
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Home city" error={errors.driverCity?.message} required>
            <Input {...register('driverCity')} maxLength={25} disabled={isSubmitting} />
          </Field>
          <div className="space-y-3 sm:col-span-2">
            <Field label="Address line 1" error={errors.driverAddress?.message} required>
              <Input {...register('driverAddress')} maxLength={50} disabled={isSubmitting} />
            </Field>
            <Field label="Address line 2" error={errors.driverAddress2?.message}>
              <Input {...register('driverAddress2')} maxLength={50} disabled={isSubmitting} />
            </Field>
            <Field label="Address line 3" error={errors.driverAddress3?.message}>
              <Input {...register('driverAddress3')} maxLength={50} disabled={isSubmitting} />
            </Field>
          </div>
        </div>
      </FormSection>
      <FormSection
        step="2"
        title="Documents"
        description="Clear photos speed up the Logistics review."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UploadSlot
            label="Driver license (SIM)"
            category="sim"
            required
            error={errors.driverLicensePhotoUrl?.message}
            disabled={isSubmitting}
            onPending={onPending}
            currentUrl={watch('driverLicensePhotoUrl')}
            onChange={(url) =>
              setValue('driverLicensePhotoUrl', url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <UploadSlot
            label="Driver photo"
            category="driver"
            required
            error={errors.driverPhotoUrl?.message}
            disabled={isSubmitting}
            onPending={onPending}
            currentUrl={watch('driverPhotoUrl')}
            onChange={(url) =>
              setValue('driverPhotoUrl', url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </FormSection>
    </FormShell>
  )
}

function VehicleForm({ request, isSubmitting, error, onSubmit, onCancel }: DriverRequestFormProps) {
  const { uploading, onPending } = usePendingUploads()

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      siteId: request?.siteId ?? '',
      vehiclePlateNumber: request?.vehiclePlateNumber ?? '',
      vehicleStnkPhotoUrl: request?.vehicleStnkPhotoUrl ?? '',
    },
  })

  const generic = form as unknown as UseFormReturn<FieldValues>
  const cancel = useCancel(generic, onCancel)
  const { register, formState, watch, setValue } = form
  const errors = formState.errors

  return (
    <FormShell
      kind="vehicle"
      request={request}
      error={error}
      isSubmitting={isSubmitting}
      uploading={uploading}
      onCancel={cancel}
      onSubmit={form.handleSubmit(async (values) => {
        if (uploading || isSubmitting) return

        await onSubmit({
          ...values,
          kind: 'VEHICLE',
        })
      })}
    >
      <FormSection step="1" title="Vehicle details" description="As printed on the STNK.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PlantField form={generic} disabled={isSubmitting} />
          </div>
          <Field label="Plate number" error={errors.vehiclePlateNumber?.message} required>
            <Input
              {...register('vehiclePlateNumber')}
              placeholder="e.g. B 1234 XYZ"
              maxLength={20}
              disabled={isSubmitting}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection step="2" title="Documents" description="A clear STNK photo speeds up review.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UploadSlot
            label="Vehicle registration (STNK)"
            category="stnk"
            required
            error={errors.vehicleStnkPhotoUrl?.message}
            disabled={isSubmitting}
            onPending={onPending}
            currentUrl={watch('vehicleStnkPhotoUrl')}
            onChange={(url) =>
              setValue('vehicleStnkPhotoUrl', url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </FormSection>
    </FormShell>
  )
}

function FormShell({
  kind,
  request,
  error,
  isSubmitting,
  uploading,
  onCancel,
  onSubmit,
  children,
}: RequestFormShellProps) {
  const isEdit = Boolean(request)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title={isEdit ? `Revise ${kind} request` : `New ${kind} request`}
          subtitle={
            isEdit
              ? 'Correct the rejected details and submit again for Logistics review.'
              : `Register a ${kind} for Logistics review. Once SAP confirms it, it can be used on registrations.`
          }
        />
        <Button variant="secondary" onClick={onCancel} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
      {request?.status === 'REJECTED' && request.rejectionReason && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertTriangle className="size-5 shrink-0 text-rose-600" />
          <div>
            <h4 className="text-sm font-semibold">Rejection reason</h4>
            <p className="mt-1 text-sm">{request.rejectionReason}</p>
          </div>
        </div>
      )}
      {error && <FormError message={error} />}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="space-y-6"
      >
        {children}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || uploading}
            className="gap-1.5"
          >
            <Save className="size-4" />
            {isSubmitting ? 'Saving…' : isEdit ? 'Submit revision' : 'Submit request'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function RequestForm(props: DriverRequestFormProps) {
  return props.kind === 'DRIVER' ? <DriverForm {...props} /> : <VehicleForm {...props} />
}
