import type { BelPoItemChoice, BelTransportMode } from '@awb/contracts'
import { Button, Combobox, Field, Input, Select } from '@awb/ui'
import QuantityInput from '@/components/QuantityInput'
import { useBelDrivers, useBelVehicles } from '@/hooks/bel'
import { useDebounce } from '@/hooks/useDebounce'
import type { BelLineDraft } from '@/types/bel'
import { X } from '@/ui/icons'
import { quantityUnits, unitsText } from '@/utils/quantity'
import { TRANSPORT_OPTIONS } from './belStatus'

export default function BelLineEditor({
  index,
  line,
  vendorId,
  poChoices,
  editableBonusByDoc,
  usedByOtherLines,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number
  line: BelLineDraft
  vendorId?: string
  poChoices: BelPoItemChoice[]
  editableBonusByDoc: Record<string, bigint>
  usedByOtherLines: bigint
  canRemove: boolean
  onChange: (next: BelLineDraft) => void
  onRemove: () => void
}) {
  const debouncedDriver = useDebounce(line.driverLicenseNumber, 200)
  const debouncedVehicle = useDebounce(line.vehiclePlateNumber, 200)

  const drivers = useBelDrivers(debouncedDriver, vendorId, Boolean(vendorId))
  const vehicles = useBelVehicles(debouncedVehicle, vendorId, Boolean(vendorId))

  const selectedPo = poChoices.find((choice) => choice.id === line.documentId)
  const docBonus = selectedPo ? (editableBonusByDoc[selectedPo.id] ?? 0n) : 0n

  const remainingForLine = selectedPo
    ? quantityUnits(selectedPo.availableQuantity) + docBonus - usedByOtherLines
    : 0n

  const requestedUnits = line.quantity ? quantityUnits(line.quantity) : 0n
  const exceedsQuota = Boolean(selectedPo) && requestedUnits > remainingForLine

  const driverOptions = (drivers.data ?? []).map((driver) => ({
    value: driver.licenseNumber,
    label: driver.licenseNumber,
    description: driver.name,
  }))

  const vehicleOptions = (vehicles.data ?? []).map((plateNumber) => ({
    value: plateNumber,
    label: plateNumber,
  }))

  return (
    <div
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
      data-testid={`bel-line-${index}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">
          Allocation #{index + 1}
          {selectedPo ? ` · PO ${selectedPo.poNumber}/${selectedPo.poItem}` : ''}
        </h3>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<X className="size-3.5" />}
            onClick={onRemove}
          >
            Remove line
          </Button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label={`Quantity${selectedPo ? ` (${selectedPo.uom})` : ''}`}
          hint={
            selectedPo
              ? `Max ${unitsText(remainingForLine > 0n ? remainingForLine : 0n)} ${selectedPo.uom}`
              : 'Select a PO item first'
          }
          error={
            exceedsQuota && selectedPo
              ? `Exceeds remaining PO quota (${unitsText(remainingForLine > 0n ? remainingForLine : 0n)} ${selectedPo.uom})`
              : null
          }
          required
        >
          <QuantityInput
            aria-label={`Quantity line ${index + 1}`}
            placeholder="0"
            value={line.quantity}
            onValueChange={(nextQuantity) =>
              onChange({
                ...line,
                quantity: nextQuantity,
              })
            }
          />
        </Field>

        <Field label="Planned loading date">
          <Input
            aria-label={`Loading date line ${index + 1}`}
            type="date"
            value={line.loadingDate}
            onChange={(event) =>
              onChange({
                ...line,
                loadingDate: event.target.value,
              })
            }
          />
        </Field>

        <Field label="Transport mode" required>
          <Select
            aria-label={`Transport mode line ${index + 1}`}
            value={line.mediaTransport}
            onChange={(event) =>
              onChange({
                ...line,
                mediaTransport: event.target.value as BelTransportMode,
              })
            }
          >
            {TRANSPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Driver (SIM)" hint="Registered SAP master driver" required>
          <Combobox
            aria-label={`Driver SIM line ${index + 1}`}
            placeholder="Search license number or driver name..."
            value={line.driverLicenseNumber}
            options={driverOptions}
            isLoading={drivers.isFetching}
            emptyMessage="No registered SAP driver matched."
            onInputChange={(nextValue) =>
              onChange({
                ...line,
                driverLicenseNumber: nextValue,
              })
            }
            onSelect={(option) =>
              onChange({
                ...line,
                driverLicenseNumber: option.value,
              })
            }
          />
        </Field>

        <Field label="Vehicle (Plate)" hint="Registered SAP master vehicle" required>
          <Combobox
            aria-label={`Vehicle plate line ${index + 1}`}
            placeholder="Search vehicle plate..."
            value={line.vehiclePlateNumber}
            options={vehicleOptions}
            isLoading={vehicles.isFetching}
            emptyMessage="No registered SAP vehicle matched."
            onInputChange={(nextValue) =>
              onChange({
                ...line,
                vehiclePlateNumber: nextValue,
              })
            }
            onSelect={(option) =>
              onChange({
                ...line,
                vehiclePlateNumber: option.value,
              })
            }
          />
        </Field>

        <Field label="Remark">
          <Input
            aria-label={`Remark line ${index + 1}`}
            placeholder="Optional remark for logistics"
            value={line.remark}
            onChange={(event) =>
              onChange({
                ...line,
                remark: event.target.value,
              })
            }
          />
        </Field>
      </div>
    </div>
  )
}
