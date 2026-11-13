import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, type FieldErrors, type FieldPath, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  registrationCreateInput,
  type RegistrationCreateData,
  type RegistrationCreateInput,
} from '@awb/contracts'
import { useConfirm } from '@awb/ui'
import { serverFieldErrors, useCreateRegistration } from '@/hooks/registration'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Card'
import { FormError } from '@/ui/Field'
import { ArrowLeft } from '@/ui/icons'
import { getErrorMessage } from '@/utils/errorHandler'
import type { SectionId } from '@/types/registration'
import { CardSection } from './_components/CardSection'
import { emptyRegistration } from './_components/defaults'
import { DestinationSection } from './_components/DestinationSection'
import { ExtrasSection } from './_components/ExtrasSection'
import { LoadSection } from './_components/LoadSection'
import { OtherPartySection } from './_components/OtherPartySection'
import { SummaryPanel } from './_components/SummaryPanel'
import { TruckSection } from './_components/TruckSection'

const schemaResolver = zodResolver(registrationCreateInput)

// The contract treats a missing answer as "no"; the form makes the operator choose.
const resolver: Resolver<RegistrationCreateInput, unknown, RegistrationCreateData> = async (
  values,
  context,
  options,
) => {
  const result = await schemaResolver(values, context, options)

  if (values.hasOtherPartyWeight !== undefined) return result

  return {
    values: {},
    errors: {
      ...result.errors,
      hasOtherPartyWeight: {
        type: 'required',
        message: 'Choose whether the truck carries an other-party weighbridge ticket',
      },
    },
  }
}

const SECTION_OF: [keyof RegistrationCreateInput, SectionId][] = [
  ['plateNumber', 'truck'],
  ['licenseNumber', 'truck'],
  ['driverPhoto', 'truck'],
  ['passengerCount', 'truck'],
  ['dos', 'load'],
  ['destinations', 'destination'],
  ['hasOtherPartyWeight', 'otherParty'],
  ['otherPartyGross', 'otherParty'],
  ['otherPartyTare', 'otherParty'],
  ['cardNumber', 'card'],
  ['containers', 'extras'],
  ['qualities', 'extras'],
]

export default function AddRegistration() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const createMutation = useCreateRegistration()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegistrationCreateInput, unknown, RegistrationCreateData>({
    resolver,
    defaultValues: emptyRegistration(),
  })

  const onInvalid = (errors: FieldErrors<RegistrationCreateInput>) => {
    const first = SECTION_OF.find(([key]) => errors[key])

    if (first)
      document.getElementById(`section-${first[1]}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }

  const onValid = async (data: RegistrationCreateData) => {
    setServerError(null)

    try {
      const created = await createMutation.mutateAsync(data)

      navigate('/registrations', {
        state: { created: created.number },
      })
    } catch (error) {
      for (const [key, messages] of Object.entries(serverFieldErrors(error))) {
        if (messages?.[0])
          form.setError(key as FieldPath<RegistrationCreateInput>, { message: messages[0] })
      }

      setServerError(getErrorMessage(error, 'Unable to save the registration.'))
    }
  }

  const save = () => {
    setSubmitted(true)
    void form.handleSubmit(onValid, onInvalid)()
  }

  const leave = async () => {
    if (form.formState.isDirty) {
      const ok = await confirm({
        title: 'Discard this registration?',
        description: 'Anything not saved will be lost.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        variant: 'danger',
      })

      if (!ok) return
    }

    navigate('/registrations')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New registration"
        subtitle="Fill in from top to bottom. Numbered sections are required; extras only when present."
        action={
          <Button variant="ghost" onClick={() => void leave()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <FormError
        message={
          serverError ??
          (submitted && Object.keys(form.formState.errors).length
            ? 'Complete the fields marked in red.'
            : null)
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <TruckSection form={form} />
          <LoadSection form={form} />
          <DestinationSection form={form} />
          <OtherPartySection form={form} />
          <CardSection form={form} />
          <ExtrasSection form={form} />
        </div>
        <div className="xl:sticky xl:top-0">
          <SummaryPanel
            form={form}
            submitted={submitted}
            isSaving={createMutation.isPending}
            onSave={save}
            onCancel={() => void leave()}
          />
        </div>
      </div>
    </div>
  )
}
