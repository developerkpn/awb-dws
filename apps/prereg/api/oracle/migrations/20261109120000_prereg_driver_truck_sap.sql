-- Driver and truck staging between prereg and SAP. SAP flag columns follow SAPBRIDGE DRIVER/TRUCK;
-- PREREG_STATUS is the approval status and is written only by prereg.

CREATE TABLE PREREG_DRIVER_SAP (
  LICENSENO       VARCHAR2(25)  NOT NULL,
  DRIVERNAME      VARCHAR2(100) NOT NULL,
  STGLLAHIR       DATE,
  STMPLAHIR       VARCHAR2(25),
  SALAMAT1        VARCHAR2(50),
  SALAMAT2        VARCHAR2(50),
  SALAMAT3        VARCHAR2(50),
  SKOTA           VARCHAR2(25),
  PREREG_STATUS   VARCHAR2(10)  DEFAULT 'SUBMITTED' NOT NULL, -- SUBMITTED | APPROVED | REJECTED (prereg)
  FLAG            CHAR(1)       DEFAULT 'I'     NOT NULL,     -- I new record | U change to a record SAP has
  ISACTIVE        VARCHAR2(5)   DEFAULT 'TRUE'  NOT NULL,     -- TRUE active | FALSE deactivated
  PREREG_FLAG     CHAR(1)       DEFAULT 'I'     NOT NULL,     -- I waiting for SAP | U created in SAP (SAP)
  ISRETRIVEDBYSAP CHAR(5)       DEFAULT 'FALSE' NOT NULL,     -- FALSE not yet | TRUE retrieved by SAP (SAP)
  LASTUPDATE      DATE,                                       -- date SAP retrieved the row (SAP)
  LASTTIME        VARCHAR2(8),                                -- time SAP retrieved the row, HH:MM:SS (SAP)
  CONSTRAINT PREREG_DRIVER_SAP_PK PRIMARY KEY (LICENSENO),
  CONSTRAINT PREREG_DRIVER_SAP_STATUS_CK CHECK (PREREG_STATUS IN ('SUBMITTED', 'APPROVED', 'REJECTED'))
);

CREATE TABLE PREREG_TRUCK_SAP (
  CARPLATE        VARCHAR2(25)  NOT NULL,
  PREREG_STATUS   VARCHAR2(10)  DEFAULT 'SUBMITTED' NOT NULL, -- SUBMITTED | APPROVED | REJECTED (prereg)
  FLAG            CHAR(1)       DEFAULT 'I'     NOT NULL,     -- I new record | U change to a record SAP has
  ISACTIVE        VARCHAR2(5)   DEFAULT 'TRUE'  NOT NULL,     -- TRUE active | FALSE deactivated
  PREREG_FLAG     CHAR(1)       DEFAULT 'I'     NOT NULL,     -- I waiting for SAP | U created in SAP (SAP)
  ISRETRIVEDBYSAP CHAR(5)       DEFAULT 'FALSE' NOT NULL,     -- FALSE not yet | TRUE retrieved by SAP (SAP)
  LASTUPDATE      DATE,                                       -- date SAP retrieved the row (SAP)
  LASTTIME        VARCHAR2(8),                                -- time SAP retrieved the row, HH:MM:SS (SAP)
  CONSTRAINT PREREG_TRUCK_SAP_PK PRIMARY KEY (CARPLATE),
  CONSTRAINT PREREG_TRUCK_SAP_STATUS_CK CHECK (PREREG_STATUS IN ('SUBMITTED', 'APPROVED', 'REJECTED'))
);

COMMENT ON TABLE PREREG_DRIVER_SAP IS 'Drivers requested in prereg for SAP. One row per license, valid for every plant. SAP picks up PREREG_STATUS = APPROVED and ISRETRIVEDBYSAP = FALSE.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.PREREG_STATUS IS 'Approval status, written by prereg: SUBMITTED (waiting for Logistics), APPROVED (send to SAP), REJECTED (not sent to SAP).';
COMMENT ON COLUMN PREREG_DRIVER_SAP.FLAG IS 'Record action: I = new record, U = change to a record SAP already has.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.ISACTIVE IS 'TRUE = active record, FALSE = deactivated. Prereg always writes TRUE.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.PREREG_FLAG IS 'Written by SAP: I = waiting for SAP, U = created in SAP.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.ISRETRIVEDBYSAP IS 'Written by SAP: FALSE = not retrieved yet, TRUE = retrieved by SAP. CHAR(5), so TRUE is stored as ''TRUE ''.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.LASTUPDATE IS 'Written by SAP: date the row was retrieved.';
COMMENT ON COLUMN PREREG_DRIVER_SAP.LASTTIME IS 'Written by SAP: time the row was retrieved (HH:MM:SS).';

COMMENT ON TABLE PREREG_TRUCK_SAP IS 'Trucks requested in prereg for SAP. One row per plate, valid for every plant. SAP picks up PREREG_STATUS = APPROVED and ISRETRIVEDBYSAP = FALSE.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.PREREG_STATUS IS 'Approval status, written by prereg: SUBMITTED (waiting for Logistics), APPROVED (send to SAP), REJECTED (not sent to SAP).';
COMMENT ON COLUMN PREREG_TRUCK_SAP.FLAG IS 'Record action: I = new record, U = change to a record SAP already has.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.ISACTIVE IS 'TRUE = active record, FALSE = deactivated. Prereg always writes TRUE.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.PREREG_FLAG IS 'Written by SAP: I = waiting for SAP, U = created in SAP.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.ISRETRIVEDBYSAP IS 'Written by SAP: FALSE = not retrieved yet, TRUE = retrieved by SAP. CHAR(5), so TRUE is stored as ''TRUE ''.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.LASTUPDATE IS 'Written by SAP: date the row was retrieved.';
COMMENT ON COLUMN PREREG_TRUCK_SAP.LASTTIME IS 'Written by SAP: time the row was retrieved (HH:MM:SS).';
