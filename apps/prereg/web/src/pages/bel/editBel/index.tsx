import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { BelPoItemChoice } from '@awb/contracts'
import { Button, Card, CardBody, CardHeader, Combobox, Field, PageHeader, Select } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import { useAuth } from '@/hooks/auth'
import {
  useBelDetail,
  useBelPoItems,
  useBelVendors,
  useCreateBel,
  useSubmitBelRegistration,
  useUpdateBel,
} from '@/hooks/bel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { BelLineDraft } from '@/types/bel'
import { ArrowLeft, Plus } from '@/ui/icons'
import { today } from '@/utils/date'
import { getErrorMessage } from '@/utils/errorHandler'
import { quantityUnits, unitsText } from '@/utils/quantity'
import BelLineEditor from '../_components/BelLineEditor'
import { BelSkeleton } from '../_components/BelSkeleton'
import BelDocumentDetails from '../_components/BelDocumentDetails'

const poLabel = (choice: BelPoItemChoice) =>
  `${choice.poNumber}/${choice.poItem} · ${choice.description}`

function emptyLine(documentId = ''): BelLineDraft {
  return {
    key: crypto.randomUUID(),
    documentId,
    driverLicenseNumber: '',
    vehiclePlateNumber: '',
    quantity: '',
    loadingDate: today(),
    mediaTransport: 'T',
    remark: '',
  }
}

export default function BelForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  useDocumentTitle(isEdit ? 'Edit BEL registration' : 'New BEL registration')

  const isVendor = user?.role === 'VENDOR'
  const detailQuery = useBelDetail(id)
  const vendorsQuery = useBelVendors(Boolean(user) && !isVendor && !isEdit)

  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [poQuery, setPoQuery] = useState<string | null>(null)
  const [lines, setLines] = useState<BelLineDraft[]>(() => [emptyLine()])
  const [initializedFor, setInitializedFor] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const effectiveVendorId = isVendor
    ? (user?.id ?? '')
    : isEdit
      ? (detailQuery.data?.vendor.id ?? '')
      : selectedVendorId

  const poItemsQuery = useBelPoItems(effectiveVendorId || undefined, Boolean(effectiveVendorId))
  const createMutation = useCreateBel()
  const updateMutation = useUpdateBel(id ?? '')
  const submitMutation = useSubmitBelRegistration()

  useEffect(() => {
    if (!isEdit && !isVendor && !selectedVendorId && vendorsQuery.data?.length === 1) {
      setSelectedVendorId(vendorsQuery.data[0]!.id)
    }
  }, [isEdit, isVendor, selectedVendorId, vendorsQuery.data])

  useEffect(() => {
    if (!isEdit || !detailQuery.data || initializedFor === detailQuery.data.id) return

    const firstDocId = detailQuery.data.lines[0]?.documentId ?? ''

    setSelectedDocumentId(firstDocId)

    setLines(
      detailQuery.data.lines.map((line) => ({
        key: line.id,
        documentId: line.documentId,
        driverLicenseNumber: line.driverLicenseNumber ?? '',
        vehiclePlateNumber: line.vehiclePlateNumber ?? '',
        quantity: line.quantity,
        loadingDate: line.loadingDate ?? today(),
        mediaTransport: (line.mediaTransport as BelLineDraft['mediaTransport']) || 'T',
        remark: line.remark ?? '',
      })),
    )

    setInitializedFor(detailQuery.data.id)
  }, [detailQuery.data, initializedFor, isEdit])

  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/forbidden" replace />
  }

  if (isEdit && detailQuery.isLoading) {
    return <BelSkeleton view="form" />
  }

  if (isEdit && detailQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit BEL registration" />
        <ErrorState
          message={getErrorMessage(detailQuery.error, 'Could not load BEL registration.')}
          onRetry={() => void detailQuery.refetch()}
        />
      </div>
    )
  }

  if (isEdit && detailQuery.data && !['DRAFT', 'REJECTED'].includes(detailQuery.data.status)) {
    return <Navigate to={`/bel/${detailQuery.data.id}`} replace />
  }

  const poChoices = poItemsQuery.data ?? []

  const editableBonusByDoc: Record<string, bigint> = {}

  if (isEdit && detailQuery.data?.status === 'DRAFT') {
    for (const existingLine of detailQuery.data.lines) {
      editableBonusByDoc[existingLine.documentId] =
        (editableBonusByDoc[existingLine.documentId] ?? 0n) + quantityUnits(existingLine.quantity)
    }
  }

  const totalByDoc = new Map<string, bigint>()

  for (const line of lines) {
    if (!line.documentId || !line.quantity) continue

    totalByDoc.set(
      line.documentId,
      (totalByDoc.get(line.documentId) ?? 0n) + quantityUnits(line.quantity),
    )
  }

  const handleDocumentChange = (docId: string) => {
    setSelectedDocumentId(docId)

    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        documentId: docId,
      })),
    )
  }

  const selectedPo = poChoices.find((choice) => choice.id === selectedDocumentId)
  const totalAllocated = selectedDocumentId ? (totalByDoc.get(selectedDocumentId) ?? 0n) : 0n

  const validateDraft = (submitImmediately: boolean): string | null => {
    if (!effectiveVendorId) return 'Select a vendor account first.'

    if (!selectedDocumentId) return 'Select a purchase order first.'

    if (!lines.length) return 'Add at least one PO allocation line.'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!

      if (!line.documentId) return `Line #${i + 1}: select a PO item.`

      if (!line.quantity || quantityUnits(line.quantity) <= 0n) {
        return `Line #${i + 1}: enter a positive quantity.`
      }

      if (submitImmediately) {
        if (!line.driverLicenseNumber.trim()) {
          return `Line #${i + 1}: driver SIM number is required.`
        }

        if (!line.vehiclePlateNumber.trim()) {
          return `Line #${i + 1}: vehicle plate number is required.`
        }

        if (!line.loadingDate) {
          return `Line #${i + 1}: loading date is required.`
        }
      }

      const selected = poChoices.find((choice) => choice.id === line.documentId)

      if (selected) {
        const bonus = editableBonusByDoc[selected.id] ?? 0n
        const available = quantityUnits(selected.availableQuantity) + bonus
        const docTotal = totalByDoc.get(selected.id) ?? 0n

        if (docTotal > available) {
          return `Line #${i + 1}: allocated quantity exceeds remaining PO balance.`
        }
      }
    }

    return null
  }

  const persist = async (submitImmediately: boolean) => {
    setFormError(null)

    const validationError = validateDraft(submitImmediately)

    if (validationError) {
      setFormError(validationError)

      return
    }

    const payload = {
      vendorId: effectiveVendorId,
      lines: lines.map((line) => ({
        documentId: line.documentId,
        driverLicenseNumber: line.driverLicenseNumber.trim() || undefined,
        vehiclePlateNumber: line.vehiclePlateNumber.trim() || undefined,
        quantity: line.quantity,
        loadingDate: line.loadingDate || undefined,
        mediaTransport: line.mediaTransport,
        remark: line.remark.trim() || undefined,
      })),
    }

    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload)

      if (submitImmediately) {
        await submitMutation.mutateAsync({
          id: saved.id,
          version: saved.version,
        })
      }

      navigate(`/bel/${saved.id}`)
    } catch (error) {
      setFormError(getErrorMessage(error, 'Failed to save BEL registration.'))
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending || submitMutation.isPending

  return (
    <form
      className="mx-auto max-w-5xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        void persist(true)
      }}
    >
      <PageHeader
        title={isEdit ? 'Edit BEL registration' : 'New BEL registration'}
        subtitle="Select a purchase order, then allocate quantities to vehicles."
        action={
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEdit ? `/bel/${id}` : '/bel')}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {formError}
        </div>
      )}

      <fieldset disabled={busy} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Purchase order</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {isVendor ? (
                <Field label="Vendor">
                  <p className="mt-2 text-sm font-semibold text-stone-900">
                    {user?.name} · {user?.username}
                  </p>
                </Field>
              ) : isEdit ? (
                <Field label="Vendor">
                  <p className="mt-2 text-sm font-semibold text-stone-900">
                    {detailQuery.data?.vendor.name} · {detailQuery.data?.vendor.username}
                  </p>
                </Field>
              ) : (
                <Field label="Vendor account" required>
                  <Select
                    aria-label="Vendor account"
                    value={selectedVendorId}
                    onChange={(event) => {
                      setSelectedVendorId(event.target.value)
                      setSelectedDocumentId('')
                      setLines([emptyLine()])
                    }}
                  >
                    <option value="">Select vendor...</option>
                    {(vendorsQuery.data ?? []).map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} · {vendor.username}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="Purchase order" required>
                <Combobox
                  aria-label="Purchase order"
                  value={poQuery ?? (selectedPo ? poLabel(selectedPo) : '')}
                  disabled={!effectiveVendorId}
                  isLoading={poItemsQuery.isLoading}
                  placeholder={
                    selectedPo ? poLabel(selectedPo) : 'Search PO number, material or plant...'
                  }
                  filterOptions
                  emptyMessage={
                    poChoices.length ? 'No PO item matches.' : 'No open PO items for this vendor.'
                  }
                  options={poChoices.map((choice) => {
                    const available =
                      quantityUnits(choice.availableQuantity) +
                      (editableBonusByDoc[choice.id] ?? 0n)

                    return {
                      value: choice.id,
                      label: poLabel(choice),
                      description: `${choice.material} · ${choice.plantName} · ${unitsText(available > 0n ? available : 0n)} ${choice.uom} remaining`,
                    }
                  })}
                  onFocus={() => setPoQuery('')}
                  onBlur={() => setPoQuery(null)}
                  onInputChange={setPoQuery}
                  onSelect={(option) => {
                    handleDocumentChange(option.value)
                    setPoQuery(null)
                  }}
                />
              </Field>
            </div>

            {effectiveVendorId && poItemsQuery.isError && (
              <ErrorState
                message={getErrorMessage(poItemsQuery.error, 'Could not load SAP PO items.')}
                onRetry={() => void poItemsQuery.refetch()}
              />
            )}

            {effectiveVendorId && !poItemsQuery.isLoading && !poChoices.length && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                No eligible open trade PO items returned for this vendor.
              </p>
            )}

            {selectedPo && (
              <BelDocumentDetails
                choice={selectedPo}
                allocated={totalAllocated}
                editableBonus={editableBonusByDoc[selectedPo.id] ?? 0n}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            action={
              selectedDocumentId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((current) => [...current, emptyLine(selectedDocumentId)])}
                >
                  <Plus className="size-4" />
                  Add allocation
                </Button>
              ) : undefined
            }
          >
            <h2 className="font-semibold text-stone-900">Allocations & transport</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {!selectedDocumentId ? (
              <p className="py-6 text-center text-sm text-stone-500">
                Choose a purchase order above to add vehicle allocations.
              </p>
            ) : (
              lines.map((line, index) => {
                const currentUnits =
                  line.documentId && line.quantity ? quantityUnits(line.quantity) : 0n

                const docTotal = line.documentId ? (totalByDoc.get(line.documentId) ?? 0n) : 0n
                const usedByOthers = docTotal > currentUnits ? docTotal - currentUnits : 0n

                return (
                  <BelLineEditor
                    key={line.key}
                    index={index}
                    line={line}
                    vendorId={effectiveVendorId || undefined}
                    poChoices={poChoices}
                    editableBonusByDoc={editableBonusByDoc}
                    usedByOtherLines={usedByOthers}
                    canRemove={lines.length > 1}
                    onChange={(nextLine) =>
                      setLines((current) =>
                        current.map((item) => (item.key === line.key ? nextLine : item)),
                      )
                    }
                    onRemove={() =>
                      setLines((current) => current.filter((item) => item.key !== line.key))
                    }
                  />
                )
              })
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => navigate(isEdit ? `/bel/${id}` : '/bel')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void persist(false)}
          >
            Save draft
          </Button>
          <Button type="submit" disabled={busy}>
            Save & submit
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
