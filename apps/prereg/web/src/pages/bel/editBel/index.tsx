import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Button, Card, CardBody, Field, FormSection, PageHeader, Select } from '@awb/ui'
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
import { ArrowLeft, Plus, Save } from '@/ui/icons'
import { today } from '@/utils/date'
import { getErrorMessage } from '@/utils/errorHandler'
import { quantityUnits, unitsText } from '@/utils/quantity'
import BelLineEditor from '../_components/BelLineEditor'
import { BelSkeleton } from '../_components/BelSkeleton'

function emptyLine(): BelLineDraft {
  return {
    key: crypto.randomUUID(),
    documentId: '',
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

  const validateDraft = (submitImmediately: boolean): string | null => {
    if (!effectiveVendorId) return 'Select a vendor account first.'

    if (!lines.length) return 'Add at least one PO allocation line.'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!

      if (!line.documentId) return `Line #${i + 1}: select a PO item.`

      if (!line.quantity || quantityUnits(line.quantity) <= 0n) {
        return `Line #${i + 1}: enter a positive quantity.`
      }

      if (submitImmediately) {
        if (!line.driverLicenseNumber.trim()) {
          return `Line #${i + 1}: select a registered driver before submitting.`
        }

        if (!line.vehiclePlateNumber.trim()) {
          return `Line #${i + 1}: select a registered vehicle before submitting.`
        }
      }
    }

    for (const [docId, requested] of totalByDoc.entries()) {
      const choice = poChoices.find((item) => item.id === docId)

      if (!choice) continue

      const maxAllowed = quantityUnits(choice.availableQuantity) + (editableBonusByDoc[docId] ?? 0n)

      if (requested > maxAllowed) {
        return `PO ${choice.poNumber}/${choice.poItem} requested total exceeds remaining quota (${unitsText(maxAllowed > 0n ? maxAllowed : 0n)} ${choice.uom}).`
      }
    }

    return null
  }

  const persist = async (submitImmediately: boolean) => {
    const validationError = validateDraft(submitImmediately)

    if (validationError) {
      setFormError(validationError)

      return
    }

    setFormError(null)

    const payload = {
      vendorId: isVendor ? undefined : effectiveVendorId,
      version: isEdit ? detailQuery.data?.version : undefined,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={isEdit ? `/bel/${id}` : '/bel'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <span className="rounded-lg bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
          No DP check · No automatic loading note
        </span>
      </div>

      <PageHeader
        title={isEdit ? `Edit ${detailQuery.data?.number ?? 'BEL'}` : 'New BEL registration'}
        subtitle="Allocate vendor PO items against open remaining SAP quantity."
      />

      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {formError}
        </div>
      )}

      <div className="space-y-6">
        <FormSection
          step="1"
          title="Vendor & PO eligibility"
          description="PO items from SAP (Bsart *10, trade materials 8*, not completed) without down-payment verification."
        >
          <div className="space-y-4">
            {isVendor ? (
              <p className="text-sm text-stone-700">
                Vendor account:{' '}
                <span className="font-semibold text-stone-900">
                  {user?.name} ({user?.username})
                </span>
              </p>
            ) : isEdit ? (
              <p className="text-sm text-stone-700">
                Vendor account:{' '}
                <span className="font-semibold text-stone-900">
                  {detailQuery.data?.vendor.name} ({detailQuery.data?.vendor.username})
                </span>
              </p>
            ) : (
              <Field label="Vendor account" required>
                <Select
                  aria-label="Vendor account"
                  value={selectedVendorId}
                  onChange={(event) => {
                    setSelectedVendorId(event.target.value)
                    setLines([emptyLine()])
                  }}
                >
                  <option value="">Select vendor...</option>
                  {(vendorsQuery.data ?? []).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.username})
                    </option>
                  ))}
                </Select>
              </Field>
            )}

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
          </div>
        </FormSection>

        <FormSection
          step="2"
          title="PO allocations & transport"
          description="Remaining PO quota = Ordered (Menge) - SAP GR (Erfmg) - Reserved in web."
        >
          <div className="space-y-4">
            {lines.map((line, index) => {
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
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => setLines((current) => [...current, emptyLine()])}
            >
              Add PO allocation line
            </Button>
          </div>
        </FormSection>

        <Card>
          <CardBody className="flex flex-wrap items-center justify-end gap-3">
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
              icon={<Save className="size-4" />}
              isLoading={busy}
              onClick={() => void persist(false)}
            >
              Save draft
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={busy}
              onClick={() => void persist(true)}
            >
              Save & submit
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
