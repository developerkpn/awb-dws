# Expected SAP JSON: PO by vendor and GR quantities

The FSD is sufficient to infer the business data and draft mock JSON. It is **not a finalized API contract**: it contains no service/entity-set name, OData metadata, JSON example, property casing, or definitive response layout. All examples here are synthetic proposals, not responses captured from SAP.

Start with [expected-po-by-vendor.json](expected-po-by-vendor.json). It proposes one row per PO item with net received quantity. [proposed-response-with-context.json](proposed-response-with-context.json) adds units, ordered quantity, and incoterm for application use. [alternative-movement-response.json](alternative-movement-response.json) illustrates the other plausible interpretation: separate movement rows. [empty-response.json](empty-response.json) represents a successful collection query with no matching items.

## What the FSD actually requires

Source: [fsd-odata-po-by-vendor-v1.docx](fsd-odata-po-by-vendor-v1.docx) (PMO Functional Specification "Odata PO by Vendor dan Qty GR PO", v1), especially “Deskripsi Program”, “Proses Bisnis”, and “Tabel dan Referensi Transaksi”.

| Requirement        | Expected behavior                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor login       | Return only POs belonging to the logged-in vendor. Matching the `AT`/`BT` prefix alone is insufficient.                                |
| Vendor category    | `EKKO-LIFNR` starts with `AT` for local vendors or `BT` for import vendors.                                                            |
| Trade material     | `EKPO-MATNR` matches `8*`. Confirm whether this means the external/display material number when SAP stores leading zeros.              |
| Trade PO type      | `EKKO-BSART` matches `*10`; the document gives `EU10` as an example.                                                                   |
| PO item            | Identify each item by `EBELN` and `EBELP`, not PO number or material alone.                                                            |
| Completed delivery | Exclude items where `EKPO-ELIKZ = 'X'`.                                                                                                |
| Received quantity  | Use `MSEG-ERFMG`, described as quantity in the unit of entry.                                                                          |
| Shipped quantity   | Also provide `MSEG-LSMNG`, described by this FSD as quantity sent (`quantity Kirim`). Its calculation and unit need confirmation.      |
| Relevant movements | Include `BWART` 101 (GR), 102 (cancel GR), and 122 (return GR).                                                                        |
| Net GR             | Sum quantities for 101, subtract quantities for 102 and 122. `BWART` selects the movements; its codes are not the values being summed. |
| Incoterm           | The document says quantities should follow the incoterm but does not specify the rule or field mapping.                                |

These are selection/calculation requirements. A field used to filter records does not necessarily have to appear as a JSON property.

## Why the examples use `d.results`

SAP OData V2 services return a collection as an array in `d.results`, so the examples do the same. Decimal values come as JSON strings. Optional metadata and paging properties can also appear. See the [official OData V2 JSON format](https://www.odata.org/documentation/odata-version-2-0/json-format/).

The examples omit optional `__metadata`, `__count`, and `__next`. A client should tolerate them and follow `d.__next` if paging is enabled. Quantity scale `3` is illustrative; precision, scale, nullability, and property names must come from the new service's `$metadata`.

## Proposed aggregate response

In [expected-po-by-vendor.json](expected-po-by-vendor.json), each object is an open PO item. The first line has net received quantity `850.000`; the second line has no goods movements and is shown with zero quantities. Returning an item before its first GR is a proposed behavior needed for a PO selection list; the FSD does not explicitly define this case.

| Proposed JSON property | Source / meaning                                              | Confidence                                                                                                 |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Lifnr`                | `EKKO-LIFNR`, vendor account                                  | Vendor selection is explicit; inclusion and spelling are proposed.                                         |
| `Bsart`                | `EKKO-BSART`, PO document type                                | Filter is explicit; inclusion and spelling are proposed.                                                   |
| `Ebeln`                | PO number / `EBELN`                                           | Explicit business field.                                                                                   |
| `Ebelp`                | PO item / `EBELP`                                             | Explicit business field.                                                                                   |
| `Matnr`                | `EKPO-MATNR`, material number                                 | Explicit business field.                                                                                   |
| `Elikz`                | `EKPO-ELIKZ`, delivery-completed flag                         | Explicit filter; returning a blank flag is proposed.                                                       |
| `Erfmg`                | Net received quantity: sum of 101 minus 102 minus 122 `ERFMG` | Net GR is explicit; putting the result in `Erfmg` is proposed. ABAP may choose a name such as `QtyTerima`. |
| `Lsmng`                | Proposed net shipped quantity from `LSMNG`                    | Source field is explicit; applying the same netting formula is an assumption requiring confirmation.       |

Identifiers are strings, including the five-digit item number `"00010"`. A flag such as `Elikz` is shown as an empty string for an open item; the actual service might use a space, null, or another representation. Completed items should be absent.

There is no single `Bwart` on an aggregate row combining 101, 102, and 122. If ABAP returns `Bwart`, clarify whether the response is grouped by movement type or contains individual movements instead.

The primary mock deliberately contains no app-specific wrapper such as `success` or `message`; it shows the raw SAP response.

## Quantity example and alternative layout

The first aggregate row is based on the synthetic movements in [alternative-movement-response.json](alternative-movement-response.json):

| Movement     | Received (`Erfmg`) | Shipped (`Lsmng`) | Contribution                            |
| ------------ | -----------------: | ----------------: | --------------------------------------- |
| 101          |           1000.000 |          1100.000 | Add                                     |
| 102          |            100.000 |           150.000 | Subtract                                |
| 122          |             50.000 |            50.000 | Subtract                                |
| Proposed net |        **850.000** |       **900.000** | Per PO + item, after unit normalization |

The received calculation is grounded in the FSD. The shipped calculation above is only a mock assumption; it must not be treated as an agreed SAP rule. The received/shipped difference is synthetic and does not define an incoterm rule.

The alternative file has one row per material-document item, with proposed `Mblnr`, `Mjahr`, and `Zeile` identifiers to distinguish multiple movements for the same PO item. These identifiers are useful additions, not specified output fields. In that alternative, `Erfmg` and `Lsmng` are individual movement quantities, not net totals. Do not treat the aggregate and movement alternatives as interchangeable contracts. The movement-only file cannot represent an open PO item that has never had a movement.

Normalize units before addition or subtraction. The FSD does not say how mixed units or signed quantities should be handled. Agree whether SAP returns unsigned movement magnitudes with 102/122 subtracted once, or already signed quantities. Do not subtract a negative reversal a second time. Do not silently clamp a negative net to zero without an agreed business rule.

## Additional fields useful to the application

[proposed-response-with-context.json](proposed-response-with-context.json) extends the aggregate example with the following **proposed additions**:

| Property | Intended source / purpose                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Erfme`  | Candidate unit for `Erfmg` (`MSEG-ERFME`); the mock assumes all contributing received movements use `KG`.                              |
| `Lsmeh`  | Candidate unit for `Lsmng` (`MSEG-LSMEH`); validate this pairing and its meaning with the functional/ABAP team. The mock assumes `KG`. |
| `Menge`  | `EKPO-MENGE`, ordered quantity. Needed if the app calculates remaining quantity.                                                       |
| `Meins`  | `EKPO-MEINS`, PO order unit. Compare ordered and received quantities only after unit conversion where needed.                          |
| `Inco1`  | Candidate incoterm property. `FRC` is an illustrative value, not a code mandated by this FSD.                                          |

None of these additions is a confirmed JSON output property in the FSD.

## Illustrative request

```http
GET /sap/opu/odata/sap/<SERVICE_NAME>/<ENTITY_SET>?$filter=Lifnr%20eq%20%27AT00000001%27&$format=json
Accept: application/json
```

For one PO item, a possible filter expression is:

```text
Lifnr eq 'AT00000001' and Ebeln eq '4500000001' and Ebelp eq '00010'
```

These examples assume the service supports those filter properties. Neither the service/entity names nor the filter contract is specified in the FSD. The new service could extend the existing service, use another entity set, or expose separate PO-list and GR-quantity endpoints. Obtain the exact root and inspect `<SERVICE_ROOT>/$metadata` when available; no SAP endpoint was called for this analysis.

Vendor selection must be tied to the authenticated vendor by SAP or by a trusted application backend. A client-supplied `Lifnr` filter alone does not establish that the caller owns the vendor account. The FSD's authorization section is `N/A`, so the enforcement mechanism is unresolved.

## Confirm before integrating

1. Exact service/entity names, OData version, property names/casing, keys, and filter support.
2. One net row per PO item, one row per movement type, individual movements, or separate PO and GR endpoints? The FSD mentions both totals and `BWART` without defining the layout.
3. Does `Erfmg` mean a raw movement quantity or the net GR total? What property name carries the net result?
4. Is `Lsmng` netted using 101 minus 102 minus 122 too? Which unit and incoterm determine shipped versus received quantities? Is any additional delivery source needed?
5. How are units, decimal precision, sign conventions, missing quantities, and negative nets handled?
6. Are open items with no GR returned with zero quantities? If the app uses these results as a snapshot, how will it remove items that disappear after `ELIKZ = 'X'`? Absence alone is not an explicit close/delete event.
7. How is the logged-in vendor enforced, and are vendor/material prefix checks applied to internal SAP values or their external representations?

The field-reference tables contain inconsistencies: the narrative once says `ELIKS`, then identifies `ELIKZ`; the formula once says `MSEG-BART`, while the movement field is otherwise `BWART`. The EKPO field table also gives incompatible labels/types for fields such as `ERFMG`, `ELIKZ`, and `BWART`, and the vendor table has a mismatched field-name cell. This draft follows the narrative requirements and flags those tables for correction rather than treating their types or lengths as authoritative.

Validation: the JSON files can be parsed locally, the synthetic net totals reconcile to the movement example, and the aggregate mock contains unique PO/item pairs, only the example vendor, trade materials, trade PO types, and no completed items. No application code or configuration was changed.
