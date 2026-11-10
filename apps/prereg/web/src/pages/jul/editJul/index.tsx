import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { JulDraftInput, JulRequestDetail, JulVariant } from '@awb/contracts'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Combobox,
  Field,
  FormError,
  Input,
  Select,
  PageHeader,
  Skeleton,
} from '@awb/ui'
import {
  useJulAction,
  useJulConfiguration,
  useJulDocumentLookup,
  useJulReferences,
  useJulRequest,
  useJulStos,
} from '@/hooks/jul'
import { useAuth } from '@/hooks/auth'
import { getErrorMessage } from '@/utils/errorHandler'
import type { EditableLine, JulConfiguration, JulDocumentOption } from '@/types/jul'
import { tomorrow } from '@/utils/date'
import ErrorState from '@/components/ErrorState'
import { ArrowLeft, Plus } from '@/ui/icons'
import { JulSkeleton } from '../_components/JulSkeleton'
import { JulLineEditor } from '../_components/JulLineEditor'
import { JulDocumentDetails } from '../_components/JulDocumentDetails'

function JulForm({ config, initial }: { config: JulConfiguration; initial?: JulRequestDetail }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isInternal = ['ADMIN', 'LOGISTIC', 'COMMERCIAL'].includes(user?.role ?? '')

  const [customerId, setCustomerId] = useState(
    initial?.customer.id ?? (isInternal ? '' : (user?.id ?? '')),
  )

  const [isMulti, setIsMulti] = useState(initial?.isMulti ?? false)
  const [sto, setSto] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [variant, setVariant] = useState<JulVariant>('LCO')
  const [selected, setSelected] = useState<JulDocumentOption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fetchingDocument, setFetchingDocument] = useState(false)

  const [lines, setLines] = useState<EditableLine[]>(
    () =>
      initial?.lines.map((line) => ({
        id: line.id,
        key: line.id,
        documentId: line.documentId,
        reference: line.referenceDocument,
        description: line.description,
        uom: line.uom,
        sapPlant: line.sapPlant,
        variant: line.variant,
        stoNumber: line.stoNumber ?? undefined,
        quantity: line.quantity,
        loadingDate: line.loadingDate ?? undefined,
        driverLicenseNumber: line.driverLicenseNumber ?? undefined,
        vehiclePlateNumber: line.vehiclePlateNumber ?? undefined,
        mediaTransport: line.mediaTransport as EditableLine['mediaTransport'],
        remark: line.remark ?? undefined,
        modes: [
          {
            code: line.mediaTransport,
            name: line.mediaTransport,
          },
        ],
      })) ?? [],
  )

  const action = useJulAction()

  const customerRole =
    config.customers.find((customer) => customer.id === customerId)?.role.code ?? user?.role

  const [stoToLoad, setStoToLoad] = useState('')

  const references = useJulReferences(
    customerId,
    stoToLoad,
    Boolean(customerId) && (customerRole !== 'VENDOR' || Boolean(stoToLoad)),
  )

  const reference = references.data?.includes(referenceText.trim()) ? referenceText.trim() : ''

  const stos = useJulStos(
    customerId,
    reference,
    Boolean(selected?.incoterm1 === 'FRC' && customerRole !== 'VENDOR'),
  )

  const lookup = useJulDocumentLookup()

  async function loadDocument(chosenSto?: string) {
    setError(null)
    setSelected(null)
    setFetchingDocument(true)

    try {
      const document = await lookup.mutateAsync({
        customerId,
        reference,
        sto: customerRole === 'VENDOR' ? stoToLoad : chosenSto,
      })

      setSelected(document)

      setVariant(
        customerRole === 'VENDOR' ? 'FRC' : document.incoterm1 === 'FRC' ? 'FRC_TO_LCO' : 'LCO',
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setFetchingDocument(false)
    }
  }

  async function save(submit: boolean) {
    setError(null)

    try {
      const data: JulDraftInput = {
        customerId,
        isMulti,
        version: initial?.version,
        lines: lines.map(
          ({
            id,
            documentId,
            variant,
            stoNumber,
            quantity,
            loadingDate,
            driverLicenseNumber,
            vehiclePlateNumber,
            mediaTransport,
            remark,
          }) => ({
            id,
            documentId,
            variant,
            stoNumber,
            quantity,
            loadingDate,
            driverLicenseNumber,
            vehiclePlateNumber,
            mediaTransport,
            remark,
          }),
        ),
      }

      let saved = await action.mutateAsync({
        path: initial ? '/' + initial.id : '',
        method: initial ? 'PUT' : 'POST',
        data,
      })

      if (submit) {
        try {
          saved = await action.mutateAsync({
            path: '/' + saved.id + '/submit',
            data: { version: saved.version },
          })
        } catch (err) {
          navigate('/jul/' + saved.id, {
            replace: true,
            state: {
              error: getErrorMessage(err),
            },
          })

          return
        }
      }

      navigate('/jul/' + saved.id, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (initial && initial.status !== 'DRAFT')
    return (
      <ErrorState
        message="Only drafts can be edited."
        onRetry={() => navigate('/jul/' + initial.id)}
      />
    )

  return (
    <form
      className="mx-auto max-w-5xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        void save(true)
      }}
    >
      <PageHeader
        title={initial ? 'Edit JUL registration' : 'New JUL registration'}
        subtitle="Select a delivery order, then allocate quantities to vehicles."
        action={
          <Button variant="ghost" onClick={() => navigate(initial ? '/jul/' + initial.id : '/jul')}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />
      <fieldset disabled={action.isPending} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Delivery order</h2>
          </CardHeader>
          <CardBody>
            <div className="grid items-end gap-4 sm:grid-cols-3">
              <Field label="Registration mode">
                <Select
                  value={isMulti ? 'multi' : 'single'}
                  disabled={Boolean(initial) || lines.length > 0}
                  onChange={(event) => setIsMulti(event.target.value === 'multi')}
                >
                  <option value="single">Single DO</option>
                  <option value="multi" disabled={customerRole === 'VENDOR'}>
                    Multi-DO (one trip)
                  </option>
                </Select>
              </Field>
              {isInternal && (
                <Field label="Customer / vendor">
                  <Select
                    value={customerId}
                    disabled={Boolean(initial) || lines.length > 0}
                    onChange={(event) => {
                      setCustomerId(event.target.value)
                      setSelected(null)
                      setReferenceText('')
                      setStoToLoad('')
                    }}
                  >
                    <option value="">Choose an account</option>
                    {config.customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} · {customer.username}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {customerRole === 'VENDOR' && (
                <Field label="STO number">
                  <div className="flex gap-2">
                    <Input
                      value={sto}
                      onChange={(event) => setSto(event.target.value)}
                      placeholder="Enter your STO"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStoToLoad(sto)
                        setSelected(null)
                        setReferenceText('')
                      }}
                    >
                      Find
                    </Button>
                  </div>
                </Field>
              )}
              <Field label="Delivery order">
                <Combobox
                  value={referenceText}
                  disabled={!customerId || references.isLoading}
                  isLoading={references.isLoading}
                  placeholder={
                    references.isLoading
                      ? 'Loading delivery orders…'
                      : 'Type or choose a delivery order'
                  }
                  filterOptions
                  emptyMessage={
                    references.data?.length
                      ? 'No delivery order matches.'
                      : 'No delivery orders available.'
                  }
                  options={(references.data ?? []).map((ref) => ({
                    value: ref,
                    label: ref,
                  }))}
                  onInputChange={(value) => {
                    setReferenceText(value)
                    setSelected(null)
                  }}
                  onSelect={(option) => {
                    setReferenceText(option.value)
                    setSelected(null)
                  }}
                />
              </Field>
              <Button
                variant="secondary"
                isLoading={fetchingDocument}
                disabled={!reference || !customerId}
                onClick={() => void loadDocument()}
              >
                Check document
              </Button>
            </div>
            {references.isError && <FormError message={getErrorMessage(references.error)} />}
            {fetchingDocument && (
              <div className="mt-5 space-y-3">
                <Skeleton
                  style={{
                    height: '1rem',
                    width: '70%',
                  }}
                />
                <Skeleton style={{ height: '4rem' }} />
              </div>
            )}
            {selected && (
              <div className="mt-5 space-y-4 rounded-lg border border-stone-200 p-4">
                <JulDocumentDetails
                  document={selected}
                  allocated={lines
                    .filter((line) => line.reference === selected.referenceDocument)
                    .map((line) => line.quantity)}
                />
                <p className={selected.paid ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}>
                  {selected.paid
                    ? 'Down payment eligible'
                    : 'Down payment is insufficient. This order cannot be registered.'}
                </p>
                <div className="flex items-end gap-3">
                  <Field label="JUL variant">
                    <Select
                      value={variant}
                      onChange={(event) => setVariant(event.target.value as JulVariant)}
                    >
                      {customerRole === 'VENDOR' ? (
                        <option value="FRC">FRC · STO {selected.stoNumber ?? 'not found'}</option>
                      ) : selected.incoterm1 === 'FRC' ? (
                        <option value="FRC_TO_LCO">
                          FRC to LCO · STO {selected.stoNumber ?? 'not found'}
                        </option>
                      ) : (
                        <option value="LCO">LCO</option>
                      )}
                    </Select>
                  </Field>
                  {selected.incoterm1 === 'FRC' && customerRole !== 'VENDOR' && (
                    <Field label="Related STO">
                      <Combobox
                        value={selected.stoNumber ?? ''}
                        disabled={stos.isLoading}
                        isLoading={stos.isLoading}
                        placeholder={stos.isLoading ? 'Loading STOs…' : 'Choose an STO'}
                        readOnly
                        emptyMessage="No STO available for this delivery order."
                        options={(stos.data ?? []).map((value) => ({
                          value,
                          label: value,
                        }))}
                        onInputChange={() => undefined}
                        onSelect={(option) => void loadDocument(option.value)}
                      />
                    </Field>
                  )}
                  <Button
                    variant="secondary"
                    disabled={
                      !selected.paid ||
                      lines.length >= 50 ||
                      (variant !== 'LCO' && !selected.stoNumber) ||
                      (isMulti && variant !== 'LCO') ||
                      (isMulti &&
                        lines.some(
                          (item) =>
                            item.reference === selected.referenceDocument ||
                            (item.sapPlant && item.sapPlant !== selected.sapPlant),
                        ))
                    }
                    onClick={() =>
                      setLines((current) => [
                        ...current,
                        {
                          key: crypto.randomUUID(),
                          documentId: selected.id,
                          variant,
                          stoNumber: selected.stoNumber ?? undefined,
                          reference: selected.referenceDocument,
                          description: selected.description,
                          uom: selected.uom,
                          sapPlant: selected.sapPlant,
                          available: selected.availableQuantity,
                          quantity: '',
                          loadingDate:
                            (isMulti ? current[0]?.loadingDate : undefined) ?? tomorrow(),
                          driverLicenseNumber: isMulti
                            ? current[0]?.driverLicenseNumber
                            : undefined,
                          vehiclePlateNumber: isMulti ? current[0]?.vehiclePlateNumber : undefined,
                          remark: isMulti ? current[0]?.remark : undefined,
                          mediaTransport:
                            (isMulti ? current[0]?.mediaTransport : undefined) ??
                            (selected.transportModes[0]?.code as EditableLine['mediaTransport']),
                          modes: selected.transportModes,
                        },
                      ])
                    }
                  >
                    <Plus className="size-4" />
                    Add allocation
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
        {isMulti && lines.length > 0 ? (
          <JulLineEditor
            line={lines[0]!}
            index={0}
            customerId={customerId}
            update={(next) =>
              setLines((current) =>
                current.map((item) => ({
                  ...item,
                  loadingDate: next.loadingDate,
                  mediaTransport: next.mediaTransport,
                  driverLicenseNumber: next.driverLicenseNumber,
                  vehiclePlateNumber: next.vehiclePlateNumber,
                  remark: next.remark,
                })),
              )
            }
            remove={() => setLines([])}
            multi={{
              lines,
              updateQuantity: (key, quantity) =>
                setLines((current) =>
                  current.map((item) =>
                    item.key === key
                      ? {
                          ...item,
                          quantity,
                        }
                      : item,
                  ),
                ),
              removeLine: (key) =>
                setLines((current) => current.filter((item) => item.key !== key)),
            }}
          />
        ) : (
          lines.map((line, index) => (
            <JulLineEditor
              key={line.key}
              line={line}
              index={index}
              customerId={customerId}
              update={(next) =>
                setLines((current) => current.map((item) => (item.key === line.key ? next : item)))
              }
              remove={() => setLines((current) => current.filter((item) => item.key !== line.key))}
            />
          ))
        )}
        {!lines.length && (
          <p className="rounded-lg border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-stone-500">
            Check a delivery order to add your first allocation.
          </p>
        )}
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            disabled={lines.length < (isMulti ? 2 : 1)}
            isLoading={action.isPending}
            onClick={() => void save(false)}
          >
            Save draft
          </Button>
          <Button
            type="submit"
            disabled={lines.length < (isMulti ? 2 : 1)}
            isLoading={action.isPending}
          >
            Submit for review
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

export default function EditJul() {
  const { id } = useParams()
  const config = useJulConfiguration()
  const request = useJulRequest(id)

  if (config.isPending || (id && request.isPending)) return <JulSkeleton view="form" />

  if (config.isError || (id && request.isError))
    return (
      <ErrorState
        message="Unable to load the JUL form."
        onRetry={() => {
          void config.refetch()
          void request.refetch()
        }}
      />
    )

  return <JulForm key={id ?? 'new'} config={config.data!} initial={request.data} />
}
