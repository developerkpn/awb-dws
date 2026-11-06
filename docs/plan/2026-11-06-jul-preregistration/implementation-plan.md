# Downstream JUL preregistration implementation plan

Date: 2026-11-06

Status: Planned; implementation has not started.

## Goal and boundaries

Implement the existing downstream JUL business process with the same active SAP/OData services,
filters, field mappings, calculations and processing sequence. The UI and internal
implementation may change; business behavior must remain equivalent. Any necessary
business-rule change must be identified and agreed before implementation.

- Scope ends when SAP confirms automatic loading-note creation and the application
  records and displays the returned loading-note number. Staging or triggering SAP
  alone does not complete the flow.
- Include downstream LOCO, FRC and applicable STO variants. Upstream logic is excluded.
- Inventory existing downstream JUL multi-DO behavior too; do not silently exclude a JUL path
  because a previous general scope note deferred multi-DO. Record incomplete legacy
  paths as gaps rather than inventing successful behavior. Standalone tolling is a
  separate process.
- Post-creation deletion, weighbridge synchronization, plant delivery, QR and later
  operational workflows are outside this plan.
- BEL follows later: PO input, no DP check and no automatic loading-note creation.
- Use the current account design: partner SAP code is the username in `mst_user`;
  do not restore retired roles, partner-link tables or `mst_city`.
- OTP and email delivery remain deferred. Development notifications use console logs.
- This plan and initial implementation use static analysis and synthetic fixtures.
  Do not call SAP, Oracle staging, plant databases or the legacy application.
- If SAP testing is subsequently undertaken, configure `erpdev` as the host while
  preserving service paths. Do not automatically fall back to `erpprd`.

## Reference baseline

Business reference: legacy preregistration source at commit
`51bd54f83a8f875efec63dcbe81aea320df0cd2e`. Target baseline: AWB-DWS `86f61f9`.
These references describe source code, not a verified live SAP contract. No SAP
metadata or production responses have been fetched.

| Area                                                     | Source                                                                                                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DO lookup, payment checks, storage and valuation lookups | [MasterModel.js](../../../../customer_prereg/models/MasterModel.js), [MasterController.js](../../../../customer_prereg/controllers/MasterController.js)                            |
| Outstanding quantity                                     | [OSCheck.js](../../../../customer_prereg/helper/OSCheck.js)                                                                                                                        |
| Request persistence, approval, staging and cancellation  | [LoadingNoteModel.js](../../../../customer_prereg/models/LoadingNoteModel.js)                                                                                                      |
| SAP processing trigger                                   | [LoadingNoteController.js](../../../../customer_prereg/controllers/LoadingNoteController.js)                                                                                       |
| SAP result reconciliation                                | [SAPGetterChores.js](../../../../customer_prereg/helper/SAPGetterChores.js)                                                                                                        |
| Uncreated request expiry                                 | [Cleanup.js](../../../../customer_prereg/helper/Cleanup.js)                                                                                                                        |
| Customer and Logistics interactions                      | [Loading-note pages](../../../../customer_prereg/frontend/src/pages/loadingnote), [Logistics form](../../../../customer_prereg/frontend/src/pages/osreq/FormCreateLoadingNote.jsx) |
| Multi-DO behavior and incomplete paths                   | [MultiLoadingNoteModel.js](../../../../customer_prereg/models/MultiLoadingNoteModel.js), [Multi-DO pages](../../../../customer_prereg/frontend/src/pages/multiloadingnote)         |

The target currently has account/session security, driver/vehicle models and private
uploads. Its preregistration repository is an in-memory scaffold; the transaction
workflow, persistent transaction tables and completed screens still need implementation.
Driver/vehicle master approval and a JUL loading-note request are distinct workflows.

## Business flow to preserve

### 1. Select the customer document

- Resolve the customer from the authenticated SAP-code username. Internal operators
  may select a customer only when their server-side permissions allow it.
- List eligible DOs; preserve incoterm and company-group filtering.
- Load the DO/SO reference and contract number separately. Preserve their original
  SAP meanings instead of treating every reference as an interchangeable contract ID.
- Retain material, description, contract quantity/UOM, plant/company, incoterms,
  item rule, invoice type and invoice tolerances.
- Follow the existing FRC/STO relationships and transport-type rules where applicable.

### 2. Check DP/payment eligibility

Use the downstream payment rule:

```text
paidAmount = SUM(WRBTR + ZPIPH + ZPIPN)
unpaidAmount = ZTTLPROF - paidAmount
eligible = unpaidAmount <= 5000
```

Preserve the inclusive `5000` boundary. Do not replace it with a generic “DP exists” check.

Keep monetary calculations on the server. Document and test SAP number formatting,
currency/scale and rounding before replacing legacy separator-stripping logic.
Empty or invalid SAP data must not be interpreted as payment approval.

### 3. Calculate available quantity

The downstream rule is:

```text
sapUsed = SUM(LLfimg != 0 ? LLfimg : PlnLfimg)
available = contractQty - (sapUsed - deletedQty) - webReservedQty - holdQty
SUM(requestedQty) <= available
```

- `deletedQty` comes from SAP loading-note deletions.
- Legacy web reservations include active lines without a loading-note number,
  including saved lines still in the customer position.
- Held quantity is an operator-maintained allocation separate from SAP usage.
- Use precise quantities and preserve UOM. Do not silently truncate decimals or add
  invoice tolerances to available quantity.
- On edit, replace the request's own reservation rather than subtracting it twice.
- Serialize competing allocations for the same SAP reference and reconcile SAP/web
  reservations to prevent overbooking and duplicate counting during synchronization.

### 4. Save and submit the request

- Save a header/document snapshot and truck lines with UUID identities.
- Each line retains driver/SIM, vehicle/plate, transport mode, loading date,
  planned quantity, remarks and applicable related references.
- Preserve loading-date and required-field validation on the server as well as the UI.
- Legacy customer position is `INIT`; explicit submission moves it to Logistics
  position `FINA`. Saving alone does not approve or create an SAP loading note.
- Record submission actor/time and prevent unauthorized edits after submission.
- Preserve the legacy expiry boundary: an active line without an LN becomes eligible
  for expiry when the current date is later than loading date, or creation date when
  absent, plus seven days. Resolve in-flight SAP cases before releasing allocations.

### 5. Logistics review

- Show the submitted lines and their current document/payment/quantity context.
- Allow permitted selection of factory/other-party storage locations, valuation
  types and batches. Preserve the factory/other-party indicators returned by SAP.
- Recheck eligibility and reservations before approving; do not trust posted
  `is_paid`, plant, role or contract fields from the browser.
- Support line outcomes, partial batch success and cancellation with a reason.
- Keep decision history, actor/time and the exact approved data version.

### 6. Automatically create the downstream JUL loading note

The downstream creation path is:

```text
Logistics approval
  -> write PREREG_LOADING_NOTE_SAP staging record
  -> trigger DOTRXSet using the approving operator's SAP credentials
  -> SAP processes staging
  -> reconcile LOADING_NOTE_NUM or ERRORDESCRIPTION by DET_ID
  -> persist and display the confirmed loading-note number
  -> downstream JUL flow complete
```

Preserve mappings including `HEAD_ID`, `DET_ID`, `BUKRS`, `DOTYPE`, `ITEMRULE`,
`VBELN_REF`, `EBELN_REF`, `POSNR`, `CREDAT`, `MATNR`, `PLN_LFIMG`, plant/storage
fields, transport mode, driver/plate, batches, valuation types and operator identity.
Retain the existing STO transport-type overrides, including the applicable `T`/`6A`
mapping. Build a complete field-by-field parity fixture before writing the adapter.

- Approval, staging and SAP success are different events. Do not display a created
  loading note until its result is confirmed.
- Correlate by line identity/version; prevent duplicate staging and unsafe retries.
- Persist integration intent in the application transaction. A durable worker handles
  external writes and reconciliation; two database commits are not one atomic commit.
- Keep business status separate from integration status, including an uncertain
  outcome when SAP may have processed a timed-out request.
- Preserve existing handling of transient “processed by” errors versus final errors,
  while documenting the exact recovery behavior in tests.
- SAP errors, pending results and uncertain outcomes remain visible and recoverable;
  none of them count as completed loading-note creation.
- Do not implement upstream staging tables, upstream weighbridge calculations or
  local `LCO/...` numbering. Downstream uses the number confirmed by SAP.

## Existing SAP/OData mapping

Service root: `/sap/opu/odata/sap/ZGW_REGISTRA_SRV/`.
Legacy JSON requests generally use `$format=json` and read `d.results`.
Only the configured host changes for development; preserve service/entity names,
property casing, filter semantics, identifiers and response mappings.

| Entity set       | Existing purpose and filter properties          |
| ---------------- | ----------------------------------------------- |
| `DOKUNNRSet`     | Customer DO list; `Kunnr`                       |
| `ZSLIPSet`       | Document/contract details; `Vbeln`              |
| `ZPINOSet`       | Payment rows; `Vbeln`                           |
| `OUTDELIVSet`    | Planned/actual SAP consumption; `Vbeln`         |
| `DOTRXDELETESet` | Deleted loading-note quantities; `VbelnRef`     |
| `DOKUNNRSTOSet`  | Customer/DO STO list; `Vbeln`, `Kunnr`          |
| `SOSTOSet`       | STO lookup from DO; `Bednr`                     |
| `DOSTOSet`       | Related DOs/STO validation; `Ebeln`             |
| `LIFSTOSet`      | Vendor/STO validation; `Lifnr`, `Ebeln`         |
| `STOTYPESet`     | STO transport type; `Ebeln`                     |
| `SLOCSet`        | Storage-location choices; `Plant`, `Itemrule`   |
| `VALTYPESet`     | Valuation types; `Matnr`, `Plant`               |
| `SIMSet`         | Existing SAP driver lookup; `Snosim` or `Snama` |
| `TRUCKSet`       | Existing SAP vehicle lookup; `Nnopolisi`        |
| `DOTRXSet`       | Trigger SAP processing of staged records        |

`DOTRXSet` mutates business data even though the legacy code calls it with HTTP GET.
Classify it as a command, never as a cacheable/read-only lookup, and never retry an
uncertain result blindly.

`DOTRXDELETESet` remains a read dependency for the available-quantity calculation;
reading existing deleted quantities does not add a deletion workflow. Creation
results come from the staging records. Post-creation services such as
`DOTRXDELDOCSet`, `QQWBSet` and `QTYPLANSet` are outside this implementation.

Ordinary lookups use configured shared SAP credentials. Approval processing uses
the approving operator's SAP identity under the existing architecture decision.
Keep credentials server-side and out of fixtures, logs, browser storage and job
payloads. Finalize how workers obtain short-lived approval credentials before live
integration; do not copy the legacy cookie trust or credential-storage shortcuts.

Local master/batch/hold lookups and Oracle staging are also part of the inventory;
they are not replacement OData services. Do not invent a new SAP create API in place
of staging. Inspect any additional active JUL dependency found during implementation
and add it to this mapping before changing the flow.

## Implementation phases

### Phase 1: Freeze the parity specification

- [ ] Trace each active customer and Logistics route to its controller/model and UI.
- [ ] Build a matrix for downstream LOCO/FRC, applicable STO and downstream JUL multi-DO paths.
- [ ] Record calculations, state transitions, field mappings, side effects and error outcomes.
- [ ] Separate working paths from commented RFC code, obsolete handlers and broken paths.
- [ ] Resolve ambiguous numeric formats, document-item identity and retry semantics.
- [ ] Add synthetic OData/staging fixtures and expected business outcomes.

### Phase 2: Implement persistence and business rules

- [ ] Add UUID-based preregistration headers/lines, snapshots, decisions, holds/reservations,
      integration jobs and audit records using the established table naming conventions.
- [ ] Reuse current users, plants, drivers, vehicles and private documents where appropriate.
- [ ] Replace the in-memory transaction repository with persistent repositories.
- [ ] Implement lookup/save/edit/submit/review and pre-creation cancellation with typed contracts.
- [ ] Enforce ownership, plant permissions, state transitions and idempotency on the server.
- [ ] Add reservation locking and indexes for customer, plant, state, document and date queries.
- [ ] Keep list responses bounded, sortable and paginated on the server, default 20 rows.

### Phase 3: Implement the JUL UI

- [ ] Add customer request lists/forms and Logistics review using the documented frontend structure.
- [ ] Use shared buttons, inputs, dialogs, MUI icons, themes and matching skeletons.
- [ ] Show payment status, available/reserved/held quantities and loading-note processing outcomes.
- [ ] Preserve draft edits, display line-level failures and prevent duplicate submissions.
- [ ] Add request history and pre-creation cancellation without native browser confirmations.
- [ ] End the successful flow by displaying the confirmed SAP loading-note number.

### Phase 4: Implement integration adapters and reconciliation

- [ ] Create typed SAP lookup adapters preserving the existing OData contracts.
- [ ] Create downstream staging/trigger/result adapters through confirmed LN creation.
- [ ] Use durable jobs with correlation, bounded retries and explicit uncertain outcomes.
- [ ] Reconcile creation results and quantity reservations with duplicate protection.
- [ ] Keep every external adapter mocked/disabled by default during development and tests.
- [ ] Prepare a separate `erpdev` verification procedure; this plan does not run it.

### Phase 5: Verify and document

- [ ] Test downstream payment amounts below, at and above the `5000` boundary.
- [ ] Test zero/nonzero actual quantities, deletions, holds, expiry and request edits.
- [ ] Test concurrent reservations, repeated approval, partial failures, worker restarts and timeouts.
- [ ] Verify staging payloads and each in-scope downstream JUL variant against the parity matrix.
- [ ] Test authorization and attempts to forge customer/payment/quantity/role data.
- [ ] Run browser checks from customer entry through Logistics approval to a confirmed SAP LN
      using synthetic SAP/staging responses, including failures and pending results.
- [ ] Verify the flow contains no upstream branch or post-creation operational steps.
- [ ] Confirm automated checks cannot contact external SAP/staging/plant systems.
- [ ] Run formatting, lint, type checks, architecture/document checks, API tests and builds.
- [ ] Update technical documentation and business progress when implementation actually changes them.

## Completion criteria

Downstream JUL is complete when each in-scope legacy business scenario has a documented
equivalent and a passing test; SAP contracts and staging mappings remain unchanged;
and the UI works from document selection through confirmed automatic loading-note
creation. The successful flow ends after the returned SAP LN number is persisted
and displayed. Offline tests establish behavior
against source-derived fixtures, not live SAP compatibility. Live integration remains
unverified until a separately controlled development-environment check is completed.

BEL implementation remains outside this plan. Its later policy will share general
request/review infrastructure while requiring PO input and bypassing the JUL DP and
automatic loading-note steps.
