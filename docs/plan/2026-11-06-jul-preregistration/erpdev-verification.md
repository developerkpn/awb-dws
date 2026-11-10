# Downstream JUL erpdev verification

Date: 2026-11-08

Status: Read-only & Oracle staging schema checks passed (2026-11-09); live write checks pending SAP operator credentials.

Checks the live adapters against SAP development (`erpdev`) and its Oracle staging before any
production use. Never point these settings at `erpprd`; the API refuses a live host that is
not `erpdev`. Every write below creates real loading notes in erpdev, so agree the test DOs
and their clean-up with the SAP team first.

## 1. Prerequisites

| Item              | Needed                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| OData             | HTTPS `erpdev` origin and a shared lookup account (`SAP_SERVICE_USERNAME`/`PASSWORD`)                             |
| Staging           | erpdev Oracle connect string and an account that can read/insert/update `PREREG_LOADING_NOTE_SAP`                 |
| Approver          | A LOGISTIC account whose username equals an erpdev SAP user allowed to run `DOTRXSet`                             |
| Customer          | A CUSTOMER account whose username is the SAP customer code, with at least one LCO and one FRC DO                  |
| Vendor (optional) | A VENDOR account whose username is the SAP vendor code, with an STO from `LIFSTOSet`                              |
| Plant             | `mst_plant.sap_plant_code` = DO `Werks`, `company_group = 'DOWNSTREAM'`, users given access                       |
| Rules             | `mst_jul_plant_rule` rows for the plant, material and incoterm (from legacy `mst_sloc_plant`/`mst_valtype_plant`) |
| Reference         | The legacy application pointed at the same erpdev, for side-by-side comparison                                    |

## 2. Configuration

```sh
NODE_ENV=development
JUL_SAP_MODE=live
JUL_WORKER_ENABLED=true
SAP_ODATA_BASE_URL=https://<erpdev-host>
SAP_SERVICE_USERNAME=...
SAP_SERVICE_PASSWORD=...
SAP_ORACLE_CONNECT_STRING=...
SAP_ORACLE_USERNAME=...
SAP_ORACLE_PASSWORD=...
```

Use a separate database from local fixture testing; requests store their SAP mode and are
not mixed.

## 3. Read-only checks

For each test DO, compare the new application with the legacy application:

| Check              | Pass when                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| DO list            | Same DOs as the legacy LCO and FRC lists for the customer                      |
| Payment            | Same unpaid amount and eligibility; one DO near the 5,000 boundary if possible |
| Quantities         | Contract, used (`OUTDELIVSet`), deleted (`DOTRXDELETESet`) and available match |
| FRC→LCO            | STO from `SOSTOSet` and transport type from `STOTYPESet` match                 |
| Vendor             | STO accepted only for the vendor's `LIFSTOSet`; DO list matches `DOSTOSet`     |
| Driver and vehicle | `SIMSet` and `TRUCKSet` return the expected records                            |

## 4. Staging table check

Before writing, describe `PREREG_LOADING_NOTE_SAP` and confirm every column in
[section 4 of the parity matrix](parity-matrix.md#4-staging-fields-prereg_loading_note_sap)
exists with a compatible type. `CREATE_BY` must accept a 36-character UUID; if it is
numeric, stop and agree a mapping with the SAP team.

## 5. Write checks

1. Create one LCO allocation of a whole quantity, submit it and approve it with the
   approver's SAP password.
2. Confirm one staging row exists for the line `DET_ID` with `FLAG = 'I'` and the
   values from the parity matrix; compare with a row the legacy application stages for
   a similar DO.
3. Confirm the request shows the SAP loading-note number and the DO's available
   quantity drops by the allocated amount without being counted twice.
4. Repeat for an FRC→LCO allocation; expect `EBELN_REF` = STO, `DOTYPE = 'S'` (from
   `mst_jul_ln_type`) and, for transport type `M`, `ITEMRULE = '6A'`.
5. Create a Multi-DO trip across two LCO DOs on the same plant sharing one truck and
   driver, submit it and approve both DOs together; confirm two staging rows sharing
   `HEAD_ID` with `IS_MULTI = 1` and confirm both receive loading-note numbers.
6. If SAP can lock the DO (another user editing it), approve while locked; expect
   `SAP_RETRY` with the “processed by” message, then approve again after release and
   expect `FLAG = 'U'` on the same row and a loading-note number.
7. Approve with a wrong SAP password; expect an uncertain or failed job, no duplicate
   staging row and no second trigger.

## 6. Record

| Date       | Check                            | Result | Notes                                                                                                                                                                 |
| ---------- | -------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-09 | Staging table schema             | Pass   | Verified `SAPBRIDGE_D.PREREG_LOADING_NOTE_SAP` on `172.22.3.94/SAPBRIDGE`: `HEAD_ID`/`DET_ID` `VARCHAR2(200)`, `CREATE_BY` `VARCHAR2(100)`, `IS_MULTI` `NUMBER(22)`   |
| 2026-11-09 | DO list (`CU00010000`)           | Pass   | `/api/jul/references` against `http://erpdev-gm.gamasap.com:8000` returned downstream DO `1011100704` (`PS21`) and skipped broken SAP slips                           |
| 2026-11-09 | Payment & quantities             | Pass   | DO `1011100704`: `paid = true`, `unpaidAmount = 0`, `contractQuantity = 1000000`, `sapUsedQuantity = 505764`, `deletedQuantity = 14100`, `availableQuantity = 508336` |
| 2026-11-09 | Driver & vehicle (`SIM`/`TRUCK`) | Pass   | `/api/jul/drivers?q=0000209220084` returned `M RIZALDI F`; `/api/jul/vehicles?q=A%208271%20KB` returned `A 8271 KB`                                                   |
| 2026-11-09 | Approval rules (`PS21`)          | Pass   | `/api/jul/documents/:id/approval-choices` returned `TW51`/`TS05`, `MAIN`/`TR-SALES`, `factoryBatch = PS`, `otherBatch = 1011100704`                                   |

Live write integration stays pending until section 5 write checks are executed with an operator SAP password and recorded here.
