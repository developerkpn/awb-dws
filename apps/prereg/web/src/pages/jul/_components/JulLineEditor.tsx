import { Button, Card, CardBody, CardHeader, Combobox, Field, Input, Select } from '@awb/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { useJulDrivers, useJulVehicles } from '@/hooks/jul'
import { X } from '@/ui/icons'
import QuantityInput from '@/components/QuantityInput'
import type { EditableLine, JulLineEditorProps } from '@/types/jul'

export function JulLineEditor({
  line,
  index,
  customerId,
  update,
  remove,
  multi,
}: JulLineEditorProps) {
  const license = useDebounce(line.driverLicenseNumber ?? '', 400)
  const plate = useDebounce(line.vehiclePlateNumber ?? '', 400)
  const drivers = useJulDrivers(customerId, license)
  const vehicles = useJulVehicles(customerId, plate)

  return (
    <Card>
      <CardHeader
        action={
          !multi ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove allocation ${index + 1}`}
              onClick={remove}
            >
              <X className="size-4" />
            </Button>
          ) : undefined
        }
      >
        <h2 className="font-semibold text-stone-900">
          {multi
            ? `Multi-DO trip · ${multi.lines.length} delivery orders`
            : `Allocation ${index + 1} · ${line.reference}`}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {multi
            ? 'One vehicle and driver shared across all delivery orders on this trip.'
            : `${line.description}${line.available ? ` · Available ${line.available} ${line.uom}` : ''}`}
        </p>
      </CardHeader>
      <CardBody className="space-y-5">
        {multi && (
          <div className="space-y-3">
            {multi.lines.map((item, idx) => (
              <div
                key={item.key}
                className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-stone-200 p-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    DO {idx + 1} · {item.reference}
                  </p>
                  <p className="text-sm text-stone-500">
                    {item.description}
                    {item.available ? ` · Available ${item.available} ${item.uom}` : ''}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <Field label={`Quantity (${item.reference})`} required>
                    <QuantityInput
                      value={item.quantity}
                      onValueChange={(value) => multi.updateQuantity(item.key, value)}
                      placeholder={'Quantity in ' + item.uom}
                      required
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove allocation ${idx + 1}`}
                    onClick={() => multi.removeLine(item.key)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-3">
          {!multi && (
            <Field label="Quantity" required>
              <QuantityInput
                value={line.quantity}
                onValueChange={(quantity) =>
                  update({
                    ...line,
                    quantity,
                  })
                }
                placeholder={'Quantity in ' + line.uom}
                required
              />
            </Field>
          )}
          <Field label="Loading date">
            <Input
              type="date"
              value={line.loadingDate ?? ''}
              onChange={(event) =>
                update({
                  ...line,
                  loadingDate: event.target.value || undefined,
                })
              }
            />
          </Field>
          <Field label="Transport mode">
            <Select
              value={line.mediaTransport}
              onChange={(event) =>
                update({
                  ...line,
                  mediaTransport: event.target.value as EditableLine['mediaTransport'],
                })
              }
            >
              {line.modes.map((mode) => (
                <option key={mode.code} value={mode.code}>
                  {mode.code === mode.name ? mode.code : `${mode.code} · ${mode.name}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Driver license"
            hint={
              drivers.data?.find((driver) => driver.licenseNumber === line.driverLicenseNumber)
                ?.name ?? 'Search by license number or name. Only drivers registered in SAP.'
            }
          >
            <Combobox
              value={line.driverLicenseNumber ?? ''}
              placeholder="Type a license number or name"
              isLoading={drivers.isFetching}
              emptyMessage={
                license.length < 2
                  ? 'Type at least 2 characters.'
                  : 'No driver registered in SAP matches.'
              }
              options={(drivers.data ?? []).map((driver) => ({
                value: driver.licenseNumber,
                label: driver.licenseNumber,
                description: driver.name,
              }))}
              onInputChange={(value) =>
                update({
                  ...line,
                  driverLicenseNumber: value,
                })
              }
              onSelect={(option) =>
                update({
                  ...line,
                  driverLicenseNumber: option.value,
                })
              }
            />
          </Field>
          <Field
            label="Vehicle plate"
            hint="Search by plate number. Only vehicles registered in SAP."
          >
            <Combobox
              value={line.vehiclePlateNumber ?? ''}
              placeholder="Type a plate number"
              isLoading={vehicles.isFetching}
              emptyMessage={
                plate.length < 2
                  ? 'Type at least 2 characters.'
                  : 'No vehicle registered in SAP matches.'
              }
              options={(vehicles.data ?? []).map((vehicle) => ({
                value: vehicle,
                label: vehicle,
              }))}
              onInputChange={(value) =>
                update({
                  ...line,
                  vehiclePlateNumber: value.toUpperCase(),
                })
              }
              onSelect={(option) =>
                update({
                  ...line,
                  vehiclePlateNumber: option.value,
                })
              }
            />
          </Field>
          <Field label="Remark">
            <Input
              value={line.remark ?? ''}
              maxLength={500}
              onChange={(event) =>
                update({
                  ...line,
                  remark: event.target.value,
                })
              }
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  )
}
