# WB System (WB.NET V.2.37.8.0): screen map

The session was PT ENERGI UNGGUL PERSADA, location K1 "KIJING (CPO, POME)", user ADMIN (group ADMIN). Two sessions were run on 10 Nov 2026:

- **Session 1** was read-only.
- **Session 2** ran after the user confirmed that the machine is a test copy. Creating, editing and deleting data inside the app was allowed. Anything that leaves the machine was not: SAP upload or post, sync, printing, and token e-mails.

Screenshots are in `docs/wbnet/shots/` (git-ignored). Credentials are masked in this file; on the screenshots only the Compare DB login (121) is blacked out, so the Konfigurasi shots (112, 113c, 113g) still show them. The RDP connection went straight to the desktop. No Windows login screen appeared.

**Legend**

- **[seen]**: read from the screen. This is the default; anything not tagged was seen.
- **[inferred]**: my interpretation.
- **[not opened]**: the item is listed in a menu, but I did not open it.

---

## 0. Main screen: "Transaksi Penimbangan"

**Shots:** `01-main-transaksi-penimbangan.png`, `02`–`08-main-grid-scroll*.png`, `09-main-context-menu.png`, `240-main-restored.png`

**Purpose [inferred]:** the list of weighing transactions. The Penimbangan and Fitur menu items act on the row selected here.

**Title bar:** "WB System, PT ENERGI UNGGUL PERSADA, Loc : K1"

### Grid columns (in order)

- **Weighing basics:** WX, Tx, Ref. Date, Gatepass No., Card No., Ref./Doc. No, 1st Time, 2nd Time
- **Commodity, truck and DO:** Commodity Code, Commodity Name, Vehicle No., Do No, PI/SI No.
- **Weights:** Gross, Tare, Received, Deduction, Net, Total Unit, Ttl Unit for Deduction
- **Dates:** Report Date, Delivery Date, Delivery Time, Register Date, Register Time
- **Origin, driver, transporter:** Estate, Storage, License of Driver, Driver Name, Transporter, Delivery Note, Unloading Point
- **Remarks:** Remark Ticket, Remark Report
- **Estate weights and fruit:** Gross Estate, Tare Estate, Net Estate, Average Weight/Unit, Fruits Type, Rendemen CPO, TBS_Reject, Reason
- **Weighing steps:** 1st Weighing, 1st Date, 2nd Weighing, 2nd Date, 3rd Weighing, 3rd Date, 3rd Time, 4th Weighing, 4th Date, 4th Time
- **Units:** UnitName, WeightPerUnitName, Estate
- **Audit:** Create_By, Create_Date, Change_By, Change_Date, Edit_By, Edit_Date, Edit_Qc_By, Edit_Qc_Date, Printed, Printed_By, Printed_Date, Ticket
- **Return, tanker, ISCC:** ReturRef, Tanker, TankQC, Max Tanker, ISCC, Use of Grandfather Clause, ISCC No., ISCC_No2, ISCC Weight
- **Cancel and approval:** Change/Cancel Reason, approve, approveBy1, approveBy2
- **WB codes and flags:** WBCode1, WBCode2, WBCode3, WBCode4, posted, Manual, NonContract, EstateDiff, Split, Token, TokenDL, completed, completedDL
- **Other:** TotalGunny, NOPW, Additional Information, sync_return, mark_return, return_ref, materialStuffing, mark_accident, accident_reason, posted_opw, internal_number, do_sap, Density, Loading Qty, mill
- **Registration close:** Registration Close Date, Registration Close Time, Registration Close By, linked, cancel_type

**Values seen:**

- WX: 2X
- Tx: BEL, LSM, LSK, LTK
- WBCode: SVR2, SVR13, SVR16, SVR31
- posted: Y / N
- NOPW: Y / N

### Row colours

- **Tan:** tooltip "Truck has not weighed for 2nd time for more than 1 hours".
- **Pink:** a cancelled transaction (seen on the test transaction).
- Konfigurasi > Pengaturan WB has a "Flag Color" setting: N hours after registration / 1st / 2nd / 3rd weighing, each with its own colour.

### Bottom bar

- Free-text search box and [Cari]. The box held "TEST" from someone earlier; it was restored at the end.
- "Saring Data Tanggal" with a from-date, "Ke" to-date, and [Saring].
- Checkbox **Parsial**: ticked = open/partial transactions only [inferred]. Unticked, a search found finished transactions.
- Checkbox **Kode WB**.
- Counter "N records shown".
- Link "Klik Link Ini Untuk Melaporkan Kendala/Isu Anda di Desksupport".
- Status line "Wilmar Group - Copyright ©, V.2.37.8.0 | User : ADMIN (ADMIN) - ADMIN".

### Other behaviour

- **Right-click:** no context menu. Right-click and Shift+F10 do nothing.
- **Escape on the main window:** asks "Apakah anda ingin keluar dari WB.Net?" (Yes/No). This is the exit prompt. I answered No each time (shot `161`).

---

## 1. Registrasi (the top item opens the form directly)

### 1.1 Registrasi Truk (list)

**Shots:** `10`, `11`, `181b`, `201`, `206`

**Purpose [inferred]:** the gate registration (gatepass "GPxxxxxxx") list. Every gate action starts here.

**Header:** Perusahaan (EU ..), Lokasi (K1 ..)

**Grid columns:** No Registrasi, Nomor Kartu, Tanggal Masuk, Jam Masuk, No Referensi, Di Checkout Oleh, Tanggal Keluar, Jam Keluar, Plat Truk, No Tangki, No SIM, Nama Supir, Kode Pengangkutan, Delivery Note, No Segel, Keterangan Gatepass, Dibuat Oleh, Tanggal Pembuatan, Direvisi Oleh, Tanggal Revisi, Dibatalkan Oleh, Tanggal Pembatalan, token_no, token, completed

**Filters:**

- Search box + [Cari]
- "Filter Data Dari" date, "Ke" date, [Filter]
- Checkbox "Termasuk yang Sudah Registrasi Keluar"
- Checkbox "Termasuk Registrasi yang Sudah Dibatalkan"

**Buttons ("Menu"):** Registrasi Masuk, Lihat, Revisi Registrasi, Registrasi Keluar, Revisi TDT, Perbaharui, Copy, Batalkan

**Counters:** Jumlah semua registrasi, Jumlah yang belum registrasi keluar, Jumlah yang sudah registrasi keluar, Jumlah registrasi yang dibatalkan

**Row colour:** a checked-out row is green.

### 1.2 Registration form (Lihat / Tambah / Revisi / Registrasi Keluar)

**Shots:** `12*`–`17`, `170`–`186`, `200`, `208`

**Titles:**

- "LIHAT REGISTRASI UNTUK EU/K1(...)"
- "TAMBAH REGISTRASI ..."
- "REVISI REGISTRASI ..."
- "REGISTRASI KELUAR ..."

The form has no title-bar X; Escape does nothing in Lihat. Lihat was closed with Alt+F4.

**Header:** No Registrasi (auto), Tanggal Registrasi (date + time; the new form shows a stale default 08/03/2018), No Referensi (combobox; the Ref No after weighing).

**Informasi Truk:**

- Nomor Kartu: greyed; RFID card [inferred]
- Jenis Penimbangan: **2X Normal Weighing / NX Multiple Weighing / Non Weighing**
- Plat Truk (..), Kode Pengangkutan (..) + name, No SIM (..) + name, No Tangki (..)
- Jumlah Penumpang, Nama Penumpang
- Checkbox "Perlu pengecekan untuk timbang terakhir (sisa partai)"

**Destinasi:** lookup "List of Destination" (Destination, Description), [+] / [x], and a grid of Kode, Destinasi. Multiple destinations are allowed.

**Foto-foto:** tabs Timbang 1–4 with 3 image slots each (camera captures [inferred]).

**Tabs:**

- **Informasi Umum:** Delivery Note, checkbox Kebun berbeda, checkbox Pengembalian, No Segel, Keterangan Untuk Tiket, Keterangan Untuk Laporan, Informasi Tambahan
- **No Kontainer:** Tambah / Revisi / Hapus, a grid of No Kontainer and Segel, checkbox "Need Container Check"
- **Other Party:**
  - checkbox "No Other Party Weight"
  - No Referensi Other Party + [Check]
  - Tanggal Penimbangan Other Party (date + time)
  - Bruto, Tara, Netto
- **DO WB:**
  - Buttons: Tambah / Revisi / Hapus / Lihat / Hapus Semua
  - Grid: Kode Transaksi, No DO, No PI, Sisa DO, Komoditi, Kode Relasi, Nama Relasi, Kontrak, Netto Kebun, Bruto, Tara, Netto, Kode Pengangkutan, DO SAP, DO SAP Item, Internal Number, Internal Number Item, Loading Qty, SO Item, STO_no, STO_item, Customer_QQ
  - Totals: Total WB DO, Total DO Qty in KG, Total Allocated Factory Nett
- **Potongan:** [Isi Potongan per DO WB]
- **Quality Control:** Kode QC, Nama QC, SAP Spesifikasi, Nilai QC Kebun, Nilai QC Pabrik, Potong Netto

**Buttons:** Registrasi Keluar (only enabled in Keluar mode), Simpan, Batal

**Sub-form "Tambah DO WB - Netto tersedia (x\y)" (`174`, `176`):**

- No DO WB (..) opens "Daftar Kontrak". It has:
  - Menu: Menu, Pilih, Saring, Batal Saring, Tutup
  - Columns: KB, No. DO/SO, Tanggal DO/SO, Komoditi, Tx, Kode Relasi, No. PI/SI, Quantity, QtyAdopt, No. Kontrak, ...
  - "Tampilkan Closed" checkbox and a counter (Jumlah Data = 503)
- No. PI/SI (..)
- Kode Transaksi, Komoditi, No Kontrak, Relasi, Pengangkutan, Kebun: filled from the DO
- "Sisa Kuantiti DO a / b"
- Red "*KB" marker
- Netto Other Party, Netto Pabrik, Loading Qty, Other Party Loading Qty (KG)
- DO SAP panel: [Pilih DOSAP], SO Item, DO SAP + Item, Loading Note + Item, Quantity in KG, Quantity/UoM, Base Quantity/UoM, Customer QQ
- "*1x STO = 1x DO", STO, DO STO
- Simpan, Batal

**Rules seen:** see "Flow as observed" at the end. In short:

- Required fields: plate, WB DO, destination, and Other Party weight or "No Other Party Weight".
- A sale (JUL) needs an SAP Loading Note.
- A weighed registration cannot be cancelled.
- Revisi asks for a reason.

### 1.3 Revisi TDT, Copy, Batalkan, Perbaharui

- **Revisi TDT:** "This Gatepass is not Lock TDT. Please use edit Gatepass instead." The OPR permission GP_EDIT_TDT is "For edit TDT in Gatepass". There is a token e-mail TOKEN_UNLOCK_TDT.
- **Copy:** a new registration prefilled from the selected one, without the DO.
- **Batalkan:** on a weighed registration it is refused with "Registrasi tidak bisa dibatalkan karena sudah ditimbang pada referensi ...". It was not tried on an unweighed one.
- **Perbaharui:** refresh [inferred]. [not pressed]

---

## 2. Penimbangan (dropdown)

**Shots:** `20-penimbangan-menu.png`, `21-penimbangan-edit-transaction-submenu.png`

**Items:**

- Mulai Penimbangan
- Pecah Referensi
- Gabung DO (Ctrl+M)
- Salin Data/Sisip Untuk Timbang 2X (Ins)
- Transaksi Manual (F6)
- Pengisian Quality Control (Ctrl+Q)
- Adopt Surat Pengiriman
- Pengisian Loading Quantity / Density
- Pengisian Sparepart Quantity
- Pengisian Other Party Weight
- Pengisian Return Qty
- Pengisian Delivery Note
- Edit Transaction ▶
  - Revisi Transaksi (Ctrl+E)
  - Revisi Kuantiti Pabrik
  - Edit Potongan
  - Edit Report Date
  - Edit Delivery Note
- Batalkan Transaksi
- Lihat Transaksi
- Print Transaksi (Ctrl+P)
- Perbaiki Checksum (Ctrl+R)
- Perbaiki Semua Checksum

### Shared weight-transaction form

Most items open the same weight-transaction form in different modes. The mode shows in the title and in which fields are editable. **Layout:**

- **Header:** Vehicle No. (..), Driver ID (..) + name, Tanker No. (..) with "Max.Tanker = 5,000,000 Kg (NOT CHECK)" (or "Max.Tanker = -"), Transporter (..) + name, [Tare History]
- **Text fields:** Delivery Note, checkbox Estate is Different, Remark for ticket, Remark for Report, Seal No., Additional Info
- **Right:** Ref No., Ref Date, Report Date, [Save], [Cancel], [Read Indicator]
- **[Other Party]:** Gross, Tare, Net, checkbox "No Other Party WB Slip", Other Party Date + time, WB (Ref)
- **[Factory Weight]:** 1st / 2nd weight with date and time, Net, Register Date + time, Material Stuffing (KG)
- **Totals:** Deduction, NET (large), +/-
- **Tabs:**
  - Contract / DO: Tx, DO No., PI/SI No., O/S DO, Commodity, R.Code, Relation Name, Contract, Other Party Net, Factory Bruto, Factory Tarra, Factory Net, Transporter Code, DO SAP, Item DO SAP, Internal No., Item Internal No., Load Qty, SO Item, STO_no, STO_item, Density. Totals and Add / Edit / Delete / View / Delete All / Refresh, checkbox Return.
  - General Information: Storage (..)
  - Deduction: [Entry Unit Deduction Per Contract]; grid D, Code, Name, %, Deduction (Kg), Qty of Unit, Retur, Do_No, Gatepass_Number; Add / Edit / Delete
  - Quality Control / Yield: Quality Control, Tank; grid Q.C. Code, Quality Control Name, Contract Specification, Estate, Factory, Deduct Net (FFA, M&I, DOBI)

Cancel in an edit mode asks "Entry transaction will be cancelled...! Are you sure?". Yes only discards the open entry; I checked this on the test data.

### 2.1 Mulai Penimbangan

**Shots:** `190`–`198`

**Dialog "Choose Gatepass No / Truck No":** Card No. (greyed), No Registrasi (combobox of open gatepasses), Nomor (truck); OK, Batal(Esc).

**Forms:**

- "1ST WEIGHT TRANSACTION ( 2X )" opens first.
- On the next pick it opens "2ND WEIGHT TRANSACTION ( 2X )".

**Indicator and manual entry:**

- [Read Indicator] did nothing without an indicator.
- Weights could be typed by hand. No token or warning appeared for ADMIN.
- After Save the chooser reopens.
- **Purpose:** weigh in and out against a registration.

### 2.2 Pecah Referensi

On a 2X BEL transaction it gave "WARNING: Can not split uncompleted transaction!" (`30`). **Purpose [inferred]:** split one reference across DOs. The OPR permission is MD_TRANS_SPLIT "Split Reference".

### 2.3 Gabung DO (Ctrl+M)

"Tidak bisa menggabungkan transaksi yang belum di-split!" (`31`). **Purpose [inferred]:** merge split transactions back together.

### 2.4 Salin Data/Sisip Untuk Timbang 2X (Ins)

On the selected finished row: "ERROR: Can't copy transaction since truck registration has been registered out!" (`252`). **Purpose [inferred]:** copy or insert a transaction for a truck that is still registered.

### 2.5 Transaksi Manual (F6)

**Shots:** `250`, `251`

- **Dialog "Register For Weighing.....":** [Truck Registration] (disabled), [2x Weighing], [Cancel].
- **Form "MANUAL WEIGHT TRANSACTION ( 2X )":** everything is editable, including Ref No. (pre-numbered EUK1000001). There is no registration link and only the Contract / DO and General Information tabs.
- I cancelled it with Yes on the discard prompt.
- **Token:** the OPR permission TRANS_MANUAL is "For weighing manually". There is a TOKEN_MANUAL e-mail. ADMIN was not asked for a token.

### 2.6 Pengisian Quality Control (Ctrl+Q)

"QC WEIGHT TRANSACTION ( 2X )" (`28`, `28b`, `29`). Only the QC tab is editable. Buttons: Save, Cancel.

### 2.7 Adopt Surat Pengiriman

**Hover hint (`37`):**

> For Sugar Refinery Process. Commodity Type = Sugar. Warehouse to Adopt Delivery Letter From SAP After 1st Weight. Cannot 2nd Weight if Delivery Letter is not Filled in Transaction.

**Form "DL WEIGHT TRANSACTION ( 2X )" (`37b`):** only Delivery Note is editable. The OPR permission is DL_ADOPT.

### 2.8 Pengisian Loading Quantity / Density

**Form "Loading Info / Density" (`32`, `32b`):**

- Ref No., Ref Date, Report Date, Vehicle No., Driver ID, Material Stuffing (KG)
- Add / Edit / Delete / Delete All (disabled), SAVE, CANCEL
- Grid "Table SO": SO No, SO Item, Commodity code, Commodity Name, DO SAP, DO SAP Item, Loading Qty in Base UOM, DO BASE QTY, BASE UOM, DO QTY, DO UOM, DO QTY in KG
- "Total Item", "Total DO Qty in KG"
- Cancel closes it without a prompt.

### 2.9 Pengisian Sparepart Quantity

"Input Sparepart Qty is Only for Non-Trade and Non-KG Commodity." (`33`). The same message appeared on a SPAREPART row.

### 2.10 Pengisian Other Party Weight

- On an unfinished row: "Transaksi ini belum ditimbang keluar!" (`34`).
- On a finished one: "EDIT_OPW WEIGHT TRANSACTION ( 2X )" (`34b`). Only [Other Party] is editable.
- OPR permissions: ENTRY_OPW, EDIT_OPW.

### 2.11 Pengisian Return Qty

"Pengisian Kuantiti Pengembalian tidak berlaku untuk transaksi ini!" (`35`). It applies to return transaction types RTB/RTJ [inferred].

### 2.12 Pengisian Delivery Note

**Dialog "Scan Card" (`36`):** Card No., group "Delivery Information" (Reference No. combobox, Delivery Note), Save, Cancel. The card is scanned first [inferred].

### 2.13 Edit Transaction ▶ Revisi Transaksi (Ctrl+E)

**Form "EDIT WEIGHT TRANSACTION ( 2X )" (`38`):**

- **Editable:** Tanker, remarks, Seal, Additional Info, Estate is Different, Other Party, 1st and 2nd weights with times, Register Date, and the DO grid buttons.
- **Locked:** Vehicle, Driver, Transporter.
- **Token:** Konfigurasi Tool shows "Reset Count Edit Transaction & Edit Quantity Transaction if Already in Max 5 Times (TOKEN)". This suggests edits are counted, and a token is needed after 5 [inferred]. There are TOKEN_EDIT and EDIT_WARNING e-mails.

### 2.14 Edit Transaction ▶ Revisi Kuantiti Pabrik

"QTY WEIGHT TRANSACTION ( 2X )" (`39`). Only the Factory Weight 1st/2nd and Report Date are editable. Permission TRANS_QTY; e-mail TOKEN_EDITQTY.

### 2.15 Edit Transaction ▶ Edit Potongan

"DEDUCTION WEIGHT TRANSACTION ( 2X )" (`40`, `40b`). Only the Deduction tab and Report Date are editable.

### 2.16 Edit Transaction ▶ Edit Report Date

Dialog "Edit Report Date" (`41`): Ref, Truck Number, License No, Delivery Note (read-only), Report Date (date). Buttons: Cancel, Save. Cancel asks "Are you sure you want to exit?".

### 2.17 Edit Transaction ▶ Edit Delivery Note

Dialog "Edit Delivery Note" (`42`). The layout is the same as Edit Report Date, but only Delivery Note is editable. E-mails TOKEN_DELIVERY and DELIVERY.

### 2.18 Batalkan Transaksi

**Shots:** `212`–`215`. Used on my own test transaction only.

- **Prompt:** "Apakah anda yakin untuk MEMBATALKAN referensi X dan transaksi split terkait referensi ini (jika ada)??"
- **Then:** "Cancel Transaction / Reason for Cancel Transaction" + OK.
- **Result:** the row turns pink and stays listed. The Change/Cancel Reason column is filled.
- **Token:** ADMIN was not asked for one. Master "Cancel Type" says type C "CANCEL TRANSACTION" needs a token and type R "REJECT QUALITY" does not. There is a TOKEN_CANCEL e-mail.

### 2.19 Lihat Transaksi

"VIEW WEIGHT TRANSACTION ( 2X )" (`22`–`27`). Read-only, with [Cancel]. [Tare History] opens "Tare History for Truck : X":

- Menu: Close (Esc)
- Grid: Tx, Ref, Truck No., Report_Date, Commodity, Gross, Tare, Received, Deduction, Net
- Checkbox "Include Split Transaction"

### 2.20 Not opened

- **Print Transaksi (Ctrl+P):** [not opened]. It may go to the printer. It is the reprint flow; see the Alasan untuk Reprint master and the TOKEN_REPRINT e-mail.
- **Perbaiki Checksum (Ctrl+R) / Perbaiki Semua Checksum:** [not opened]. They are direct actions that repair record checksums [inferred].

---

## 3. Fitur (dropdown)

**Shots:** `50`–`54`

**Items:**

- Lihat Transaksi DO (Ctrl+D)
- Mark Accident
- Auto Split untuk DO Kapal (F7)
- Gabung Auto Split untuk DO Kapal
- TCS ▶
  - Refresh QC from TCS
  - Mapping Truck Destination per Company & Location
- Request Special Token ▶
  - Izinkan Capture Berat saat Timbangan Tidak Stabil
  - Token to Edit Multiple Contracts & Transactions
  - Token to Allow Manned Weighing
- Additional Printing Menu ▶
  - Print SPB
- Nonaktifkan Fitur
- Revisi Penanda Unggah ▶
  - Penanda Belum Dipost
  - Penanda Post Ulang
- View Sparepart

### 3.1 Lihat Transaksi DO

**Form "View DO Transaction" (`55`, `55b`):**

- Menu: Export to Excel [not pressed]
- Filters: Ref. No, PI No, Container, From (date + checkbox), [Find Container], DO No (..), Commodity (..), Relation (..)
- Buttons: [Filter], [Show All], [Close]
- Grid "TRANSACTION TABLE": Tx, Ref No, 1st–4th Date, DO No, PI No, Commodity...
- Grid "CONTAINER TABLE": Ref_Date, Ref, Truck_Number, Container, Seal
- Search box + Find
- Show All returned "No records found . . !"
- **Purpose [inferred]:** look up transactions and containers per DO.

### 3.2 Mark Accident

**Form "Mark Accident" (`56`):** Filter Contract No (..); Method: Manual / Retrieve DO Details from SAP; [Search], grid, [Process] (disabled), [Cancel]. The grid columns mark_accident and accident_reason exist. **Purpose [inferred]:** flag accident loads per contract.

### 3.3 Auto Split untuk DO Kapal (F7) and Gabung Auto Split

"Split DO Vessel" and "Merge DO Vessel" (`57`, `58`): DO Vessel (..) + [Go]. The Kontrol WB setting "Max % Tolerance for Split" is 85.

### 3.4 TCS ▶ Mapping Truck Destination per Company & Location

**Form "Mapping Tujuan" (`59`):** grid Code, Description, then one checkbox column per location (EU - K1, EU - K2). Row: REF REFINERY. Buttons: Simpan, Tutup.

### 3.5 TCS ▶ Refresh QC from TCS

**Form (`60`):** Report Date From / To, Commodity Code (...), Ref No, a "Status of Refreshing QC" log box, [Process], [Close]. **Purpose [inferred]:** pull lab QC results from an external TCS system.

### 3.6 Request Special Token ▶ Izinkan Capture Berat saat Timbangan Tidak Stabil

**Prompt (`61`):**

> C A U T I O N !!!!! This Approval Will Allow to Capture Weight if Weighbridge Not Stable. Protection to Captured Weight Will Be Removed For 24 Hours after Receive PIN. Are You Sure ??

Answered No. This links to the CAPTURE_NOT_STABLE e-mail and permission.

### 3.7 Request Special Token ▶ Token to Edit Multiple Contracts & Transactions

**Form (`62`):** Token Code (pre-generated, masked), Range of Date From / To, PIN Code, Message, [Request for PIN], [Cancel]. I cancelled it. **[inferred]:** "Request for PIN" e-mails the approvers, and the approver's PIN is then typed into PIN Code. Permission EDIT_MULTIPLE.

### 3.8 Request Special Token ▶ Token to Allow Manned Weighing

"This can't be requested because Unmanned system is not activated!" (`63`). Permission ALLOW_MANNED_WB.

### 3.9 Additional Printing Menu ▶ Print SPB

[not opened]: printing. **Purpose [inferred]:** print the sales SPB (surat pengantar barang). Permission MN_PRINT_SPB.

### 3.10 Nonaktifkan Fitur

**Form "Daftar Fitur" (`64`–`64d`):**

- Grid: Kode Kondisi, Deskripsi, Waktu Mulai Nonaktif, Waktu Selesai Nonaktif
- Row: IntegrationSap "Active SAP Integration for WB.NET"
- Aktifitas menu: Nonaktif Fitur, Hapus Token Nonaktif Fitur

**Sub-form "Select Location to Disable Feature":** Select All, grid Select / Company Code / Location Code (EU K1, EU K2), Start Time and End Time (date + time), Process, Close. I closed it. **Purpose:** switch a feature off for a time window. This matches the timeline's "Disable condition"; there are TOKEN_DISABLE_CONDITION and DISABLE_CONDITION e-mails and the DC_TRUSTEE permission.

### 3.11 Revisi Penanda Unggah ▶ Penanda Belum Dipost

**This ran immediately, with no form or confirmation.** It ran on the selected row EUK1021866~ (BEL) and showed "Flag upload has been changed succesfully for this transaction" (`65`). This happened in session 2.

- It sets posted Y→N: the transaction is marked "not yet posted to SAP" [inferred].
- **It was not reverted.** "Penanda Post Ulang" might queue a re-post to SAP.

### 3.12 Revisi Penanda Unggah ▶ Penanda Post Ulang

[not opened]: it would run on the selected row.

### 3.13 View Sparepart

"Data Tidak Ketemu.." (`66`).

---

## 4. Data Master (dropdown)

**Shots:** `70`, `71`

**Items** (separators shown as gaps):

- WB DO, Komoditi, Relasi
- Truk, Nomor SIM, Pengangkutan, Tanker & Kapasitas
- Perusahaan, Lokasi, Kebun
- Tipe Unggah, SAPDestinasi, Gudang, Quality Control ▶ (QC Item, Komposisi)
- Tipe Transaksi, Template SAP, Pemetaan Komoditi - Tipe Transaksi, Deducted By, Destination
- Email Recipients, Daftar Kamera, Alasan untuk Reprint Transaksi, Kalibrasi WB, Cancel Type

**Common pattern:**

- Each master is a list window with an "Aktifitas" menu (Tambah Data Baru, Lihat Data, Revisi Data, Delete or Mark Delete, sometimes Print Transaksi), "ZWB ▶" (sync with SAP ZWB), "Salin ke Semua Lokasi ▶", a search box + [Cari], and often a "Show Deleted" checkbox.
- Every list carries audit columns Create_By / Create_Date / Change_By / Change_Date and sync columns zwb, token, completed.
- **Delete is soft:** Mark Delete asks for a reason ("Alasan Mark Delete") and hides the row; "Show Deleted" shows it again.
- **Opening Daftar Komoditi raised "SEND EMAIL ERROR"** (System.Net.Mail.SmtpException, `75x`). The app tries to send an e-mail on some actions; it failed here.

### 4.1 WB DO: "Daftar Kontrak"

**Shots:** `72`–`74`

**Menu bar:** Menu, Saring, Batal Saring, Tutup

**Menu items:**

- Tambah Data Baru, Lihat Data, Revisi Data
- Ubah Lock Bongkar
- Isi PIN
- Tutup DO
- Salin Data
- Hapus
- Delivery Note
- Map Kapal DO
- Adopt Ulang Dari SAP (Tanpa Token)
- ZWB ▶: Sinkronisasi, Sinkronisasi Semua, Permintaan Edit Data di SAP Untuk Dokumen BC
- Diagnostik Master Data
- Ambil Spesifikasi Kontrak (Peringatan Outspec)
- Set Toleransi Komoditi Untuk Pengecekan Gross Weight Komoditi Pack
- Set Toleransi Persentasi Maksimum DO Kapal untuk Pecah DO Proporsional

**Grid columns (88; a few between No. Kontrak and PO_Item were not captured):**

- **Basics:** KB, No. DO/SO, Tanggal DO/SO, Komoditi, Tx, Kode Relasi, No. PI/SI, Quantity, QtyAdopt, No. Kontrak, …, PO_Item, Tolling Company, SAP Mov. Type, Remark
- **Origin and terms:** Kebun, Incoterm (Franco/Loco), DeductedBy, UnGraded
- **Status:** Status_Do, Close_Do_Date, CheckPeriod, Do_Date2
- **FFB grading bands:** Big/Mid/Sml_Fruit1-2, Scout1-2, Loose1-2, Upd_Est, Upd_Fact, Entry_Est, Entry_Fact, Type_Estate
- **Control:** ISCC, check_qty, DO/SO Closed, closed_date, closed_by, Tolerance, Upload_Type, QualityInfo
- **Audit:** Create_By, Create_Date, Change_By, Change_Date
- **Conversion:** Convertion, ConvertionUnit, ConvertionTolerance, ConvertionCheck
- **SAP links:** STO1DO, zadp, zwb, plant, str_loc, token, completed, tokenGRCust, completedGrcust, qstandard, Batch, so_item_count, mill, gain_loss, langsir_type, qOrigin, sync_return
- **Bonded zone (BC):** BC_No, BC_Date, BC_Exp_Date, lock_KB, Tolling 2, Plasma
- **Other:** spb_no, spb_item, STO_Qty, STO_UoM, Tracking_No, Tracking_Item, Require_BC, calcLoadingQtyAutomatically

**Bottom bar:** search + Cari, "Tampilkan Semua DO Dari Semua Lokasi", "Tampilkan Closed", "Jumlah Data = 503".

#### Add form "Tambah Data DO/Contract/Confirmation Baru" (`73`–`73g`)

**Header:**

- Tipe Transaksi (..) + Deskripsi
- No. Delivery Order + Tgl; "Cek Periode" + date
- No. Kontrak + Tgl; ISCC-Certified; a "Kg" box + [Cek OS]
- Komoditi (..), Penjual / Pembeli (..), Pengangkutan (..), Kebun (..)
- Kapal + Tipe combobox + Deskripsi
- Keterangan
- **Dipotong Oleh:** Kuantiti Pabrik / Kuantiti Other
- **Incoterm:** FRC, LCO, CIF, FOB, CNF, EXW, FCA, CFR, DDP, ...
- Kuantiti (Kg) + "Cek Kuantiti"
- **Toleransi (%)**

**Tab Kilang Minyak:**

- PO / item, STO / item, GR PO + "1STO = 1DO", GR Custom, No. PI/SI, SPB / item, Q.Standard
- No BC, Tgl BC, Tgl Exp BC; [Adopt dari SAP]
- "Kawasan Berikat", "Memerlukan Dokumen BC"
- **Tipe Langsir:** None (1) / GR Only (2) / Titip Timbun (6) / Titip Timbun 3rd Party (6) / Langsir (7) / Transfer Posting (5)
- "Gain / Loss di Destination Sloc."
- "Hitung loading qty otomatis saat timbang keluar"
- Right panel "Kualiti Kontrak"

**Other tabs:**

- **Detail InformasiSAP:** grid SO No, Item SO, Kode Komoditi, Nama Komoditi, Kuantiti dalam Base UoM, Kuantiti dalam KG; Tambah / Revisi / Hapus
- **Kontrol Tambahan:** "[ Konversi DO ]": Unit Konversi, Nilai Konversi ("1 Unit Konversi = xxx Kg")
- **Pembukaan:** Isi Pembukaan, with Pihak Ketiga (Kg) and Pabrik (Kg). These are opening balances [inferred].
- **Detail STO:** PO/STO, Item PO/STO, Kode Komoditi, Kuantiti PO/STO, Satuan PO/STO, No. Tracking
- **Detail BC:** No BC, Item BC, Tipe BC, Tgl BC, Tgl Exp BC, Kuantiti BC

**Buttons:** Simpan, Batal. I closed the form without saving.

**Transaction type lookup (19 codes), each as code, description, I/O, return flag:**

| Code | Description                   | I/O | Return |
| ---- | ----------------------------- | --- | ------ |
| BEL  | PEMBELIAN                     | I   | N      |
| JUL  | PENJUALAN                     | O   | N      |
| LGK  | LANGSIR KELUAR (ZDO_DR)       | O   | N      |
| LGM  | LANGSIR MASUK (ZDO_DR)        | I   | N      |
| LSI  | LANGSIR KELUAR (POSTING)      | I   | N      |
| LSK  | LANGSIR KELUAR                | O   | N      |
| LSM  | LANGSIR MASUK                 | I   | N      |
| LSO  | LANGSIR MASUK (POSTING)       | O   | N      |
| LTK  | LINTAS TIMBANG KELUAR         | O   | N      |
| LTM  | LINTAS TIMBANG MASUK          | I   | N      |
| RTB  | RETUR PEMBELIAN               | O   | Y      |
| RTJ  | RETUR PENJUALAN               | I   | Y      |
| RVS  | VESSEL                        | I   | N      |
| TBK  | TITIP TIMBUN KELUAR (POSTING) | O   | N      |
| TBM  | TITIP TIMBUN MASUK (POSTING)  | I   | N      |
| TOK  | TITIP OLAH KELUAR             | O   | N      |
| TOM  | TITIP OLAH MASUK              | I   | N      |
| TPI  | TRANSFER POSTING IN           | I   | N      |
| TPO  | TRANSFER POSTING OUT          | O   | N      |

RVS is the only code with "Transaksi Kapal" = Y. The lookup's other columns are gatepass_Type, zwb, PostSAP.

### 4.2 Komoditi: "Daftar Komoditi"

**Shots:** `75`, `75b`, `75c`, `75x`, `76`–`76e`

**Aktifitas:** Tambah Data Baru, Lihat Data, Isi Kualitas, Isi Toleransi, Revisi Data, Delete, Print Transaksi, ZWB ▶, Salin ke Semua Lokasi ▶

**Columns (58):**

- **Basics:** Kode Komoditi, Nama Komoditi, Unit, Toleransi (%), Berat Bersih, Berat Kotor, Form No ISO
- **Conversion:** Konversi Nama Unit, Nilai Konversi, Toleransi, Kontrol Berat Konversi
- **Type:** ZWB - Kode Material, Material_Type, Type, Trade, Kode Mutu, Goni, BulkPack
- **Audit:** Create/Change_By/Date, Deleted
- **Gunny:** GI_Plant, Gross_Min_Gunny, Netto_Gunny, Gross_Max_Gunny
- **Sync:** Comm_Type, PostSAP, zwb, token, completed
- **Estate:** Estate_Code, Division_Code/Name, Block_Code/Name, Remark, SAP_Code
- **FFB:** BJR0–BJR12, YearPlanting, QCApprove
- **Other:** Material_Batch, check_tare, sync_return, Get_From_SAP

#### Add form "Tambah Komoditi Baru"

**Fields:** Kode, Nama, Unit (KG), "Cek Tara Truck"; buttons [Grading Control] and [Quality Control].

**Radio groups:**

- Tipe Komoditi: Standard / FFB / Copra / Gula
- Trade / Non Trade
- Post Ke SAP: Iya / Tidak
- Cek Grading: Iya / Tidak
- Pakai Goni/Bale: Iya / Tidak
- Bulk / Pack
- Konsinyasi / Mutu Report: Iya / Tidak

**Tabs:**

- **SAP:** Form No ISO, SAP Kode Material, Batch, [Adopt Dari SAP], SAP Tipe Material Cair / Padat
- **Goni:** Berat Kotor Minimum, Berat Kotor, Berat Bersih (KG)
- **Konversi UOM:** Berat Kotor (KG), Toleransi/UOM (%), Berat Bersih (KG)

**Sub-forms:**

- **[Quality Control]** opens "Opsi Tambahan Untuk Komoditi": grid Beri Peringatan Jika Outspec, Potong Netto, Kode QC, Deskripsi; Tambah Item, Hapus, Kembali.
- **[Grading Control]** opens "Opsi Tambahan Untuk Grading": grid D, Code, Name, Formula, Retur; Nama Unit "Bunch"; Tambah Item, Edit, Hapus, Kembali.

I cancelled the form without saving.

### 4.3 Relasi: "Daftar Relasi ( Pembeli/Penjual)"

**Shots:** `77`, `77b`, `77c`, `78`

- **Aktifitas:** Tambah, Lihat, Revisi, Delete, Print Transaksi, Zwb ▶, Salin ke Semua Lokasi ▶
- **Columns:** Kode Relasi, Tipe, Nama Relasi, Alamat, Blacklist, DailyQuantity, Quantity, audit, zwb, token, completed
- **Add form "Tambah Relasi Baru":** Kode Relasi, ISCC Cert., Nama Relasi, Alamat, Kota, Telepon, Fax, Orang Yang (Dapat Dihubungi), Kode, Blacklist "Diblokir", Tipe Pembeli / Penjual, "Peringatan Kelebihan Kuantiti Harian" (checkbox + Kg). I cancelled it.

### 4.4 Truk: "Daftar Truk (Plat Kendaraan)"

**Shots:** `79`–`80c`, `230`–`232`

- **Aktifitas:** Tambah, Lihat, Revisi, Mark Delete, Blacklist, Analisis Tare Truk ▶ (Analisis Truk Ini, Analisis Semua Truck), Zwb ▶, Salin ke Semua Lokasi ▶
- **Columns:** Nomor Kendaraan, Tanker_No, Description, Pengangkutan, Tara Minimal, Tara Maksimal, Blacklist, Alasan, D…, SIM Kendaraan Plat Kuning, audit, LastCheck, zwb, token, completed
- **Add form "Tambah Nomor Kendaraan Baru":**
  - Pengangkutan (..)
  - Nomor Truk in 3 parts "AA - 1234 - ZZZ"
  - No. Tanker (..), "SIM Kendaraan Plat Kuning", Deskripsi
  - Tara Minimal / Maksimal (KG, greyed; computed from history [inferred])
- **Saved:** test truck ZZ 9999 TCL. Later mark-deleted, with an unhandled-exception box after Proses (`232`).

### 4.5 Nomor SIM: "Daftar Supir"

**Shots:** `81`–`82c`, `233`

- **Menu:** Aktifitas, Saring, Batal Saring, Tutup
- **Aktifitas:** Tambah, Lihat, Revisi, Mark Delete, Blacklist, Foto SIM Supir, ZWB ▶, Salin ke Semua Lokasi ▶
- **Columns:** Nomor SIM, Nama Supir, Nomor Truck, Alamat, …, Blacklist, Alasan Diblacklist, audit, zwb, token, completed
- **Add form "Tambah Data Supir Baru":** Nomor SIM, Nama Supir, Alamat, Tempat Lahir, Telepon, Nomor Truck, Tanggal Lahir
- **Saved:** test driver 9999000011112222. Later mark-deleted; the same exception box appeared.

### 4.6 Pengangkutan: "Daftar Pengangkutan"

**Shots:** `83`, `83b`, `83c`, `84`

- **Aktifitas:** Tambah, Lihat, Revisi, Delete, Print Transaksi, Blacklist, Unblacklist (disabled), ZWB ▶, Salin ke Semua Lokasi ▶
- **Columns:** Kode Pengangkutan, Nama Pengangkutan, Alamat, Telepon, Fax, …, Remark, Blacklist, Reason, audit, zwb, token, completed
- **Add form "Tambah Pengangkutan Baru":** Kode, Nama, Alamat, Telepon, Fax, Orang Yang Dapat Dihubungi, Kode, Remark, Tipe Pembeli / Penjual, [Adopt]. I cancelled it.

### 4.7 Tanker & Kapasitas: "Daftar Tanker & Kapasitas"

**Shots:** `85`–`86e`

- **Aktifitas:** Tambah, Lihat, Revisi, Delete, Print Transaksi
- **Columns:** Nomor Tanker, Kapasitas Maksimum, Check_Tanker (N / P), checktankertol, checktankerKG, audit, token, completed
- **Add form "Tambah Data No. Tanker":** Nomor Tanker, Kapasitas (KG), Cek Tanker: Toleransi (%) / Toleransi (KG) / Tidak Cek
- **Saved and mark-deleted:** test tanker TCL01. Delete asked "No. Tanker : TCL01, Max. Kapasitas : 10000. Yakin untuk Mark Delete data ini?", then "ALASAN".

### 4.8 Perusahaan: "Form Perusahaan"

**Shots:** `87`, `87b`. Columns: Kode Perusahaan, Nama Perusahaan (EU). Aktifitas: Tambah, Revisi, Delete.

### 4.9 Lokasi: "Form Lokasi"

**Shots:** `88`–`89`

- **Columns:**
  - Coy, Location_Code, Location_Name, Location_Type, WBOwner
  - Transaction scope: Ffb_Trans, Copra_Trans, All_Trans, Check_Dn, Tol_Trans, Check_…
  - FFB grading: Loose1/2, Scout1/2, BM
  - Data scope: DO, DeliveryNote, …, Commodity, Trans_Type, Contract, Customer, Estate, Report_Type
- **Rows:** EU K1 "KIJING (CPO, POME)"; EU K2 "KIJING (CANGKANG)"
- **Aktifitas:** Tambah, Lihat, Revisi (disabled), Delete
- **"Lihat Data Lokasi":** Kode Perusahaan, Kode Lokasi, Nama Lokasi

The SAP company code (CoySAP) is in the SAP Koneksi settings ("SAP Kode Lokasi EU23").

### 4.10 Kebun: "Daftar Kebun"

**Shots:** `90`, `90b`, `90c`, `91`

- **Aktifitas:** Tambah, Lihat, Revisi, Delete, Print Transaksi, ZWB ▶, Salin ke Semua Lokasi ▶
- **Columns:** Kode Kebun, Nama Kebun, Alamat / Lokasi Kebun, Kota, Tipe Kebun, SAP Kode, show_GHG, (GHG)_Value, RSPO_Value, audit, zwb, token, completed
- **Add form "Tambah Daftar Kebun Baru":** Kode Kebun, Show GHG, Show RSPO, Nama Kebun, Alamat / Lokasi, Kota, SAP Kode, RSPO, GHG Value for FFB, Tipe Kebun Pemilik / Other. I cancelled it.

### 4.11 Tipe Unggah: "List of Upload Type"

**Shot:** `92`. Columns: Digit, Nilai Digit, Kode Unggah, Deskripsi, Dibuat Oleh. The list is empty. Aktifitas: Tambah (Lihat / Revisi / Delete disabled).

### 4.12 SAPDestinasi: "List of SAP Destination"

**Shot:** `93`

- **Columns:** SAPDestinasi, Lindungi Template dengan Kata Sandi, Unggah Otomatis, Jam Mulai Unggah Otomatis, Jarak Waktu Unggah Otomatis, Dibuat Oleh, Tanggal Pembuatan, Dire[visi]…
- **Rows:** OTHER PARTY …, ZWB
- **Aktifitas:** Tambah, Lihat, Revisi, Hapus

### 4.13 Gudang: "Daftar Gudang"

**Shot:** `94`. Columns: Kode Gudang, Nama/Deskripsi Gudang, audit. The list is empty.

### 4.14 Quality Control ▶ QC Item: "Kontrol Kualitas Item"

**Shots:** `95`, `95b`, `95c`, `96`

- **Columns:** Kode, Deskripsi, type, token, completed, SAP_Code
- **Rows include:** ALK, ASH, BK, CP, CRTN, D&S, DENS, DOBI, FFA, FIBER, IV, LCB, LCR, LCY, M&I (SAP code MNI), …
- **Aktifitas:** Tambah, Lihat, Revisi, Delete
- **Add form "Tambah Data QC":** Kode QC, Nama QC, Tipe QC Karakter / Nomor, Kode. I cancelled it.

### 4.15 Quality Control ▶ Komposisi: "Rincian Komposisi"

**Shot:** `97`. Columns: Tanggal, Kode Relasi, kebun, Komoditi, Kode Mutu, Value. The list is empty. Aktifitas: Tambah, Lihat, Salin, Revisi, Delete. **Purpose [inferred]:** quality composition per supplier, estate and commodity.

### 4.16 Tipe Transaksi

**Shots:** `98`–`99`

- **Columns:** Tipe Transaksi, Deskripsi, I/O/X, Tipe Return, …, Adopt SAP, trx_require_internal_no, MS_in_Trx, trx_require_tanker, Entry_ReturnQty
- **Rows:** see the table in 4.1
- **Aktifitas:** Tambah, Lihat Transaksi, Revisi, Delete, ZWB ▶, Salin ke Semua Lokasi ▶
- **Add form "Tambah Tipe Transaksi Baru":**
  - Kode Transaksi, "Memerlukan Data Master Kontrak untuk Adopt dari SAP"
  - Nama Transaksi
  - Tipe: I - Masuk / O - Keluar / X - Lain-Lain
  - Checkboxes: Main DO Untuk Auto Split DO Vessel, Return Tipe Transaksi, Memerlukan DO SAP di Transaksi, Memasukkan Material Stuffing di Form Transaksi
  - I cancelled it.

### 4.17 Template SAP: "Daftar Template SAP"

**Shot:** `100`

- **Filters:** Modul (ZWB / OTHER PARTY WEIGH…), Tipe (1)
- **Columns:** Coy, Location_Code, Title_Excel, Column_Numbering, Field_Wb, Table_Name, Key_Field, Key_Field2, Modul, Type
- **Rows:** these map upload fields to WB tables and columns, for example:
  - ZWB_LOC = wb_location.coySAP
  - WREF = wb_transaction.ref
  - WDO = wb_transDo.do_no
  - WCOMM = comm_code
  - WTGLREF, WTGLKIRIM, WJAMKIRIM, WTGLDAFT, WJAMDAFT, WDA, WTGLKLR
  - WKB = wb_contract.berikat
  - WSTATUS = transaction_code
  - WKONT, WRELASI, WB_NO_REF, …
- **Purpose [inferred]:** the field map for the SAP ZWB upload.

### 4.18 Pemetaan Komoditi - Tipe Transaksi

**Shot:** `101`. Window "Tipe Comm - Trx untuk Pengwajiban GR Cust". Menu: Synch, Tutup. Columns: Transaction_Code, Comm_code, Coy, Location_code. **Purpose [inferred]:** which commodity + transaction type combinations require a GR Custom number.

### 4.19 Deducted By: "Daftar DeductedBy"

**Shots:** `102`, `102b`, `102c`

- **Columns:** Kode Transaksi, Kode Incoterm, Deducted By (0 / 1), audit
- **Rows:**
  - BEL: CNF 0, FOB 1, LCO 1, FRC 0, CIF 0
  - JUL: CNF 0, FOB 0, LCO 0, FRC 1, CIF 0, …
  - Several rows are duplicated.
- **Add form "Tambah Data DeductedBy Baru":** Kode Transaksi (combobox), Kode Incoterm (combobox), Kuantiti Pabrik / Kuantiti Other. I cancelled it.

This is the "mapping per incoterm". Reading 0 = factory and 1 = other party is [inferred].

### 4.20 Destination: "Form Asal"

**Shots:** `103`–`103d`

- **Columns:** Kode Asal, Deskripsi, Lokasi Gudang, Metode TP, audit, flag_sap, Relation_Code. The list is empty, although the registration lookup lists REF REFINERY [inferred: that lookup reads the TCS mapping].
- **Add form "Tambah ASAL Baru":** Kode Asal/Tujuan, Deskripsi, Lokasi Gudang, Metode TP 1 Langkah / 2 Langkah, Pemilik Kebun / Plasma / OPF, Tipe Movement SD, Tipe Movement MM, Grup, Kebun. I cancelled it.

### 4.21 Email Recipients: "Daftar Penerima Email"

**Shot:** `104*`. Addresses are not reproduced here.

**Columns:** Coy, Kode Lokasi, Department, Kode Email, Subjek, Ke, CC

**36 rows** for EU/K1. Each subject is "[WBNET] …".

- **Notifications:** EDIT_WARNING, CANCEL_WARNING, WB_CONTROL, LOCK_BONGKAR, RETURN_QTY, CAPTURE_NOT_STABLE, WB_CALIBRATION
- **Reports:** INDICATOR_STABILITY, LOG_CONTRACT, LOG_NONE, LOG_TRANS, REP_QC, WEIGHING_ANALYSIS
- **Token types:** TOKEN_CANCEL, TOKEN_COMM_CONT_TOL, TOKEN_MANUAL, TOKEN_DELETE, TOKEN_DELIVERY, TOKEN_DISABLE_CONDITION, TOKEN_EDIT, TOKEN_EDITQTY, TOKEN_EXPIRED_BC, TOKEN_GROSS_FFB, TOKEN_OVER_TARE, TOKEN_REPRINT, TOKEN_UNLOCK_TDT, TOKEN_BLACKLIST
- **Non-token counterparts:** DELETE, DELIVERY, DISABLE_CONDITION, EDIT, EDITQTY, EXPIRED_BC, GROSS_FFB, OVER_TARE, REPRINT

**Aktifitas:** Tambah, Lihat, Revisi, Hapus. Add form "Tambah Data Email Baru": Kode Email (combobox), Subjek, Ke, CC, [Tes Kirim]. I cancelled it.

### 4.22 Daftar Kamera: "Daftar Master Kamera"

**Shot:** `105*`

- **Columns:** Kode Kamera, Alamat IP, Dibuat Oleh, Tanggal Pembuatan, Edit Oleh, Tanggal Edit. The list is empty.
- **Add form "Tambah Data Camera Baru":** Kode Kamera, Alamat IP, Web Url, Akun (Nama Pengguna, Kata Sandi, Lihat Password), [Tes Foto]. I cancelled it.

### 4.23 Alasan untuk Reprint Transaksi: "Alasan"

**Shot:** `106*`

- **Columns:** Tujuan, Alasan, Dibuat Oleh, Tanggal Pembuatan
- **Rows (Tujuan REASON_REPRINT_TICKET):** WB.NET ERROR; PRINTER ERROR/KERTAS RUSAK; SPLIT DO; SALAH TEKAN TOMBOL SAVE ATAU SAVE PRINT; REVISI DATA TIMBANGAN (DO, TRANSPORTER, NO POL, DRIVER, QUALITY, RELASI); VIEW TIKET; TIKET TIMBANGAN HILANG
- **Note on screen:** "Edit Reason tidak akan trigger Replace di Transaksi ataupun Log Transaksi"

### 4.24 Kalibrasi WB: "Daftar Sertifikasi Kalibrasi WB"

**Shot:** `107*`

- **Columns:** Kode WB, No. Sertifikasi, Tanggal Kalibrasi, Tanggal Valid, Kunci Weighing jika Tanggal Valid sudah lewat, Dibuat… The list is empty.
- **Add form:** Kode WB (SVR11, SVR13, SVR14, SVR16, SVR2, SVR20, SVR31, SVR9, WB14, …), No. Sertifikasi, Tanggal Kalibrasi, Tanggal Valid, "Kunci Weighing jika Sertifikasi sudah kadaluarsa" Iya / Tidak. I cancelled it.

### 4.25 Cancel Type

**Shot:** `108`. Menu: Aktifitas, Pilih, Tutup. Columns: Cancel Type, Description, Need Token. Rows: C CANCEL TRANSACTION (Need Token Y); R REJECT QUALITY (N).

---

## 5. Konfigurasi (dropdown)

**Shots:** `110`, `111`

**Items:**

- Koneksi Database, Pengaturan WB, Kontrol WB, Konfigurasi Hardware
- List Pengguna, Grup Pengguna
- Salin Ke Perusahaan Baru, Bandingkan Database
- Simpan Posisi Kolom, Muat Posisi Kolom
- Activation Key ▶: Maintain Activation Key Usage, Renew Activation Key for All Registered WB(s)

All secrets below are masked.

### 5.1 Koneksi Database: "Konfigurasi Database"

**Shot:** `112`

- **Fields:** Server, Nama Database, User ID, Kata Sandi, Port (all [masked])
- [Tes Koneksi]; link "Ganti Server"; computer name; Kode WB Indikator "SVR31"; [Computer List]
- Simpan (enabled only after a test), Batal, Keluar
- I closed it with Batal.

### 5.2 Pengaturan WB: "WeighBridge Setting & Configuration"

**Shots:** `113*`. Tabs: Profil Perusahaan, Konfigurasi, SAP Koneksi, System, Tool, E-Grading.

**Profil Perusahaan:** Nama / Kode Perusahaan (EU), Kode Lokasi (K1), Alamat (3 lines), Kode WB Indikator (SVR31); Informasi: Merek, Kapasitas (KG), Toleransi (KG), Nomor WB.

**Konfigurasi ▶ Pengaturan Umum:**

- Report Signature: Dibuat / Dicek / Approved by
- Ticket Signature: Disetujui Oleh
- Auto run & login using SCH Login: Tidak Dijalankan / Jalankan
- Laporan Pokok: Tanggal Masuk / Tanggal Keluar
- **"Cek Tara Truk"** ticked, Min. 5 Transactions, "Apply to All Commodity"
- **"Activate Gross History Control for FFB Receiving"** (Check Last N Minute, Weight Variance N KG)
- **Flag Color:** N hours after registration / 1st / 2nd / 3rd weighing

**Konfigurasi ▶ Pengaturan Email:** SMTP host, address, password, port [masked]; SSL; To; Domain (O365); [Tes Email].

**Konfigurasi ▶ Email Warning Field:** pick a table, then per field "Trace Only" or "Trace & Send Email". This is a field-change audit with an e-mail alert.

**Konfigurasi ▶ Sertifikat:** ISCC (No ISCC Yang Terpakai, ISCC No. [masked], Tanggal Valid, additional ISCC for FFB, Emisi GHG: Show GHG, Klausa Kakek / FFB, Standard); ISO Line 1–3. These print on the ticket.

**SAP Koneksi:**

- SAP Server, ID, password, MSS port, Client, Logon Group, System ID: all [masked]
- [Tes Koneksi], [SAP Company List]
- SAP Informasi: SAP Kode Lokasi "EU23", Tagihan Muat, Plant / Gudang (Penerimaan, Pengeluaran), Satuan, Batch, Tipe Movement, Item SO, Transisi Gudang, Tipe Unggah, Line, Gudang GI, GI Batch, Gudang GR, Tipe Transportasi, Pembongkaran GR, Item STO

**System ("Diset Oleh Administrator"):**

- Tipe Lokasi: Kilang Minyak / POM
- Language: English / French / Indonesian
- Wilayah: Indonesia / Afrika / Malaysia
- **Alur Transaksi:** Kedatangan Truk+Gatepass+Normal / Gatepass+Normal / Normal (selected)
- Truck Region
- Kontrol: Field Gudang, Ref WB, Isi Nomor Trailer, Berat Kontainer, Transaksi Tanpa Kontrak, Allow Print Gatepass After 1st Weight, Send Daily Log Email Using this PC
- Berkas Tiket: Tiket Utama "TicketRefinery_gama.rpt", Gatepass, Advise, "Langsung Ke Pencetak Bawaan"
- Otomatis Sinkronisasi Dengan Komp Ini: No
- **Sinkronisasi Ke SAP: Iya**
- 6 Digit No Ref
- **Otomatis Unggah Ke SAP: No**, start 07:00, every 1 Jam

**Tool:** [Open All Locked Record], [Open Locked Reference No. When Save Transaction], "Reset Count Edit Transaction & Edit Quantity Transaction if Already in Max 5 Times (TOKEN)" (No. Ref, [Reset Count Edit Record], [Reset Count Edit Quantity]).

**E-Grading:** server, DB, user, password [masked]; [Connect E-Grading]; Integrator; [Connect Integrator].

**Closing:** Tutup asked to confirm closing without saving. I confirmed; nothing was saved.

### 5.3 Kontrol WB: "WB Control"

**Shot:** `114`. I closed it with Cancel.

- **WB Owner:** PT ENERGI UNGGUL PERSADA
- **Global:** Allow Email ✓; Location Checksum Control ✗; Enable Master Data Copy to All Location in 1 Company ✓; Integration to SAP ✓
- **Transaction:**
  - Checked Tare of The Truck ✓ (Min 5 transactions)
  - Checked Zero on The Indicator ✓ (1st–4th)
  - Auto Close DO ✓
  - Require Entry Delivery Note Number ✗
  - Checked Tanker Capacity ✗ (Tolerance in % / in KG)
  - Rounding The Deduction ✓
  - No Other Party WB Quantity ✓
  - Control Pack Commodity Gross Weight ✓
  - Control Outgoing by DO SAP and Internal Number ✗
  - Show Warning if Factory Quality is Out of Contract Specification ✗
- **Master Data:** GR No. Customized Required in Master Data DO/Contract ✗
- **KB / Non KB:** KB, colour Blue
- **Working Time:** Begins at 07:00
- **Token:** Enable Token ✓, Area 006
- **Vessel:** Max % Tolerance for Split 85
- **Delivery Note:** Valid for 1 Month

### 5.4 Konfigurasi Hardware: "Hardware Configuration"

**Shots:** `115*`. Tabs: Port Komunikasi, Palang Pembatas, Camera, PLC Valve, Pengaturan Global.

- **Port Komunikasi:**
  - Tipe Indikator: Terus Menerus Siarkan / Sekali Siarkan / Lainnya / Continuous w/o new line / VWB (only VWB enabled). Link "Status Unavailable".
  - Communication Port (empty), Kecepatan Transmisi, Data Bits, Parity, Stopbits, Buffers; [Read], [Tes Capture]
  - Raw data view, Mulai Dari, Panjang, Karakter Sebelum "KG", Hasil 0
  - No COM port is configured on this machine.
- **Palang Pembatas (barrier gate):** No (selected) / Yes. Sub-tabs "Configuration for Bat File" and "Configuration for IP". Truk Masuk Gate 1 / 2 Open / Close commands and Truk Keluar Palang 1 / 2, each with a [Test] button. All disabled.
- **Camera:**
  - Capture Photo Enable / Disable (Disable)
  - Server / Client Destination Path, Domain / Username / Password [masked], Backup folder
  - Cameras 1–5: Web Camera or IP Camera, [Test Capture]
- **PLC Valve:** IP, Port [masked], Reg Line, Reg feedback, Start Address, Length, [Test Connect]
- **Pengaturan Global:** "Cek foto SIM Supir ketika Proses Save Registrasi"

I closed it without saving.

### 5.5 List Pengguna: "List of User"

**Shots:** `116`, `116b`, `116c`, `117`, `117b`

- **Menu:** Aktifitas, Choose, Tutup
- **Columns:** ID Pengguna, Nama Pengguna, Grup Pengguna, Tingkat Pengguna, Create By, Create Date, …, token, completed, lastLogin, lastLoginFailedReason, lastLogout, ChangeReason. There are 28 users.
- **Aktifitas:** Tambah Data Baru, Change Password, Revisi Data, Copy to Other Locations, Disactivate User, Delete, Reset Password (All Locations), Checksum Validation, Repair all Checksum, Generate Template AD
- **Add form "Add New User":**
  - ID, Nama, Kata Sandi + Ketik Ulang
  - Password rules: minimum 8 characters, letters and digits, at least 1 of each
  - **Tingkat:** 1 Administrator / 2 Manajer / 3 Tingkat Pengguna Biasa
  - **Grup:** ADMIN, MGR, SPV, OPR, LOG, WRH, MIS, BPM, EXIM, QC, SCH, DISPLAY, IA, STR
  - I cancelled it.

### 5.6 Grup Pengguna: "User Group & Authorization"

**Shots:** `118`, `118b`, `119`, `119b`

- **Groups:** ADMIN Administrator, BPM, DISPLAY, EXIM, IA Internal Audit, LOG LOGISTIC, MGR Manager, MIS, OPR Operator, QC Quality Control, SCH Synchronize, SPV Supervisor, STR STORE, WRH WAREHOUSE
- **Aktifitas:** Tambah, Revisi, Copy to Other Locations, Delete, Repair All Checksum

**Revisi form "Grup & Otorisasi Pengguna":** Kode, Nama, "Daftar Otorisasi", [Tandai], [Hapus]. The grid has Kode Aktivitas, Deskripsi Aktivitas and flags **V A E D P** (view / add / edit / delete / print [inferred]). Hint: "Klik 2x Untuk Mengganti Item Otorisasi". I cancelled it.

**The ~85 activity codes are the permission catalogue:**

- **Returns and loading:** ADD_RETUR, ALLOW_LESS_LOAD_QTY, ALLOW_MANNED_WB
- **Blacklists:** BLACK_LIST, BLACKLIST_DRIVER / TRANSPORTER / TRUCK / TRUK
- **Overrides and config:** CAPTURE_NOT_STABLE, COMM_CONT_TOL, CONFIG, CONFIG_HARDWARE
- **Controls:** CTR_CAMERA, CTR_CHECKTARE, CTR_GROSSHISTORY, CTR_SCANCARDSPB
- **Token-related:** DC_TRUSTEE ("Enable Disable Condition with Token"), DL_ADOPT, EDIT_MULTIPLE, EDIT_OPW, ENTRY_OPW, GP_EDIT_TDT, MARK_ACCIDENT
- **Master data:** MD_BLOCK, MD_CANCEL_TYPE, MD_CAPACITY, MD_COMPOSIT, MD_CONTRACT, MD_CONTROL, MD_DEDUCTED, MD_DIVISION, MD_DN, MD_DRIVER, MD_EMAIL, MD_ESTATE, MD_GRADING, MD_OPENCLOSE_CONTRA…, MD_QC, MD_REASON, MD_SAP_DESTINATION, MD_SOURCE, MD_STOCK, MD_STORAGE, MD_SYNCH ("Synchronize to ZWB"), MD_SYNCH_COMM, MD_TEMPLATE, MD_TRANS_SPLIT, MD_TRANS_TYPE, MD_TRANSPORTER, MD_TRUCK, MD_UPLOAD_TYPE_LIST, MD_VENDOR, MD_WB_CALIBRATION
- **Menu functions:** MN_DELIVERY_NOTE, MN_DISABLE_FEATURE, MN_EDIT_FLAG_UPLOAD, MN_EMAILREPORT, MN_ENTRY_BC, MN_LOADING_ENTRY(_FOR…), MN_LOGREPORT, MN_MAPPING_DESTINATION, MN_PRINT ("Reprint"), MN_PRINT_BA_SERAHTER…, MN_PRINT_SPB, MN_REFRESH_QC, MN_REGISTER_GATEPASS, MN_SPAREPART_ENTRY, MN_USERMGTREPORT, MN_WEIGHED_GATEPASS, MN_WTAREPORT
- **Session and contract:** MULTI_SESSION, NOT_ADOPTSAP ("For create contract without Adopt")
- **Tolerances and weighing:** OVER_GROSS_FFB, OVER_TARE, REGISTRATION, RESETPASS_USERLIST, RST_EDITCOUNT, TOLERANCE_COMM, TRANS, TRANS_MANUAL, TRANS_QC, TRANS_QTY, TRANS_TOLLING ("Tolling")
- **Users:** USERLIST

### 5.7 Salin Ke Perusahaan Baru: "formset"

**Shot:** `120`. "Create New Company & Location, copy from : EU - K1"; Copy to: Coy, Location, Coy Name; Process, Delete, Close. I closed it.

### 5.8 Bandingkan Database: "Compare DB"

**Shot:** `121`. Current Database; Compare With: Server, Database Name, User, Password [masked]; "Insert to Table if Field Does Not Exist", "Insert to wb_trans"; Process, Close. I closed it.

### 5.9 Activation Key ▶ Maintain Activation Key Usage

**Shot:** `122`. "Usage of Activation Key": "Below is list of computer(s) using WB.Net activation key". Grid: WB Code, Computer Name, Activated on (SVR11, SVR12, SVR13, SVR14, SVR16, …). Buttons: [Delete Activation Key], [Close]. I closed it.

### 5.10 Not opened

- **Renew Activation Key for All Registered WB(s):** [not opened]. It is an action.
- **Simpan / Muat Posisi Kolom:** [not opened]. They save or load grid column layouts [inferred].

---

## 6. Laporan (dropdown)

**Shots:** `130`–`136`

**Items:**

- Daftar Penimbangan
- Laporan Penerimaan Harian per Supplier (LA1)
- Laporan Penerimaan Harian per Supplier (LA2)
- Laporan Sisa Kuantiti WB DO
- Laporan Sisa Kuantiti WB DO Non-Trade Store
- Laporan Estimasi Penerimaan 3rd Party
- Laporan Good Receive / Good Issue
- Laporan QC
- Laporan Ringkasan Transaksi per Relasi 1
- Laporan Ringkasan Transaksi per Relasi 2
- Laporan Sisa Kuantiti WB DO per Supplier
- Laporan Gagal Sinkronisasi ke SAP
- Laporan Toleransi Produk
- Laporan Penerimaan Kapal
- Multi Line SO Outstanding Report
- Laporan Pemilik WB
- Laporan Persetujuan Tanker yang Melebihi Kapasitas
- Laporan Log ▶
  - Laporan Log Transaksi, Laporan Log Data Master, Laporan Log Pengaturan WB, Laporan Log Lokasi WB, Laporan Log Pengguna WB
  - Daftar Masuk/Keluar Pengguna dari Sistem
  - Laporan Log Otorisasi, Laporan Log Template SAP
  - Migrate Old Log to New Log
  - Cancel Registration Report, Cancel Weighing Report
- Laporan Toleransi Komoditi
- [TOKEN] Laporan Perubahan Toleransi Komoditi per Kontrak WB
- Laporan Stabilitas Indikator
- Indicator Stability Graph Report
- Laporan Manajemen Pengguna ▶
  - User List Report
  - Daftar Akses Pengguna
- Daftar Email Penerima
- Weighing Time Analysis Report
- Driver Blacklist Report

Only the reports below were opened. Each has [Proses] or [Process] and [Tutup] or [Close]. Proses shows an on-screen report [inferred from the "No Records Found" notice].

### 6.1 Daftar Penimbangan: "Report List Weighing / Transaksi Harian"

**Shots:** `133`, `133b`

- **Filters:**
  - Tipe Laporan: All / Penerimaan / Pengeluaran
  - KB / Non KB: All / KB / Non KB
  - Pada Tanggal: Dari Tanggal + time, Sampai + time
  - No Ref, Komoditi .., DO No. .., Pengangkutan .., No SIM .., Q.Standard (+ lookup), Non Q.Standard, Nomor Truck .., Tanker, Gudang, Contract No ..
  - Group By: None / Commodity
  - Termasuk Truck Gantung, Include Has not 1st Weigh
- **~60 optional column checkboxes:**
  - Tanggal/Jam Pengiriman, No DO, No Kontrak, No STO, No PO, SO No., 1xSTO, 1xDO STO, Konversi Komoditi, Ref WB Kebun, Q.Standard, Vehicle Yellow Plate, Return in KG / Pack
  - Relasi, Nama Relasi, kebun, No SIM, Nama Supir, Delivery Note, Pengangkutan, Nama Pengangkutan, Goni, Jlh Kopra, Create By, Tank, Registration In & Out
  - Nama Komoditi, Kuantiti Other (kebun Qty), Berat Kotor/Tara, Selisih, Different hour, Segel, Transaksi Otomatis, Potongan, Change By, Loss in KG / Pack
  - Interval barrier gate for 1st & 2nd weight, Interval barrier gate for 3rd & 4th weight
  - Loading Quantity, Material Stuffing, Additional Info, PI / SI No, WB Code, Surat Pengiriman, DO SAP, Internal No, Keterangan Untuk Tiket / Laporan
- **Proses** for today gave "No Records Found."

### 6.2 LA1: "Receiving Per Supplier Report (LA1)"

**Shot:** `134`. Report Type All / Good Receive / Good Issue; Date From / To; Commodity * and Supplier * (required); columns Truck Number, Transporter Name, Weighing Time, DO No, Net U/Today, Received U/Today, Gross / Tare, Bunch, Colly Copra; Hide Table Line.

### 6.3 Laporan Good Receive / Good Issue: "Laporan Barang WB Sistem"

**Shot:** `135`

- Transaction: Penerimaan / Pengeluaran; KB / Non KB
- **Nama Laporan:** Laporan Harian / Kumulatif Harian / Kumulatif Bulanan / DO Details
- Date + time range; Tipe Transaksi .., Ref No, Transporter .., Commodity .., DO No. .., Tank, Q.Standard, Non Q.Standard
- **Diurut Berdasarkan:** No DO / Relasi / Tank / Kontrak / Kebun / No PO / Komoditi
- Sisa Partai Minimal
- **~60 "Tampilan Kolom" checkboxes**, including Kualitas Kebun / Pabrik, FFB Grade, Quality Deduction KG, Outbound / Inbound, "Show OS, Until Today in Total Vendor"
- Termasuk Truk Gantung, ISO Form

### 6.4 Laporan QC: "Daftar QC"

**Shot:** `136`. Tipe Laporan Penerimaan / Pengeluaran; Pada Tanggal (Dari / Sampai); Komoditi .., Kebun .., Relasi .., DO No. ..; Show DO No., Show Outspec Material Only, Show Mill.

---

## 7. Upload To SAP

This is a direct-action top item with no dropdown. I verified that: with another menu open, moving onto it shows no dropdown (`140*`). **[not opened]:** clicking it would run the upload.

Related settings: Pengaturan WB System "Sinkronisasi Ke SAP: Iya", "Otomatis Unggah Ke SAP: No (07:00, every 1 h)"; master SAPDestinasi, Template SAP, Tipe Unggah; report "Laporan Gagal Sinkronisasi ke SAP".

## 8. Ganti Profil

A direct-action top item (`150*`). **[not opened]:** I judged it unsafe. It probably signs the session out to a login or profile form [inferred], and I do not have the app's ADMIN password, so the app might not get back to its main screen.

## 9. Keluar / Tutup Program

Not clicked. Escape on the main window raises the same exit prompt ("Apakah anda ingin keluar dari WB.Net?"); I answered No.

## 10. Sinkronisasi Data

A direct-action top item with no dropdown (`160*`). **[not opened]:** it would run a sync. Related settings: "Otomatis Sinkronisasi Dengan Komp Ini: No"; group SCH "Synchronize"; ZWB ▶ Sinkronisasi on each master.

---

## Flow as observed (test run, BEL)

All [seen] unless marked. Test data: plate ZZ 9999 TCL, SIM 9999000011112222 "TEST CLAUDE", remarks "TEST CLAUDE".

### Step 1. Masters

- Data Master > Truk > Tambah Data Baru: saved ZZ 9999 TCL (transporter "_", tara 0/0).
- Data Master > Nomor SIM > Tambah Data Baru: saved driver 9999000011112222 / TEST CLAUDE, truck ZZ 9999 TCL.
- Data Master > Tanker > Tambah Data Baru: saved TCL01, 10,000 kg, Tidak Cek. Mark-deleted straight away.
- No success messages; the row just appears.

### Step 2. Registrasi Masuk

**Validation order on Simpan:**

1. "Mohon isi plat truk!"
2. "Mohon pilih WB DO!"
3. "Mohon isi destinasi truk!"
4. "Isi berat Other Party atau centang 'No Other Party Weight'!"

Then it saved silently and created GP0508031.

**Behaviour:**

- Leaving Plat Truk fills the truck's transporter. Leaving No SIM fills the driver name.
- Picking the WB DO (BEL SK01II02-00139, remaining 200,000 of 250,000) fills commodity, contract, relation and estate. It **overwrites the transporter** with the DO's (BMS).
- Keterangan Untuk Tiket gets an automatic prefix ("PENERIMAAN CPO").
- Tanggal Registrasi on a new form shows a stale greyed date; the record gets the server time.
- No token was asked.

### Step 3. Revisi Registrasi

The same form. On Simpan it asks "Alasan Revisi/Batal" (Gatepass No., reason, Proses / Batal). No token.

### Step 4. Revisi TDT and Copy

- **Revisi TDT:** "This Gatepass is not Lock TDT. Please use edit Gatepass instead." The same before and after check-out. [inferred]: only gatepasses locked by an adopted loading note (TDT) use this; unlocking needs TOKEN_UNLOCK_TDT.
- **Copy:** a new registration prefilled with truck, transporter, driver, destination and remarks, with no DO. I cancelled it.

### Step 5. 1st weighing

Penimbangan > Mulai Penimbangan, then pick GP0508031. The form "1ST WEIGHT TRANSACTION ( 2X )" opened with Ref No EUK1503637.

- **Read Indicator:** did nothing with no indicator attached (Hardware has no COM port and indicator status "Unavailable"). No error.
- **Manual entry:** the 1st weight could be typed (30,000) and saved. No token and no "not stable" warning for ADMIN.
- After Save the gatepass chooser reopens.

### Step 6. 2nd weighing

- **Form:** "2ND WEIGHT TRANSACTION ( 2X )".
- **Weights:** typed 10,000. NET was 20,000 (Factory Bruto 30,000, Tarra 10,000).
- **QC tab:** contract spec FFA 5.000, M&I 0.500, DOBI 2.
- **Checks:** no tare or quantity tolerance warning. [inferred]: the tare check needs truck history (Cek Tara Truk min 5 transactions), and 20,000 was within the DO's remaining quantity.
- No ticket printed at this point ("Allow Print Gatepass After 1st Weight" is off).

### Step 7. Registrasi Keluar

1. "Apakah anda yakin untuk melakukan registrasi keluar?" Yes.
2. "Registrasi keluar berhasil dilakukan!"
3. An automatic print preview "Cetak Peninjauan" of the **KAWASAN BERIKAT / WEIGHBRIDGE TICKET** (menu Print / Close). I closed it; nothing was printed.

**Ticket content:**

- **Header:** company + address
- **Document:** Document, Date, DO No., Contract, PI/SI No, Relation, R. Address, D.Note, Commodity, Trans.Type (BEL PEMBELIAN), Description, Add. Info
- **Weights:** Net Receipt + Oth Pty Date, WB-code IN / OUT times, GROSS, TARE, PO, STO, RECEIVED, DEDUCTION (%), NET, +/-
- **Transport:** Transporter, Truck No., Driver Name, Seal
- **Quality:** Jenis Mutu FFA / M&I / DOBI (Estate / Factory), Deduction, L.Stuff
- **Signatures:** PREPARED BY / APPROVED BY / TRANSPORTED BY (driver + SIM)

The registration row turns green, with Di Checkout Oleh, Tanggal / Jam Keluar.

### Step 8. After check-out

- **Revisi:** adds "No Referensi <ref> ↔ [combobox]" to relink to another reference [inferred]. Delivery Note is locked.
- **Batalkan (registration):** "Registrasi tidak bisa dibatalkan karena sudah ditimbang pada referensi EUK1503637".
- **Salin Data/Sisip:** on a checked-out registration, "Can't copy transaction since truck registration has been registered out!"

### Step 9. Cancel the transaction

Penimbangan > Batalkan Transaksi:

1. "…MEMBATALKAN referensi EUK1503637 dan transaksi split terkait…" Yes.
2. "Reason for Cancel Transaction", then OK.
3. The row turns pink and stays listed (posted N).

No token for ADMIN, although Cancel Type C is marked "Need Token". Tokens are probably bypassed for ADMIN, or only enforced for lower levels or groups [inferred].

### Step 10. JUL attempt (failed by design)

Daftar Kontrak row "TEST" (JUL PENJUALAN, AASTAR, 100,000):

1. The DO WB form shows red "Mohon sinkronisasi DO WB ini ke SAPZWB".
2. Simpan gave "Please Fill Loading Note".
3. [Pilih DOSAP] gave "Please Fill Loading Note No."

A sale cannot be registered without an SAP loading note or DO SAP. Nothing was saved.

### Step 11. Mark Delete

Mark Delete worked the same way on all three masters:

1. "<key> Yakin untuk Mark Delete data ini?" Yes.
2. "Alasan Mark Delete" (key, reason), then Proses.
3. The row leaves the list (soft delete; "Show Deleted" shows it).

For Truk and SIM, Proses was followed by a .NET "Unhandled exception… There is no row at position N" (Continue). The record was still removed. This is a bug in the grid refresh [inferred].

### Tokens observed

- No action asked ADMIN for a token.
- The only token UI is Fitur > Request Special Token (form with Token Code, date range, PIN, Message, [Request for PIN]). I cancelled it; no PIN was requested.
- Kontrol WB has "Enable Token" ticked (Area 006).

---

## Test data left behind

| Item                                                        | State                                                                    | Why it remains                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registration GP0508031 (ZZ 9999 TCL)                        | checked out (green)                                                      | The app refuses to cancel a weighed registration.                                                                                                                              |
| Transaction EUK1503637 (BEL, DO SK01II02-00139, net 20,000) | cancelled (pink), reason "TEST CLAUDE CLEANUP"                           | Cancel is the app's only removal path. Whether the 20,000 kg was released back to the DO was not checked.                                                                      |
| Truck ZZ 9999 TCL                                           | mark-deleted (soft)                                                      | Still in the database under "Show Deleted".                                                                                                                                    |
| Driver SIM 9999000011112222                                 | mark-deleted (soft)                                                      | Same.                                                                                                                                                                          |
| Tanker TCL01                                                | mark-deleted (soft)                                                      | Same.                                                                                                                                                                          |
| Revision log on GP0508031                                   | reason "TEST CLAUDE"                                                     | Audit trail.                                                                                                                                                                   |
| **EUK1021866~ (existing BEL row, not mine)**                | posted flag Y→N via Fitur > Revisi Penanda Unggah > Penanda Belum Dipost | That menu item ran immediately on the selected row, with no form. It was not reverted, because "Penanda Post Ulang" might queue a re-post to SAP. **Someone should reset it.** |
| E-mail attempt                                              | opening Daftar Komoditi tried to send an e-mail and failed (SMTP error)  | Nothing was sent.                                                                                                                                                              |

Untouched: the JUL attempt, the copy of GP0508031, the manual transaction (EUK1000001) and every add form I cancelled. None of these were saved.

---

## (a) Screen to timeline rows

| Screen                                                                                                                            | Timeline rows | Note                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data Master > WB DO (Daftar Kontrak + add form tabs)                                                                              | 1–19          | Tx type 1; DO 2; contract 3; commodity 4; supplier 5; transporter 6; Kapal 7; Keterangan 8; Dipotong Oleh 9; Incoterm 10; Kuantiti 11; Toleransi 12; Kualiti Kontrak / Ambil Spesifikasi Kontrak 13; PO/STO tab 14; Detail InformasiSAP SO 15; GR PO / GR Custom 16; Detail BC + No BC / Tgl Exp BC 17; Kebun 18; Adopt dari SAP / ZWB / Adopt Ulang 19 |
| Data Master > Komoditi (+ QC and Grading sub-forms)                                                                               | 20–29         | Trade / Non Trade 20–21; Quality Control button / Isi Kualitas 22–23; SAP tab Adopt 24; Goni / Bulk-Pack 25; SAP Tipe Material Cair 26; Unit / Konversi UOM 27; Berat Bersih / Kotor 28; Cek Tara Truck 29                                                                                                                                              |
| Data Master > Relasi                                                                                                              | 30–35         | Tipe Pembeli / Penjual; adopt via Zwb ▶                                                                                                                                                                                                                                                                                                                 |
| Data Master > Truk (+ Analisis Tare)                                                                                              | 36–40         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Nomor SIM                                                                                                           | 41–46         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Pengangkutan                                                                                                        | 47–51         | [Adopt] button                                                                                                                                                                                                                                                                                                                                          |
| Data Master > Tanker & Kapasitas                                                                                                  | 52–53         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Perusahaan                                                                                                          | 54            |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Lokasi (+ Pengaturan WB SAP Kode Lokasi)                                                                            | 55–57         | CoySAP is in SAP settings and the Template SAP field coySAP                                                                                                                                                                                                                                                                                             |
| Data Master > Kebun                                                                                                               | 58–60         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Destination (Form Asal) + Fitur > TCS Mapping Truck Destination                                                     | 61–62         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Tipe Transaksi                                                                                                      | 63–64         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Deducted By                                                                                                         | 65–67         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Quality Control > QC Item                                                                                           | 68–70         |                                                                                                                                                                                                                                                                                                                                                         |
| Data Master > Email Recipients                                                                                                    | 71            |                                                                                                                                                                                                                                                                                                                                                         |
| Registrasi > Registrasi Masuk form                                                                                                | 72–82         | plate 72; transporter 73; SIM 74; No Tangki 75; Destinasi 76; Delivery Note 77; No Segel 78; No Kontainer tab 79; Other Party tab 80; DO WB tab 81; Quality Control tab (Nilai QC Kebun) 82                                                                                                                                                             |
| Registrasi Keluar + automatic ticket preview                                                                                      | 83, 89, 90    |                                                                                                                                                                                                                                                                                                                                                         |
| DO WB sub-form (Loading Note / Pilih DOSAP) + Penimbangan > Adopt Surat Pengiriman                                                | 84            | partial; no Prereg adopt screen seen                                                                                                                                                                                                                                                                                                                    |
| Revisi Registrasi                                                                                                                 | 85            |                                                                                                                                                                                                                                                                                                                                                         |
| Revisi TDT                                                                                                                        | 86            |                                                                                                                                                                                                                                                                                                                                                         |
| Batalkan (registration)                                                                                                           | 87            |                                                                                                                                                                                                                                                                                                                                                         |
| Registrasi Truk list (counters, filters)                                                                                          | 88            | partial; a list, not a dashboard                                                                                                                                                                                                                                                                                                                        |
| Potongan tab / Edit Potongan / Deduction tab                                                                                      | 91            |                                                                                                                                                                                                                                                                                                                                                         |
| Fitur > Additional Printing > Print SPB                                                                                           | 92            |                                                                                                                                                                                                                                                                                                                                                         |
| Penimbangan > Print Transaksi + Data Master > Alasan untuk Reprint                                                                | 93, 123       |                                                                                                                                                                                                                                                                                                                                                         |
| Card No. fields (greyed) in registration and weighing                                                                             | 94            | the reader itself is hardware                                                                                                                                                                                                                                                                                                                           |
| Main grid colours / Flag Color setting / Lihat Transaksi                                                                          | 95            |                                                                                                                                                                                                                                                                                                                                                         |
| Konfigurasi Hardware > Palang Pembatas                                                                                            | 96            |                                                                                                                                                                                                                                                                                                                                                         |
| Konfigurasi Hardware > PLC Valve                                                                                                  | 97–98         | partial [inferred]; no traffic light or sensor screen seen                                                                                                                                                                                                                                                                                              |
| Read Indicator + Hardware Port Komunikasi + "Checked Zero on The Indicator"                                                       | 100           |                                                                                                                                                                                                                                                                                                                                                         |
| Foto-foto Timbang 1–4 + Hardware Camera + Daftar Kamera                                                                           | 102           |                                                                                                                                                                                                                                                                                                                                                         |
| Truk tara min/max, Tare History, Analisis Tare, "Cek Tara Truk" / "Checked Tare of The Truck"                                     | 103, 128      |                                                                                                                                                                                                                                                                                                                                                         |
| "Sisa Kuantiti DO" in DO WB, Cek Kuantiti / Toleransi in WB DO                                                                    | 104, 124, 125 |                                                                                                                                                                                                                                                                                                                                                         |
| Fitur > Request Special Token > Izinkan Capture Berat saat Timbangan Tidak Stabil; Laporan Stabilitas Indikator                   | 105           |                                                                                                                                                                                                                                                                                                                                                         |
| Laporan > Daftar Penimbangan; Laporan GR/GI "Laporan Harian"                                                                      | 106           |                                                                                                                                                                                                                                                                                                                                                         |
| Laporan > Laporan Good Receive / Good Issue                                                                                       | 107           |                                                                                                                                                                                                                                                                                                                                                         |
| Laporan > Laporan QC                                                                                                              | 108           |                                                                                                                                                                                                                                                                                                                                                         |
| Upload To SAP (not opened)                                                                                                        | 109–110       |                                                                                                                                                                                                                                                                                                                                                         |
| Edit Transaction > Revisi Transaksi / Revisi Kuantiti Pabrik; Tool tab "Reset Count … (TOKEN)"                                    | 120           |                                                                                                                                                                                                                                                                                                                                                         |
| Mark Delete in masters (+ TOKEN_DELETE e-mail)                                                                                    | 121           |                                                                                                                                                                                                                                                                                                                                                         |
| Penimbangan > Batalkan Transaksi + Data Master > Cancel Type                                                                      | 122           |                                                                                                                                                                                                                                                                                                                                                         |
| WB DO menu "Set Toleransi Komoditi Untuk Pengecekan Gross Weight Komoditi Pack"; Kontrol WB "Control Pack Commodity Gross Weight" | 126           |                                                                                                                                                                                                                                                                                                                                                         |
| Pengaturan WB "Activate Gross History Control for FFB Receiving"; OVER_GROSS_FFB                                                  | 129           |                                                                                                                                                                                                                                                                                                                                                         |
| WB DO Detail BC + TOKEN_EXPIRED_BC; Kalibrasi WB lock                                                                             | 130, 134      |                                                                                                                                                                                                                                                                                                                                                         |
| Fitur > Request Special Token > Token to Edit Multiple Contracts & Transactions                                                   | 131           |                                                                                                                                                                                                                                                                                                                                                         |
| Revisi TDT (TOKEN_UNLOCK_TDT)                                                                                                     | 132           |                                                                                                                                                                                                                                                                                                                                                         |
| Fitur > Nonaktifkan Fitur                                                                                                         | 133           |                                                                                                                                                                                                                                                                                                                                                         |
| Edit Transaction > Edit Potongan                                                                                                  | 135           |                                                                                                                                                                                                                                                                                                                                                         |
| Edit Transaction > Edit Delivery Note; Penimbangan > Pengisian Delivery Note                                                      | 136           |                                                                                                                                                                                                                                                                                                                                                         |
| Edit Transaction > Edit Report Date                                                                                               | 137           |                                                                                                                                                                                                                                                                                                                                                         |
| [TOKEN] Laporan Perubahan Toleransi Komoditi per Kontrak WB; COMM_CONT_TOL                                                        | 125           |                                                                                                                                                                                                                                                                                                                                                         |

## (b) WB System functions not in the timeline

**Weighing and transactions:**

- Pecah Referensi (split) and Gabung DO
- Salin Data/Sisip Untuk Timbang 2X
- Transaksi Manual (F6, unregistered manual weighing, TOKEN_MANUAL)
- NX Multiple Weighing and Non Weighing types
- Pengisian Loading Quantity / Density
- Pengisian Sparepart Quantity
- Pengisian Other Party Weight after weighing (EDIT_OPW)
- Pengisian Return Qty (retur, RTB / RTJ)
- Adopt Surat Pengiriman (sugar delivery letter)
- Revisi Kuantiti Pabrik
- Perbaiki Checksum / Perbaiki Semua Checksum
- Tare History viewer
- Copy registration

**Fitur:**

- Lihat Transaksi DO (+ container lookup, Excel export)
- Mark Accident
- Auto Split / Merge DO Kapal (vessel)
- TCS: Refresh QC from TCS
- Token to Allow Manned Weighing (unmanned mode)
- Revisi Penanda Unggah (posted flag)
- View Sparepart

**Masters:**

- Tipe Unggah, SAPDestinasi, Gudang
- QC Komposisi
- Template SAP (upload field map)
- Pemetaan Komoditi–Tipe Transaksi (GR Custom obligation)
- Daftar Kamera
- Alasan untuk Reprint (reason list)
- Kalibrasi WB (certificate, lock weighing when expired)
- Cancel Type
- Blacklist for truck / driver / transporter / relation
- Driver SIM photo
- Grading Control (FFB formulas)
- Commodity types FFB / Copra / Gula
- WB DO extras: Lock Bongkar, Isi PIN, Tutup DO, Map Kapal DO, Delivery Note, Diagnostik, opening balances (Pembukaan), DO conversion unit
- "Salin ke Semua Lokasi"

**Konfigurasi:**

- DB connection
- Company profile
- Report and ticket signatures
- Flag colours
- SMTP settings
- Email Warning Field (field-change tracing)
- ISCC / GHG / ISO certificate text on the ticket
- SAP connection and SAP defaults
- System (transaction flow, language, region, ticket report file, auto sync / upload schedule, 6-digit ref)
- Tool (unlock records, reset edit counters)
- E-Grading integration
- Kontrol WB global switches
- Hardware (indicator COM, barrier, cameras, PLC valve)
- Users and groups with ~85 permission codes (V / A / E / D / P)
- Copy to new company
- Compare DB
- Activation keys
- Save / load column layout

**Reports:**

- LA1 / LA2 per supplier
- Sisa Kuantiti WB DO (3 variants)
- Estimasi Penerimaan 3rd Party
- Ringkasan per Relasi 1 / 2
- Gagal Sinkronisasi ke SAP
- Toleransi Produk / Komoditi
- Penerimaan Kapal
- Multi Line SO Outstanding
- Pemilik WB
- Tanker over capacity approvals
- Log reports (transaction, master, settings, location, user, login / logout, authorization, SAP template, cancel registration, cancel weighing)
- Indicator stability (+ graph)
- User management reports
- Email recipient list
- Weighing Time Analysis
- Driver Blacklist

**E-mail notifications and reports:** EDIT_WARNING, CANCEL_WARNING, WB_CONTROL, LOG_*, REP_QC, WEIGHING_ANALYSIS, INDICATOR_STABILITY, LOCK_BONGKAR, RETURN_QTY, WB_CALIBRATION.

**Other:** Ganti Profil; Sinkronisasi Data (manual sync); Desksupport link.

## (c) Timeline rows (outside VCF, Prereg, Dashboard) with no matching screen

- **8 Notes:** probably the Keterangan field in WB DO [inferred]. There is no separate notes screen.
- **84 Adopt by Loading Note / Prereg:** only the Loading Note / DO SAP fields and the error "Please Fill Loading Note" were seen. There is no prereg adopt screen.
- **88 Dashboard registrasi:** only the list counters. There is no dashboard.
- **94 Tap RFID Pole:** only greyed Card No. fields. It is done by hardware, with no configuration screen seen.
- **97 Traffic Light Status:** no screen. It may be in PLC Valve [inferred].
- **98 Cek sensor:** no screen.
- **99 Tampilkan data di layar Kiosk WB:** no screen.
- **101 Check human & perimeter WB using AI camera:** no screen. The camera settings are capture-only. This looks new.
- **109–110 Upload pembelian / penjualan:** the menu exists but was not opened (it runs an action). The SAP template and destination masters exist.
- **124 Over Quantity, 125 Tolerance, 127 Over Netto Tolerance For WB Filling, 128 Over Tare, 129 Over Gross FFB, 130 expired BC, 134 Over BC quantity:**
  - There is no dedicated screen. These are checks and token prompts during weighing that the test did not trigger.
  - Their existence is evidenced by settings, permissions and e-mail codes: OVER_TARE, GROSS_FFB, EXPIRED_BC, TOKEN_COMM_CONT_TOL.
  - No "over BC quantity" or "WB filling" code was seen.
- **127 Over Netto Tolerance For WB Filling:** nothing specific seen.

---

## Screens not opened, and why

- **Upload To SAP, Sinkronisasi Data:** direct-action top items that would run an upload or sync.
- **Ganti Profil:** a direct action. It could sign the session out, and the app password is not available.
- **Keluar, Tutup Program:** forbidden.
- **Penimbangan > Print Transaksi:** may print.
- **Penimbangan > Perbaiki Checksum, Perbaiki Semua Checksum:** direct actions.
- **Fitur > Additional Printing > Print SPB:** printing.
- **Fitur > Revisi Penanda Unggah > Penanda Post Ulang:** an action that may re-post to SAP.
- **Konfigurasi > Activation Key > Renew Activation Key for All Registered WB(s):** an action.
- **Konfigurasi > Simpan / Muat Posisi Kolom:** direct actions.
- **Laporan:** only Daftar Penimbangan, LA1, GR/GI and QC were opened. The other ~25 reports are listed from the menu only.
- **WB DO menu items** (Ubah Lock Bongkar, Isi PIN, Tutup DO, Map Kapal DO, Delivery Note, Diagnostik, the Set Toleransi items, ZWB ▶ sync): listed only. They act on real DOs or sync with SAP.
- **Master "ZWB ▶" and "Salin ke Semua Lokasi ▶" submenus:** not opened. They sync or copy.
