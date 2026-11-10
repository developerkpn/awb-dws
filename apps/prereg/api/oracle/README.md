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
