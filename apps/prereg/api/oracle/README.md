# Oracle staging (SAPBRIDGE)

Tables in the SAPBRIDGE schema that prereg writes and SAP reads. Prisma does not manage
them; each file in `migrations/` is plain Oracle DDL, applied once and in name order by a
DBA or with SQL\*Plus/SQLcl as the schema owner: `SAPBRIDGE_D` (development) first, then
`SAPBRIDGE_P` (production). Never edit an applied file; add a new one.

`PREREG_LOADING_NOTE_SAP` predates this folder and was created outside the repository.

## PREREG_DRIVER_SAP and PREREG_TRUCK_SAP

One row per license number / plate, valid for every plant (no `LOCATION`).
`PREREG_STATUS` is the approval status, written only by prereg with the same values as
the local request. The SAP flag columns keep the meaning they have in SAPBRIDGE `DRIVER`
and `TRUCK`; prereg always writes `ISACTIVE = 'TRUE'`, leaving `FALSE` for deactivation.

### Status columns

Both tables have the same status columns. The DDL also stores these descriptions as Oracle
column comments.

| Column            | Written by | Values                                                                                  |
| ----------------- | ---------- | --------------------------------------------------------------------------------------- |
| `PREREG_STATUS`   | prereg     | `SUBMITTED` waiting for Logistics · `APPROVED` send to SAP · `REJECTED` not sent to SAP |
| `FLAG`            | prereg     | `I` new record · `U` change to a record SAP already has                                 |
| `ISACTIVE`        | prereg     | `TRUE` active record (always, from prereg) · `FALSE` deactivated                        |
| `PREREG_FLAG`     | SAP        | `I` waiting for SAP · `U` created in SAP                                                |
| `ISRETRIVEDBYSAP` | SAP        | `FALSE` not retrieved yet · `TRUE` retrieved by SAP (`CHAR(5)`, stored as `'TRUE '`)    |
| `LASTUPDATE`      | SAP        | date SAP retrieved the row                                                              |
| `LASTTIME`        | SAP        | time SAP retrieved the row (`HH:MM:SS`)                                                 |

### Lifecycle

| Step                       | Written by | `PREREG_STATUS` | `PREREG_FLAG` | `ISRETRIVEDBYSAP` |
| -------------------------- | ---------- | --------------- | ------------- | ----------------- |
| Customer/vendor submits    | prereg     | `SUBMITTED`     | `I`           | `FALSE`           |
| Logistics approves         | prereg     | `APPROVED`      | `I`           | `FALSE`           |
| Logistics rejects          | prereg     | `REJECTED`      | `I`           | `FALSE`           |
| SAP has created the record | SAP        | `APPROVED`      | `U`           | `TRUE`            |

- SAP picks up only rows with `PREREG_STATUS = 'APPROVED'` and `ISRETRIVEDBYSAP = 'FALSE'`,
  and sets `LASTUPDATE`/`LASTTIME` when it retrieves them.
- A resubmission after rejection updates the same row back to the submit values.
- `FLAG` is `I` for a new record; prereg sets `U` only when it changes a record SAP already has.
- The prereg scheduler reads `ISRETRIVEDBYSAP = 'TRUE'` to mark the local driver/truck as
  available in SAP.

Columns of the source tables that prereg rows never fill (`DRIVERCODE`, `EXPDATE`,
`BLACKLIST_FLAG`, `LASTUPDATEBY`, `PREREG_INBOUND`) and the plant column `LOCATION` are
left out.

Rollback: `DROP TABLE PREREG_TRUCK_SAP; DROP TABLE PREREG_DRIVER_SAP;`

## PREREG_BEL_SAP

One row per approved BEL allocation line (`DET_ID`). Written idempotently when Logistics/Admin approves a BEL registration (with no DP check and no automatic SAP loading-note trigger). This DDL file is added to the repository only and is not executed against Oracle automatically.

### Columns

| Column             | Type / Default / Check                                                        | Written by | Meaning & Values                                                               |
| ------------------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `DET_ID`           | `VARCHAR2(200) NOT NULL` (PK)                                                 | prereg     | UUID of `awb_bel_line.id` (idempotency key per allocation line)                |
| `HEAD_ID`          | `VARCHAR2(200) NOT NULL`                                                      | prereg     | UUID of `awb_bel_registration.id`                                              |
| `REG_NUMBER`       | `VARCHAR2(60) NOT NULL`                                                       | prereg     | Human-readable BEL registration number (`BEL-YYYYMMDD-...`)                    |
| `LIFNR`            | `VARCHAR2(20) NOT NULL`                                                       | prereg     | SAP vendor code (`Lifnr`)                                                      |
| `BSART`            | `VARCHAR2(10)`                                                                | prereg     | SAP PO document type (e.g., `ZM10`, `ZR10`)                                    |
| `EBELN`            | `VARCHAR2(20) NOT NULL`                                                       | prereg     | SAP purchase order number                                                      |
| `EBELP`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | SAP purchase order item number                                                 |
| `MATNR`            | `VARCHAR2(40) NOT NULL`                                                       | prereg     | SAP material number (`8*`)                                                     |
| `WERKS`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | Destination SAP plant code                                                     |
| `INCO1`            | `VARCHAR2(10)`                                                                | prereg     | SAP Incoterm 1 (e.g., `FRC`, `CIF`)                                            |
| `PLN_MENGE`        | `NUMBER(20, 6) NOT NULL`                                                      | prereg     | Approved planned delivery quantity from open PO quota                          |
| `MEINS`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | Quantity unit of measure (e.g., `KG`)                                          |
| `CREDAT`           | `DATE`                                                                        | prereg     | Planned loading date (`tanggal muat`)                                          |
| `ZZTRANSP_TYPE`    | `VARCHAR2(10) NOT NULL`                                                       | prereg     | SAP transport mode (`T`, `V`, `R`, `P`, `L`, `E`, `A`, `W`)                    |
| `WNOSIM`           | `VARCHAR2(50) NOT NULL`                                                       | prereg     | Assigned SAP driver SIM license number                                         |
| `WNONAMA`          | `VARCHAR2(100)`                                                               | prereg     | Assigned SAP driver full name                                                  |
| `WNOPOLISI`        | `VARCHAR2(25) NOT NULL`                                                       | prereg     | Assigned SAP vehicle license plate                                             |
| `REMARK`           | `VARCHAR2(500)`                                                               | prereg     | Optional vendor or logistics remark                                            |
| `CREATE_BY`        | `VARCHAR2(100) NOT NULL`                                                      | prereg     | Username of approving Logistics/Admin operator                                 |
| `CREATE_AT`        | `TIMESTAMP NOT NULL`                                                          | prereg     | UTC timestamp of staging write/update                                          |
| `USERSAP`          | `VARCHAR2(50) NOT NULL`                                                       | prereg     | Approving operator username reference                                          |
| `PREREG_STATUS`    | `VARCHAR2(20) DEFAULT 'APPROVED' NOT NULL`, `CHECK ('APPROVED', 'CANCELLED')` | prereg     | `APPROVED` ready for SAP pickup · `CANCELLED` retracted in prereg              |
| `FLAG`             | `VARCHAR2(1) DEFAULT 'I' NOT NULL`, `CHECK ('I', 'U')`                        | prereg     | `I` data baru (new staged row) · `U` perubahan (update to existing staged row) |
| `ISACTIVE`         | `VARCHAR2(5) DEFAULT 'TRUE' NOT NULL`, `CHECK ('TRUE', 'FALSE')`              | prereg     | `TRUE` active · `FALSE` deactivated/cancelled                                  |
| `PREREG_FLAG`      | `VARCHAR2(1) DEFAULT 'I' NOT NULL`, `CHECK ('I', 'U')`                        | SAP        | `I` waiting for SAP · `U` processed by SAP                                     |
| `ISRETREIVEDBYSAP` | `VARCHAR2(5) DEFAULT 'FALSE' NOT NULL`, `CHECK ('TRUE', 'FALSE')`             | SAP        | `FALSE` belum diambil SAP · `TRUE` sudah diambil SAP                           |
| `ERRORMSG_PULL`    | `VARCHAR2(100)`                                                               | SAP        | Error message when SAP pulls rows from the staging table                       |
| `ERRORMSG_POST`    | `VARCHAR2(100)`                                                               | SAP        | Error message when SAP posts retrieved BEL data to SAP ERP                     |
| `LASTUPDATE`       | `DATE`                                                                        | SAP        | Date SAP last pulled or processed the row                                      |
| `LASTTIME`         | `VARCHAR2(8)`                                                                 | SAP        | Time SAP last pulled or processed the row (`HH:MM:SS`)                         |

### Lifecycle

| Step                         | Written by | `PREREG_STATUS` | `FLAG` | `ISACTIVE` | `PREREG_FLAG` | `ISRETREIVEDBYSAP` | Error Columns             |
| ---------------------------- | ---------- | --------------- | ------ | ---------- | ------------- | ------------------ | ------------------------- |
| Logistics approves BEL       | prereg     | `APPROVED`      | `I`    | `TRUE`     | `I`           | `FALSE`            | `NULL`                    |
| SAP pulls & fails validation | SAP        | `APPROVED`      | `I`    | `TRUE`     | `I`           | `FALSE` / `TRUE`   | `ERRORMSG_PULL` populated |
| SAP posts BEL & succeeds     | SAP        | `APPROVED`      | `I`    | `TRUE`     | `U`           | `TRUE`             | `NULL`                    |
| SAP post fails               | SAP        | `APPROVED`      | `I`    | `TRUE`     | `U` / `I`     | `TRUE`             | `ERRORMSG_POST` populated |
| Registration cancelled       | prereg     | `CANCELLED`     | `U`    | `FALSE`    | `I`           | `FALSE`            | `NULL`                    |

| Column             | Type / Default / Check                                                        | Written by | Meaning & Values                                                               |
| ------------------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `DET_ID`           | `VARCHAR2(200) NOT NULL` (PK)                                                 | prereg     | UUID of `awb_bel_line.id` (idempotency key per allocation line)                |
| `HEAD_ID`          | `VARCHAR2(200) NOT NULL`                                                      | prereg     | UUID of `awb_bel_registration.id`                                              |
| `REG_NUMBER`       | `VARCHAR2(60) NOT NULL`                                                       | prereg     | Human-readable BEL registration number (`BEL-YYYYMMDD-...`)                    |
| `LIFNR`            | `VARCHAR2(20) NOT NULL`                                                       | prereg     | SAP vendor code (`Lifnr`)                                                      |
| `BSART`            | `VARCHAR2(10)`                                                                | prereg     | SAP PO document type (e.g., `ZM10`, `ZR10`)                                    |
| `EBELN`            | `VARCHAR2(20) NOT NULL`                                                       | prereg     | SAP purchase order number                                                      |
| `EBELP`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | SAP purchase order item number                                                 |
| `MATNR`            | `VARCHAR2(40) NOT NULL`                                                       | prereg     | SAP material number (`8*`)                                                     |
| `WERKS`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | Destination SAP plant code                                                     |
| `INCO1`            | `VARCHAR2(10)`                                                                | prereg     | SAP Incoterm 1 (e.g., `FRC`, `CIF`)                                            |
| `PLN_MENGE`        | `NUMBER(20, 6) NOT NULL`                                                      | prereg     | Approved planned delivery quantity from open PO quota                          |
| `MEINS`            | `VARCHAR2(10) NOT NULL`                                                       | prereg     | Quantity unit of measure (e.g., `KG`)                                          |
| `CREDAT`           | `DATE`                                                                        | prereg     | Planned loading date (`tanggal muat`)                                          |
| `ZZTRANSP_TYPE`    | `VARCHAR2(10) NOT NULL`                                                       | prereg     | SAP transport mode (`T`, `V`, `R`, `P`, `L`, `E`, `A`, `W`)                    |
| `WNOSIM`           | `VARCHAR2(50) NOT NULL`                                                       | prereg     | Assigned SAP driver SIM license number                                         |
| `WNONAMA`          | `VARCHAR2(100)`                                                               | prereg     | Assigned SAP driver full name                                                  |
| `WNOPOLISI`        | `VARCHAR2(25) NOT NULL`                                                       | prereg     | Assigned SAP vehicle license plate                                             |
| `REMARK`           | `VARCHAR2(500)`                                                               | prereg     | Optional vendor or logistics remark                                            |
| `CREATE_BY`        | `VARCHAR2(100) NOT NULL`                                                      | prereg     | Username of approving Logistics/Admin operator                                 |
| `CREATE_AT`        | `TIMESTAMP NOT NULL`                                                          | prereg     | UTC timestamp of staging write/update                                          |
| `USERSAP`          | `VARCHAR2(50) NOT NULL`                                                       | prereg     | Approving operator username reference                                          |
| `PREREG_STATUS`    | `VARCHAR2(20) DEFAULT 'APPROVED' NOT NULL`, `CHECK ('APPROVED', 'CANCELLED')` | prereg     | `APPROVED` ready for SAP pickup · `CANCELLED` retracted in prereg              |
| `FLAG`             | `VARCHAR2(1) DEFAULT 'I' NOT NULL`, `CHECK ('I', 'U')`                        | prereg     | `I` data baru (new staged row) · `U` perubahan (update to existing staged row) |
| `ISACTIVE`         | `VARCHAR2(5) DEFAULT 'TRUE' NOT NULL`, `CHECK ('TRUE', 'FALSE')`              | prereg     | `TRUE` active · `FALSE` deactivated/cancelled                                  |
| `PREREG_FLAG`      | `VARCHAR2(1) DEFAULT 'I' NOT NULL`, `CHECK ('I', 'U')`                        | SAP        | `I` waiting for SAP · `U` processed by SAP                                     |
| `ISRETREIVEDBYSAP` | `VARCHAR2(5) DEFAULT 'FALSE' NOT NULL`, `CHECK ('TRUE', 'FALSE')`             | SAP        | `FALSE` belum diambil SAP · `TRUE` sudah diambil SAP                           |
| `ERRORMSG_PULL`    | `VARCHAR2(100)`                                                               | SAP        | Error message when SAP pulls rows from the staging table                       |
| `ERRORMSG_POST`    | `VARCHAR2(100)`                                                               | SAP        | Error message when SAP posts retrieved BEL data to SAP ERP                     |
| `LASTUPDATE`       | `DATE`                                                                        | SAP        | Date SAP last pulled or processed the row                                      |
| `LASTTIME`         | `VARCHAR2(8)`                                                                 | SAP        | Time SAP last pulled or processed the row (`HH:MM:SS`)                         |

### Lifecycle

| Step                         | Written by | `PREREG_STATUS` | `FLAG` | `ISACTIVE` | `PREREG_FLAG` | `ISRETREIVEDBYSAP` | Error Columns             |
| ---------------------------- | ---------- | --------------- | ------ | ---------- | ------------- | ------------------ | ------------------------- |
| Logistics approves BEL       | prereg     | `APPROVED`      | `I`    | `TRUE`     | `I`           | `FALSE`            | `NULL`                    |
| SAP pulls & fails validation | SAP        | `APPROVED`      | `I`    | `TRUE`     | `I`           | `FALSE` / `TRUE`   | `ERRORMSG_PULL` populated |
| SAP posts BEL & succeeds     | SAP        | `APPROVED`      | `I`    | `TRUE`     | `U`           | `TRUE`             | `NULL`                    |
| SAP post fails               | SAP        | `APPROVED`      | `I`    | `TRUE`     | `U` / `I`     | `TRUE`             | `ERRORMSG_POST` populated |
| Registration cancelled       | prereg     | `CANCELLED`     | `U`    | `FALSE`    | `I`           | `FALSE`            | `NULL`                    |

Rollback: `DROP TABLE PREREG_BEL_SAP;`
