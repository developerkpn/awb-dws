-- Vendor pre-registration (BEL) staging between prereg and SAP (SAPBRIDGE).
-- Patterned after PREREG_DRIVER_SAP. Logistics approval writes approved BEL allocations with
-- no SAP DP check and no automatic loading-note trigger (DOTRXSet). SAP picks up active approved
-- rows with ISRETREIVEDBYSAP = 'FALSE', updates pull/post status and records any error messages.
-- NOTE: DDL only in codebase; do not auto-execute against Oracle databases.

CREATE TABLE PREREG_BEL_SAP (
  DET_ID           VARCHAR2(200)  NOT NULL,
  HEAD_ID          VARCHAR2(200)  NOT NULL,
  REG_NUMBER       VARCHAR2(60)   NOT NULL,
  LIFNR            VARCHAR2(20)   NOT NULL,
  BSART            VARCHAR2(10),
  EBELN            VARCHAR2(20)   NOT NULL,
  EBELP            VARCHAR2(10)   NOT NULL,
  MATNR            VARCHAR2(40)   NOT NULL,
  WERKS            VARCHAR2(10)   NOT NULL,
  INCO1            VARCHAR2(10),
  PLN_MENGE        NUMBER(20, 6)  NOT NULL,
  MEINS            VARCHAR2(10)   NOT NULL,
  CREDAT           DATE,
  ZZTRANSP_TYPE    VARCHAR2(10)   NOT NULL,
  WNOSIM           VARCHAR2(50)   NOT NULL,
  WNONAMA          VARCHAR2(100),
  WNOPOLISI        VARCHAR2(25)   NOT NULL,
  REMARK           VARCHAR2(500),
  CREATE_BY        VARCHAR2(100)  NOT NULL,
  CREATE_AT        TIMESTAMP      NOT NULL,
  USERSAP          VARCHAR2(50)   NOT NULL,
  PREREG_STATUS    VARCHAR2(20)   DEFAULT 'APPROVED' NOT NULL, -- APPROVED | CANCELLED (prereg)
  FLAG             VARCHAR2(1)    DEFAULT 'I'        NOT NULL, -- I data baru | U perubahan (prereg)
  ISACTIVE         VARCHAR2(5)    DEFAULT 'TRUE'     NOT NULL, -- TRUE aktif | FALSE dibatalkan (prereg)
  PREREG_FLAG      VARCHAR2(1)    DEFAULT 'I'        NOT NULL, -- I menunggu | U diproses (SAP)
  ISRETREIVEDBYSAP VARCHAR2(5)    DEFAULT 'FALSE'    NOT NULL, -- FALSE belum diambil | TRUE sudah diambil SAP
  ERRORMSG_PULL    VARCHAR2(100),                              -- pesan error saat SAP mengambil data
  ERRORMSG_POST    VARCHAR2(100),                              -- pesan error saat SAP memposting data
  LASTUPDATE       DATE,                                       -- tanggal terakhir diambil/diproses SAP
  LASTTIME         VARCHAR2(8),                                -- waktu terakhir diambil/diproses SAP (HH:MM:SS)
  CONSTRAINT PREREG_BEL_SAP_PK PRIMARY KEY (DET_ID),
  CONSTRAINT PREREG_BEL_SAP_STATUS_CK CHECK (PREREG_STATUS IN ('APPROVED', 'CANCELLED')),
  CONSTRAINT PREREG_BEL_SAP_FLAG_CK CHECK (FLAG IN ('I', 'U')),
  CONSTRAINT PREREG_BEL_SAP_ACTIVE_CK CHECK (ISACTIVE IN ('TRUE', 'FALSE')),
  CONSTRAINT PREREG_BEL_SAP_PFLAG_CK CHECK (PREREG_FLAG IN ('I', 'U')),
  CONSTRAINT PREREG_BEL_SAP_RETR_CK CHECK (ISRETREIVEDBYSAP IN ('TRUE', 'FALSE'))
);

COMMENT ON TABLE PREREG_BEL_SAP IS 'Approved BEL vendor pre-registrations staged for SAP. One row per allocation line (DET_ID). SAP picks up PREREG_STATUS = ''APPROVED'', ISACTIVE = ''TRUE'', and ISRETREIVEDBYSAP = ''FALSE''.';

COMMENT ON COLUMN PREREG_BEL_SAP.DET_ID IS 'Primary key: UUID of the prereg BEL allocation line (awb_bel_line.id). Written by prereg for idempotent staging.';
COMMENT ON COLUMN PREREG_BEL_SAP.HEAD_ID IS 'UUID of the parent BEL registration header (awb_bel_registration.id). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.REG_NUMBER IS 'Human-readable BEL registration number (BEL-YYYYMMDD-XXXXXXXX). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.LIFNR IS 'SAP vendor code (LIFNR / vendor username). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.BSART IS 'SAP purchase order document type (e.g., ZM10, ZR10). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.EBELN IS 'SAP purchase order number (PO). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.EBELP IS 'SAP purchase order item number. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.MATNR IS 'SAP material number (trade material 8*). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.WERKS IS 'Destination SAP plant code. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.INCO1 IS 'SAP PO Incoterm 1 (e.g., FRC, CIF). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.PLN_MENGE IS 'Approved planned delivery quantity allocated against remaining PO quota. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.MEINS IS 'Order quantity unit of measure (e.g., KG). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.CREDAT IS 'Planned loading date (tanggal muat). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.ZZTRANSP_TYPE IS 'SAP transport mode code (T truck, V vessel, R rail, P pipeline, L light vehicle, E express, A air, W waterway). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.WNOSIM IS 'Assigned SAP master driver license number (SIM). Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.WNONAMA IS 'Assigned SAP master driver full name. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.WNOPOLISI IS 'Assigned SAP master vehicle license plate number. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.REMARK IS 'Optional vendor or logistics remark for the allocation line. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.CREATE_BY IS 'Username of the Logistics/Admin operator who approved the registration. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.CREATE_AT IS 'UTC timestamp when the staging row was written/updated. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.USERSAP IS 'Approving operator username sent as SAP user audit reference. Written by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.PREREG_STATUS IS 'Written by prereg: APPROVED = ready for SAP pickup, CANCELLED = retracted by prereg.';
COMMENT ON COLUMN PREREG_BEL_SAP.FLAG IS 'Written by prereg: I = data baru (new record), U = perubahan (update to existing staged record).';
COMMENT ON COLUMN PREREG_BEL_SAP.ISACTIVE IS 'Written by prereg: TRUE = active staged allocation, FALSE = deactivated/cancelled.';
COMMENT ON COLUMN PREREG_BEL_SAP.PREREG_FLAG IS 'Written by SAP: I = waiting for SAP processing, U = processed by SAP.';
COMMENT ON COLUMN PREREG_BEL_SAP.ISRETREIVEDBYSAP IS 'Written by SAP: TRUE = sudah diambil SAP, FALSE = belum diambil SAP (default FALSE).';
COMMENT ON COLUMN PREREG_BEL_SAP.ERRORMSG_PULL IS 'Written by SAP: pesan error saat SAP mengambil data dari tabel staging (nullable).';
COMMENT ON COLUMN PREREG_BEL_SAP.ERRORMSG_POST IS 'Written by SAP: pesan error saat SAP memposting data ke SAP ERP (nullable).';
COMMENT ON COLUMN PREREG_BEL_SAP.LASTUPDATE IS 'Written by SAP: date when SAP last pulled or processed the row.';
COMMENT ON COLUMN PREREG_BEL_SAP.LASTTIME IS 'Written by SAP: time when SAP last pulled or processed the row (HH:MM:SS).';
