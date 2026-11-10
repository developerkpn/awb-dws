# Downstream JUL parity matrix

Date: 2026-11-08

Compares the legacy preregistration reference (branch `dev_1.3.1/bc` at `2b34bc1`, plus
`dev_1.3.0/multi_ln` at `8a445a2` for the multi-DO staging write and the two `production`
commits per K-18) with the AWB-DWS implementation in `apps/prereg/api/src/modules/jul` and
`modules/sap`. Static review only; no SAP, Oracle or legacy system was called. Live behavior
is checked separately in [erpdev-verification.md](erpdev-verification.md).

## 1. Paths

| Legacy page (route)                             | Who                  | DO source                                  | STO                                         | New variant                |
| ----------------------------------------------- | -------------------- | ------------------------------------------ | ------------------------------------------- | -------------------------- |
| `LoadingNoteForm` (`loco/create`)               | Customer             | `DOKUNNRSet` + `ZSLIPSet` `Inco1 = LCO`    | none                                        | `LCO`                      |
| `LoadingNoteFormLOCOFRC` (`locofranco/create`)  | Customer             | `DOKUNNRSet` + `ZSLIPSet` `Inco1 = FRC`    | first `SOSTOSet` row for the DO             | `FRC_TO_LCO`               |
| `LoadingNoteFormFRC` (`franco/create`)          | Vendor               | `DOSTOSet` for the STO; no incoterm filter | entered, checked with `LIFSTOSet` (`Lifnr`) | `FRC`                      |
| `FormCreateLoadingNote` (`osreq`)               | Logistics            | submitted lines (`cur_pos = FINA`)         | from the line                               | review page                |
| `MultiLNLOCO` (`multilocodws`) / `PushSAPMulti` | Customer / Logistics | ≥ 2 distinct DOs on the same plant         | from each DO                                | `isMulti = true` trip mode |

Every DO list also keeps only DOs whose company group (`mst_company.group_comp` by the
first two `Werks` characters) is DOWNSTREAM. The new list applies the same incoterm rule and
uses `mst_plant.company_group` of the mapped SAP plant in live mode. A customer cannot choose
plain `FRC`, and a vendor can only choose `FRC`, as in the legacy pages.

In multi-DO mode (`isMulti = true`), one truck trip (`driverLicenseNumber`,
`vehiclePlateNumber`, `loadingDate`, `mediaTransport`) carries at least two distinct DOs on
the same plant. Logistics approves all pending DOs on the trip together, and one staging row
is written per DO sharing `HEAD_ID` with `IS_MULTI = 1`.

## 2. Lookups and calculations

| Rule              | Legacy                                                                    | New                                                         | Result               |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| Payment           | `ZTTLPROF − Σ(WRBTR + ZPIPH + ZPIPN)`, `.`/`,` stripped; paid when ≤ 5000 | same stripping with integers; `unpaid <= 5000n`             | same                 |
| Contract quantity | `ZSLIPSet.Kwmeng`                                                         | same, exact decimals                                        | same                 |
| SAP used          | `Σ(LLfimg ≠ 0 ? LLfimg : PlnLfimg)` over `OUTDELIVSet`                    | same                                                        | same (tested)        |
| Deleted           | `Σ PlnLfimg` over `DOTRXDELETESet` by `VbelnRef`                          | same                                                        | same (tested)        |
| Web reserved      | active lines without LN for the DO                                        | draft, submitted, retry, in-flight and unconfirmed lines    | same, plus see 7     |
| Hold              | `mst_contract.hold_qty`                                                   | `mst_jul_hold` per DO with reason and actor                 | same value           |
| Available         | contract − (used − deleted) − reserved − hold                             | same                                                        | same                 |
| Storage location  | `mst_sloc_plant` by plant, material, incoterm; first FAC and first OTH    | `mst_jul_plant_rule` by plant, material, incoterm           | same; data to import |
| Valuation type    | `mst_valtype_plant`; first FAC and first OTH                              | `mst_jul_plant_rule`                                        | same; data to import |
| Batch             | downstream: factory = company code, other party = DO number               | same                                                        | same                 |
| Transport mode    | `mst_key` type `MEDTP`, active rows; default `T`; only Truck active       | `mst_jul_transport_mode`, same codes and flags; default `T` | same                 |
| Driver / vehicle  | `SIMSet` (`Snosim` or `Snama`), `TRUCKSet` (`Nnopolisi`)                  | same, checked again on the server at submission             | same                 |

`SLOCSet` and `VALTYPESet` exist in the legacy code, but the active Logistics form uses the
local tables above (`/master/slocdb`, `/master/valtypedb`).

## 3. States

| Legacy                                       | New line status            | Notes                                               |
| -------------------------------------------- | -------------------------- | --------------------------------------------------- |
| saved, `cur_pos = INIT`                      | `DRAFT`                    | customer can edit                                   |
| sent to Logistics, `cur_pos = FINA`          | `SUBMITTED`                | rechecked: DP, quantity, SAP driver/vehicle         |
| `push_sap_date` set, no LN                   | `APPROVED` → `SAP_PENDING` | staging written, `DOTRXSet` triggered               |
| trigger result unknown (queue, no outcome)   | `SAP_UNKNOWN`              | reconciled from staging, never re-triggered blindly |
| error containing “processed by”/“process by” | `SAP_RETRY`                | stays reserved, error shown, Logistics pushes again |
| other error, `is_active = false`             | `SAP_FAILED`               | quantity released; create a new request             |
| `ln_num` set                                 | `COMPLETED`                | end of the downstream JUL flow                      |
| cancelled, `is_active = false`               | `CANCELLED`                | reason required                                     |
| cleanup, `is_active = false`                 | `EXPIRED`                  | see section 6                                       |

## 4. Staging fields (`PREREG_LOADING_NOTE_SAP`)

| Field             | Legacy source                              | New source                                                        | Same             |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------- | ---------------- |
| `HEAD_ID`         | header UUID                                | registration UUID                                                 | yes              |
| `DET_ID`          | line UUID                                  | line UUID                                                         | yes              |
| `BUKRS`           | company code (`Werks` first 2)             | `Werks` first 2                                                   | yes              |
| `UPLOADID`        | `'1'`                                      | `'1'`                                                             | yes              |
| `DOTYPE`          | `ln_type` by incoterm + DOWNSTREAM (`'S'`) | `mst_jul_ln_type` (`LCO -> 'S'`, `FRC -> 'S'`)                    | yes              |
| `ITEMRULE`        | `'6A'` when STO and type `M`, else rule    | same                                                              | yes              |
| `VBELN_REF`       | DO                                         | DO                                                                | yes              |
| `EBELN_REF`       | STO or empty                               | STO or null                                                       | yes              |
| `POSNR`           | `'000010'`                                 | `'000010'`                                                        | yes              |
| `CREDAT`          | loading date (`tanggal_surat_jalan`)       | loading date                                                      | yes              |
| `MATNR`           | material                                   | material                                                          | yes              |
| `PLN_LFIMG`       | `parseInt(plan_qty)`                       | decimals accepted at input, truncated to whole number at approval | yes              |
| `DWERKS`/`RWERKS` | both = DO plant                            | both = DO `Werks`                                                 | yes              |
| `DLGORT`/`RLGORT` | Logistics FAC/OTH storage                  | same                                                              | yes              |
| `ZZTRANSP_TYPE`   | transport mode                             | transport mode                                                    | yes              |
| `WANGKUTAN`       | `''`                                       | `''`                                                              | yes              |
| `WNOSIM`          | driver license                             | driver license                                                    | yes              |
| `WNOPOLISI`       | plate                                      | plate (upper case)                                                | yes              |
| `L_LFIMG`         | `0`                                        | `0`                                                               | yes              |
| `OP_LFIMG`        | `0`                                        | `0`                                                               | yes              |
| `DOPLINE`         | `'0000'`                                   | `'0000'`                                                          | yes              |
| `VSLCD`/`VOYNR`   | `''`                                       | `''`                                                              | yes              |
| `DCHARG_1`        | factory batch                              | factory batch                                                     | yes              |
| `RCHARG_1`        | other-party batch                          | other-party batch                                                 | yes              |
| `DBWTAR`          | factory valuation                          | factory valuation                                                 | yes              |
| `RBWTAR_1`        | other-party valuation                      | other-party valuation                                             | yes              |
| `CREATE_BY`       | legacy numeric user id                     | approver UUID                                                     | verify on erpdev |
| `CREATE_AT`       | now                                        | now (UTC timestamp)                                               | yes              |
| `ISACTIVE`        | `'TRUE'`                                   | `'TRUE'`                                                          | yes              |
| `FLAG`            | `'I'`; `'U'` when re-pushed                | same                                                              | yes              |
| `ISRETRIVEDBYSAP` | `'FALSE'`                                  | `'FALSE'`                                                         | yes              |
| `USERSAP`         | approver username                          | approver username                                                 | yes              |
| `IS_MULTI`        | `1` on multi-DO rows; omitted on single    | same                                                              | yes              |

Re-push updates the same `DET_ID` row with all fields and `FLAG = 'U'`, only while
`LOADING_NOTE_NUM` is empty. A first push inserts only when no row exists for `DET_ID`.

## 5. Trigger and reconciliation

| Step           | Legacy                                                           | New                                                                        |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Credentials    | approver username + password from the approval request           | same; password used in memory only (K-22, K-35)                            |
| Trigger        | `GET DOTRXSet` queued, outcome only logged                       | `GET DOTRXSet` with timeout; failure or timeout = uncertain, no re-trigger |
| Result read    | `LOADING_NOTE_NUM`, `ERRORDESCRIPTION` by `DET_ID`               | same                                                                       |
| LN found       | save LN; `FLAG_WEB_PULL = 'T'`                                   | same                                                                       |
| Final error    | inactive line; `FLAG_WEB_PULL = 'T'`, `ISRETRIVEDBYSAP = 'TRUE'` | `SAP_FAILED`; same staging update                                          |
| “processed by” | keep active, show error; `FLAG_WEB_PULL = 'T'`                   | `SAP_RETRY`; same staging update; polling continues                        |
| Notifications  | emails to creator, updater, weighbridge and managers             | none yet (email delivery is deferred)                                      |

## 6. Expiry and cancellation

Legacy cleanup deactivates active lines without LN when today is later than the loading
date (or creation date) plus 7 days. The new worker expires draft, submitted and retry lines
on the same rule. Lines still being processed by SAP are not expired until their result is
known. Cancellation covers draft, submitted, retry and failed lines and requires a reason.

## 7. Intentional differences

| Difference                                                                   | Reason                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Multi-DO staging and reconciliation bugs on `bc` are not copied              | `bc` commented out `PushSAPMulti` and broke `SAPGetterChores` (`row.is_multi` undefined)          |
| DP, quantity, plant, trip rules and role are rechecked on the server         | Legacy trusted `is_paid`, same-plant checks and other fields posted by the browser                |
| Reservations are locked per DO and exclude the draft's own rows on edit      | Prevents concurrent overbooking and fixes legacy multi-DO edit counting previous quantities twice |
| Lines whose LN already appears in `OUTDELIVSet` are not counted twice        | Legacy counted them as both SAP-used and web-reserved until reconciled                            |
| An approver cannot start a new SAP job while their previous one is in flight | `DOTRXSet` processes the operator's staged rows; avoids ambiguous outcomes                        |
| Request history and actor are stored per action                              | Audit requirement in the plan                                                                     |

## 8. Not implemented

- Email notifications for created, failed and cancelled loading notes.
- Upstream JUL, `PREREG_LOADING_NOTE_SAP_UPS`, weighbridge data and loading-note deletion.
- BEL (planned separately).

## 9. To confirm on erpdev

- `CREATE_BY` column type accepts a UUID.
- Logistics usernames equal their SAP user IDs.
- Plant mapping (`sap_plant_code`, `company_group`) and rule tables are filled from the
  legacy `mst_company`, `mst_sloc_plant` and `mst_valtype_plant` data.
- Vendor STO DOs and their incoterms match the legacy `franco` list.
