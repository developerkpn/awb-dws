import { useState } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import LookupField from '@/components/LookupField'
import { Field, Input, Textarea } from '@/ui/Field'
import type { RegistrationSectionProps } from '@/types/registration'
import { ChoiceGroup } from './ChoiceGroup'
import { WEIGHING_TYPE_OPTIONS } from './defaults'
import { DriverPhotoField } from './DriverPhotoField'
import { Reveal } from './Reveal'
import { Section } from './Section'

const pick = {
  shouldDirty: true,
  shouldValidate: true,
} as const

export function TruckSection({ form }: RegistrationSectionProps) {
  const { register, control, formState, getValues, setValue } = form
  const errors = formState.errors
  const [tanker, setTanker] = useState(() => !!getValues('tankerNumber'))
  const [passengers, setPassengers] = useState(() => Number(getValues('passengerCount')) > 0)

  const [plate, license, driverName, transporterCode, transporterName, tankerNumber] = useWatch({
    control,
    name: [
      'plateNumber',
      'licenseNumber',
      'driverName',
      'transporterCode',
      'transporterName',
      'tankerNumber',
    ],
  })

  const setTransporter = (code: string | null, name: string | null) => {
    setValue('transporterCode', code ?? '', pick)
    setValue('transporterName', name ?? '', pick)
  }

  return (
    <Section
      id="truck"
      step={1}
      title="Truck & driver"
      description="Pick the truck and the driver from the SAP masters, and photograph the driver."
      invalid={
        !!errors.plateNumber ||
        !!errors.licenseNumber ||
        !!errors.driverPhoto ||
        !!errors.transporterCode
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <LookupField
            kind="vehicle"
            label="Truck plate"
            required
            value={plate ?? ''}
            placeholder="Search a plate, e.g. KB 1234 AB"
            error={errors.plateNumber?.message}
            toOption={(row) => ({
              value: row.plateNumber,
              label: row.plateNumber,
              description:
                [
                  row.transporterCode,
                  row.transporterName,
                  row.tankerNumber && `Tanker ${row.tankerNumber}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined,
            })}
            onPick={(row) => {
              setValue('plateNumber', row.plateNumber, pick)

              if (row.transporterCode) setTransporter(row.transporterCode, row.transporterName)

              if (row.tankerNumber) {
                setValue('tankerNumber', row.tankerNumber, pick)
                setTanker(true)
              }
            }}
          />
        </div>
        <LookupField
          kind="driver"
          label="Driver licence (SIM)"
          required
          value={license ?? ''}
          placeholder="Search a licence number or name"
          error={errors.licenseNumber?.message}
          toOption={(row) => ({
            value: row.licenseNumber,
            label: row.licenseNumber,
            description: row.name,
          })}
          onPick={(row) => {
            setValue('licenseNumber', row.licenseNumber, pick)
            setValue('driverName', row.name, pick)
          }}
          onClear={() => {
            setValue('licenseNumber', '', pick)
            setValue('driverName', '', pick)
          }}
        />
        <Field label="Driver name">
          <Input readOnly value={driverName ?? ''} placeholder="—" />
        </Field>
        <div className="sm:col-span-2">
          <DriverPhotoField form={form} />
        </div>
        <LookupField
          kind="transporter"
          label="Transporter code"
          value={transporterCode ?? ''}
          placeholder="Search a transporter"
          error={errors.transporterCode?.message}
          toOption={(row) => ({
            value: row.code,
            label: row.code,
            description: row.name,
          })}
          onPick={(row) => setTransporter(row.code, row.name)}
          onClear={() => setTransporter(null, null)}
        />
        <Field label="Transporter name">
          <Input readOnly value={transporterName ?? ''} placeholder="—" />
        </Field>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-sm font-medium text-stone-700">Weighing</p>
        <Controller
          control={control}
          name="weighingType"
          render={({ field }) => (
            <ChoiceGroup
              label="Weighing"
              value={field.value}
              options={WEIGHING_TYPE_OPTIONS}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <Reveal label="Tanker truck" open={tanker} onOpen={() => setTanker(true)}>
          <div className="w-full sm:w-72">
            <LookupField
              kind="tanker"
              label="Tanker number"
              value={tankerNumber ?? ''}
              placeholder="Search a tanker"
              error={errors.tankerNumber?.message}
              toOption={(row) => ({
                value: row.number,
                label: row.number,
                description:
                  [row.capacityKg && `${row.capacityKg} kg`, row.truckNumber]
                    .filter(Boolean)
                    .join(' · ') || undefined,
              })}
              onPick={(row) => setValue('tankerNumber', row.number, pick)}
              onClear={() => setValue('tankerNumber', '', pick)}
            />
          </div>
        </Reveal>
        <Reveal label="Passengers" open={passengers} onOpen={() => setPassengers(true)}>
          <div className="grid w-full gap-4 sm:grid-cols-[8rem_1fr]">
            <Field label="Count" error={errors.passengerCount?.message}>
              <Input type="number" min={0} max={99} {...register('passengerCount')} />
            </Field>
            <Field label="Passenger names">
              <Textarea rows={1} {...register('passengerNames')} />
            </Field>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
