# Inventaris tabel dari sistem lama

**Status: draf ditinjau** (2 November 2026). Jawaban atas bagian C dicatat sebagai keputusan K-18 s.d. K-22 (di `BLUEPRINT.md` dan `TECHNICAL.md`).

Nama tabel di database baru mengikuti aturan penamaan di `TECHNICAL.md` (`mst_`, `awb_`, `sys_`), jadi nama lama di bawah hanya acuan.

Keputusan dasarnya adalah K-13: database baru, dengan struktur tabel disalin dari sistem lama secara selektif dan boleh diubah.

| Usulan | Artinya |
|---|---|
| **Salin** | Struktur dipakai hampir apa adanya |
| **Ubah** | Dipakai dengan perubahan |
| **Ditunda** | Fitur di luar fase ini |
| **Tidak dipakai** | Tidak dibawa ke sistem baru |
| **Keputusan** | Perlu keputusan Anda (lihat bagian C) |

Rincian kolom tidak ditulis di sini, karena sumbernya masih bisa dibaca langsung:

- **customer_prereg:** `dump-cust_prereg_dev-202603110914.sql`
- **VCF:** `vcs_be_dynamic/database/migrations/`
- **WB.NET:** model `Wb*.php` di VCF

## Ringkasan

| Sumber | Tabel | Salin | Ubah | Ditunda | Tidak dipakai | Keputusan |
|---|---|---|---|---|---|---|
| customer_prereg (PostgreSQL) | 44 | 27 | 9 | 3 | 5 | — |
| VCF / TCS (SQL Server) | 34 | 15 | 10 | — | 8 | 1 |
| WB.NET (SQL Server, terlihat dari kode) | 7 | 2 | 4 | — | 1 | — |
| AgentWBController (MySQL) | 2 | — | — | — | 2 | — |

---

## A. Customer Pre-Registration → database baru PostgreSQL (`prereg`)

Temuan penting:

- **Dump database cocok dengan branch `dev_1.3.1/bc`, bukan `production`.** Branch `bc` sekitar 4.900 baris lebih maju dan sudah punya dukungan PO sebagian (`PODETAILSet`, `POVENDSet`, `GetSpentQtyPO`), tetapi pemeriksaan sisa kuantitas PO saat simpan masih dikomentari.
- **JUL dan BEL tidak ditulis eksplisit di kode.** Jenis transaksi ditebak dari kolom yang terisi (`id_do`, `id_po`, `id_sto`). Di database baru, jenis transaksi ditulis sebagai kolom sendiri.
- **Alur LN hanya punya dua posisi**, yaitu `INIT` (customer) dan `FINA` (Logistik HO). Tidak ada status tolak/revisi, dan tidak ada tabel riwayat approval atau audit.
- **Dua masalah keamanan yang tidak ikut disalin:**
  - peran pengguna dibaca dari cookie yang diatur oleh frontend
  - kunci JWT dipakai juga untuk mengenkripsi password SAP dan WB.NET

### Loading note (surat jalan)

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `loading_note_hd` | Ubah | Tambah jenis transaksi (JUL/BEL) dan nomor dokumen (DO/Kontrak untuk JUL, PO untuk BEL). Kolom khusus JUL (`con_num`, `invoice_type`, toleransi, `is_paid`, `buyer_name`, `trg_cust`, `ref_id_do`) menjadi opsional. Hapus UNIQUE ganda. |
| `loading_note_det` | Ubah | Kunci utama cukup `det_id`. Hasil timbang dari pabrik dan status posting SAP (7 pasang kolom `zwbs_*`/`zdo_trx_*`) dipindah ke tabel tersendiri. |
| `ln_type` | Ubah | Tambah dimensi jenis transaksi untuk BEL. Nilai DOTYPE pembelian ditanyakan ke tim SAP. |
| `ln_notickets` (view) | Ubah | Penomoran tiket memakai tabel atau sequence penomoran. |
| `multi_ln_hd`, `multi_ln_det` | Ditunda | Multi-DO ditunda (PRD D-02). |
| `tolling` | Ditunda | Tolling ditunda (PRD D-02). |
| `transaction_lock` | Tidak dipakai | Diganti penguncian transaksi database. |
| `req_drvr_vhcl` | Salin | Approval pendaftaran supir/kendaraan (LOG → ADM → SUC / REJ). |

### Pengguna dan akses

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `mst_user` | Ubah | Relasi peran ke `mst_role` dibuat jelas; akun customer dan vendor (vendor untuk BEL). |
| `mst_role`, `mst_page`, `mst_page_access` | Salin | Tambah relasi (FK) yang hilang. |
| `mst_email`, `mst_telf` | Ubah | Perbaiki tipe kolom `update_by`. |
| `otp_transaction` | Salin | OTP pendaftaran. |
| `session_sap` | Salin | Kredensial SAP petugas, dipakai saat Logistik approve (K-22). Akses SAP lain memakai satu akun bersama (`SAP_API_CREDENTIALS`). |
| `mst_user_api` | Salin | Akun layanan, misalnya untuk sinkronisasi dengan pabrik. |
| `mst_usr_to_cust`, `mst_usr_to_plt` | Salin | Satu pengguna untuk beberapa customer/pabrik. |
| `mst_email_mgr` | Salin | Daftar CC manager per pabrik. |

### Master data

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `mst_customer`, `mst_vendor`, `mst_interco` + view `master_bp_code` | Salin | Cache mitra dari SAP; `mst_vendor` dipakai untuk BEL. |
| `mst_company`, `mst_company_plant`, `mst_cities` | Salin | |
| `mst_material`, `mst_batch`, `mst_incoterm`, `master_tp`, `mst_key` | Salin | |
| `mst_sloc`, `mst_sloc_comp`, `mst_sloc_plant`, `mst_valtype_comp`, `mst_valtype_plant`, `mst_default_sloc_valtype` | Salin | Aturan sloc/valtype perlu dicek untuk BEL karena arah barangnya terbalik (masuk, bukan keluar). |
| `mst_contract` | Ubah | Hold quantity dikunci per jenis transaksi + nomor dokumen, bukan `id_do` saja. |
| `mst_driver`, `mst_vehicle` | Ubah | Kunci utama disederhanakan; berisi data pribadi. Perlu diputuskan apakah menjadi master yang dikirim ke pabrik (bagian C). |
| `mst_wbnet_conn` | Tidak dipakai | WB.NET diganti; tabel ini berisi kredensial. |
| `hostname` | Tidak dipakai | Diganti konfigurasi aplikasi. |
| `mst_valtype`, `mst_delivord` | Tidak dipakai | Tidak dipakai di kode lama. |

### Tabel baru (belum ada di sistem lama)

- Riwayat approval dan audit (PRD FR-043).
- Registrasi oleh petugas HO untuk truk tanpa Customer Pre-Registration (PRD FR-047).
- Antrean pesan ke pabrik (outbox), memakai amplop `@awb/contracts`.
- Hasil dari pabrik per LN: berat dan status perjalanan.
- Status posting SAP per langkah.

### Integrasi luar (bukan tabel kita)

- Staging Oracle (`PREREG_LOADING_NOTE_SAP`, `ZWB_PARK`, dan lain-lain) dan SAP OData `ZGW_REGISTRA_SRV` tetap dipakai.
- Untuk BEL: `PODETAILSet` dan `POVENDSet` (sudah ada di branch `bc`), posting GRPO, dan DOTYPE pembelian (dari tim SAP).

---

## B. Sistem pabrik → database baru SQL Server (`site`)

Temuan penting:

- **Aplikasi Android TCS memakai 27 endpoint.** Tabel yang dipakai aplikasi harus tetap ada dalam bentuk yang cocok (lihat keputusan C3).
- **Inti TCS hanya dua tabel:** `mst_flows` dan `mst_flow_stages`, ditambah pengaturan JSON per tahap. Keduanya disalin.
- **Data master VCF tidak punya layar admin.** Alur, pengguna, controller, kartu dan tangki hanya diisi lewat seeder. Sistem baru perlu layar admin (PRD UI-16).
- **WB.NET hanya pernah dibaca oleh VCF.** Struktur aslinya (tipe kolom, indeks, tabel lain) tidak ada di kode mana pun, jadi perlu ekspor struktur dari database WB.NET.
- **`vcs_weight_bridge` (135 kolom) adalah salinan tiket WB.NET.** Tabel ini tidak diperlukan lagi karena timbangan baru menulis datanya sendiri.

### Pengguna dan akses (dipakai aplikasi Android)

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `mst_users` | Ubah | Hapus kolom `token` lama (sudah diganti `mst_auth_tokens`). |
| `mst_roles`, `mst_user_roles` | Salin | |
| `mst_auth_tokens` | Ubah | Tambah relasi ke `mst_users`. Dipakai login aplikasi. |
| `mst_fcm_tokens` | Salin | Notifikasi aplikasi. |

### Alur TCS

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `mst_commodities` | Ubah | Digabung dengan komoditas WB.NET (`wb_commodity`). |
| `mst_flows` | Ubah | Wajib unik per komoditas + jenis transaksi; versi alur sesuai PRD. |
| `mst_flow_stages` | Ubah | Ada versi, dan tidak dihapus lalu diisi ulang saat seeding (sekarang riwayat lama jadi menunjuk tahap yang hilang). Flag siklus yang tidak dipakai dihapus. |
| `mst_tanks`, `mst_holes` | Salin | |

### Perjalanan truk dan stasiun

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `vcs_registrations` | Ubah | Menjadi tabel **journey**. Tambah asal registrasi, id pre-registration/registrasi dan kode pabrik. Kolom CCTV dipindah ke tabel pemeriksaan AI/OCR. |
| `vcs_tap_records` | Ubah | Tambah tap pertama/kedua di timbangan. |
| `vcs_stage_submissions`, `vcs_stage_photos`, `manager_checks` | Salin | Dipakai aplikasi Android. |
| `vcs_cancel_requests`, `vcs_driver_infractions`, `vcs_driver_photo_revisions` | Salin | |
| `vcs_report_registrations` | Salin | Ringkasan untuk laporan. |
| `vcs_readopt_requests` | Keputusan | "Re-adopt" berarti mengambil ulang data dari WB.NET. Setelah WB.NET diganti, ini tidak relevan lagi, padahal aplikasi Android punya layarnya. |
| `vcs_card_revisions` | Ubah | Menjadi riwayat pengikatan kartu (PRD FR-009). Sekarang tidak dipakai kode. |
| `vcs_invalid_cctv_wb` | Tidak dipakai | Tidak dipakai kode. |

### Timbangan dan perangkat

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `vcs_weight_bridge` | Tidak dipakai | Diganti tabel tiket dan penimbangan baru. |
| `vcs_cctv_logs` | Ubah | Menjadi pemeriksaan AI/OCR; tambah hasil baca pelat. |
| `mst_controllers` | Ubah | Tetap dengan `gate_config`; password CCTV jangan disimpan polos. |
| `mst_rfid_cards`, `vcs_bypass_card_taps`, `vcs_controller_events` | Salin | |

### WB.NET (diganti; menjadi dasar rancangan tabel timbangan baru)

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `wb_gatepass` | Ubah | Tiket timbang. |
| `wb_transaction` | Ubah | Rekaman penimbangan, dibuat pada tap kedua. Tanggal dan jam yang sekarang terpisah digabung menjadi satu kolom waktu. |
| `wb_transDO` | Ubah | Dokumen per tiket (DO/PO/kontrak), termasuk pecah DO. |
| `wb_TransQC` | Ubah | Hasil kualitas per parameter (nilai supplier dan pabrik). |
| `wb_driver`, `wb_transporter` | Salin | Master; sumber utamanya perlu diputuskan (bagian C). |
| `wb_commodity` | Tidak dipakai | Digabung ke `mst_commodities`. |

### AgentWBController (MySQL) dan framework Laravel

| Tabel lama | Usulan | Catatan |
|---|---|---|
| `tbUserCard` | Tidak dipakai | Diganti `mst_rfid_cards`. |
| `tbTransLog` | Tidak dipakai | Diganti `vcs_tap_records` dan `vcs_controller_events`. |
| `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `sessions` | Tidak dipakai | Khusus Laravel. |

### Tabel baru (belum ada di sistem lama)

- Cache pre-registration dari HO dan antrean sinkronisasi (inbox/outbox/checkpoint).
- Registrasi tanpa Customer Pre-Registration (asal `driver_entry` / `ho_staff_entry`).
- Sesi timbang dua tap.
- Pemeriksaan AI/OCR.
- Riwayat pengikatan kartu.
- Audit.
- Posting SAP.
- Versi alur yang dipakai setiap journey.

---

## C. Keputusan

| No | Jawaban | Keputusan |
|---|---|---|
| 1 | Branch `dev_1.3.1/bc` (66 commit lebih maju dari `production`, belum digabung), ditambah 2 perbaikan terbaru di `production` | K-18 |
| 2 | Ya. Dikelola di Customer Pre-Registration, dikirim ke pabrik tujuan saat Logistik approve; integrasi SAP menyusul | K-19 |
| 3 | Ya, API meniru VCF | K-20 |
| 4 | Saat Logistik approve: akun SAP petugas, seperti aplikasi lama. Akses SAP lain: satu akun bersama seperti warehouse_management (`SAP_API_CREDENTIALS`) | K-21 → K-22 |
| 5 | Belum tahu | terbuka |
| 6 | Kemungkinan bisa | tindak lanjut |

Pertanyaan aslinya:

1. **Branch acuan customer_prereg:** `dev_1.3.1/bc` (cocok dengan database dan sudah ada dukungan PO sebagian) atau `production`? Saran: **`dev_1.3.1/bc`**.
2. **Master supir, kendaraan dan transporter:** sekarang tersebar di customer_prereg (`mst_driver`, `mst_vehicle`) dan WB.NET (`wb_driver`, `wb_transporter`). Saran: **dikelola di HO lalu dikirim ke pabrik**, menggantikan pengiriman ke WB.NET.
3. **API untuk aplikasi Android:** layanan pabrik menyediakan endpoint dengan alamat dan format jawaban yang sama dengan VCF (`{success, message, data}`)? Saran: **ya**, supaya aplikasi cukup diganti alamat servernya.
4. **`session_sap`:** tetap menyimpan password SAP pengguna, atau diganti akun layanan SAP? Saran: **akun layanan**.
5. **Re-adopt di aplikasi Android:** layarnya dihilangkan, atau dipakai ulang untuk koreksi data tiket di sistem baru?
6. **Struktur asli WB.NET:** bisakah diekspor struktur tabelnya (tanpa data) dari salah satu database WB.NET? Ini dibutuhkan supaya fungsi timbangan baru setara dengan WB.NET (PRD O-01).
