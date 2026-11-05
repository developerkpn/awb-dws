# Catatan Teknis AWB-DWS

Untuk tim pengembang. Ringkasan untuk manajemen ada di `BLUEPRINT.md` dan dicetak sebagai PDF. Keputusan dan riwayat memakai nomor bersama dengan blueprint (K-xx, R-xx).

## Cara memperbarui

Perbarui dokumen ini **dalam perubahan yang sama** setiap kali Anda:

- menambah, mengganti nama atau menghapus aplikasi, domain, modul, fitur frontend, adapter perangkat atau paket bersama
- menambah atau mengubah endpoint, model Prisma, migrasi atau contract
- menyambungkan sistem luar (sinkronisasi HO, SAP, controller, kamera, printer)
- mengambil keputusan teknis

Mana yang masuk ke mana:

| Hal | Dokumen |
|---|---|
| Daftar teknis (bagian A–H), keputusan teknis, riwayat teknis | `TECHNICAL.md` |
| Progres per area, keputusan yang berdampak ke bisnis, hal yang perlu diputuskan, riwayat yang penting bagi manajemen | `BLUEPRINT.md`, dengan bahasa sederhana |

Langkahnya:

1. Isi atau ubah baris di bagian A–H. Tulis identifier sebagai inline code persis seperti yang dicetak `npm run check:blueprint` (pola modul: `<system>/<role>/domains/<domain>/<module>`).
2. Status teknis: **direncanakan** (sudah disepakati, belum ada kode) · **kerangka** (sudah tersambung, logika masih sementara) · **dikerjakan** · **selesai** · **dihentikan**.
3. Cantumkan kebutuhan yang dipenuhi (PRD `FR-xxx`, `UI-xx`, keputusan `D-xx` atau hal terbuka `O-xx`) bila ada.
4. Bila progres sebuah area berubah, perbarui juga bagian 3 di `BLUEPRINT.md` (status: Belum mulai · Persiapan · Dikerjakan · Selesai).
5. Tambahkan baris riwayat dengan nilai **sebelumnya**, **sekarang** dan **alasannya**: di sini untuk hal teknis, di `BLUEPRINT.md` untuk hal yang penting bagi manajemen.
6. Sebelum blueprint dibagikan, buat ulang PDF: `npm run blueprint:pdf` (sekali saja: `npm run docs:setup`).

Aturan riwayat (berlaku untuk kedua dokumen):

- Daftar, progres dan hal yang perlu diputuskan menggambarkan **kondisi sekarang** dan boleh diubah. Nilai lamanya disimpan di riwayat.
- Riwayat **hanya boleh ditambah**. Baris lama tidak diubah atau dihapus; koreksi ditulis sebagai baris baru.
- Keputusan **tidak dihapus atau ditimpa**. Bila keputusan berubah, tambahkan keputusan baru (K-xx berikutnya) dan ubah status keputusan lama menjadi "digantikan oleh K-xx". Hanya kolom Status yang boleh berubah.
- Nomor K-xx dan R-xx dipakai bersama di kedua dokumen; ambil nomor berikutnya yang belum terpakai.

`npm run check` menjalankan `npm run check:blueprint`, yang gagal bila:

- kode memiliki sesuatu yang tidak tercantum di bagian A–H; endpoint dan keputusan tidak terdeteksi otomatis, jadi catat sendiri
- baris riwayat diubah atau dihapus, atau keputusan dihapus atau ditimpa, di salah satu dokumen, dibandingkan dengan commit terakhir (di CI, set `BLUEPRINT_BASE`, misalnya `origin/main`)
- salah satu dokumen berubah tanpa baris riwayat baru

Pemeriksaan ini juga memberi peringatan bila PDF lebih lama dari `BLUEPRINT.md`.

## Arsitektur

![Arsitektur: Customer Pre-Registration di AWS dan sistem pabrik on-premise, tersinkronisasi dua arah.](docs/project-files/assets/diagrams/architecture.png)

Susunan folder, aturan dan perintah ada di `README.md`. Penamaan tabel dan kolom ada di `docs/design/penamaan-tabel.md`, protokol controller di `docs/design/protokol-controller.md`.

## Aturan penamaan tabel

Tabel master memakai awalan `mst_`, tabel transaksi `awb_`. Kolom memakai `snake_case`, dengan `id`, `<tabel>_id`, `is_`, `_at`, `_date` dan `_by`. Aturan lengkap dan contohnya ada di `docs/design/penamaan-tabel.md`.

## Keputusan teknis

| ID | Tanggal | Keputusan | Alasan | Status |
|---|---|---|---|---|
| K-01 | 2026-11-02 | Satu repositori; aplikasi dikelompokkan per sistem (`apps/prereg`, `apps/site`) | Ketiga aplikasi lama berada di satu tempat dengan pemisahan yang jelas | berlaku |
| K-02 | 2026-11-02 | WB.NET dan TCS menjadi domain di dalam satu layanan pabrik, bukan aplikasi terpisah | Keduanya memakai satu database pabrik dan harus tersimpan bersamaan | berlaku |
| K-03 | 2026-11-02 | Usulan awal: aplikasi gateway terpisah untuk perangkat timbangan | Memisahkan koneksi perangkat dari layanan utama | digantikan oleh K-04 |
| K-04 | 2026-11-02 | Koneksi perangkat ada di layanan pabrik (TCP ke controller, 2 per jembatan timbang); kiosk hanya menampilkan | Keputusan pemilik kebutuhan | berlaku |
| K-05 | 2026-11-02 | Usulan awal: pnpm workspaces | Aturan dependensi yang lebih ketat | digantikan oleh K-06 |
| K-06 | 2026-11-02 | npm workspaces dan Turborepo | Preferensi pemilik | berlaku |
| K-07 | 2026-11-02 | TypeScript 7 (versi terbaru) | Versi terbaru saat kerangka dibuat | digantikan oleh K-08 |
| K-08 | 2026-11-02 | TypeScript dikunci di versi 6.0 | dependency-cruiser dan typescript-eslint belum mendukung TypeScript 7 | berlaku |
| K-09 | 2026-11-02 | Aturan pemisahan modul diperiksa otomatis (dependency-cruiser) | Menjaga batas antar aplikasi, domain, perangkat dan akses data | berlaku |
| K-11 | 2026-11-02 | Prisma 7.10.1 dengan driver adapter | Rilis stabil; tag `latest` di npm menunjuk ke kandidat rilis 8.0 | berlaku |
| K-12 | 2026-11-02 | Blueprint dengan riwayat yang tidak ditimpa, diperiksa otomatis dan dicetak sebagai PDF | Manajemen dapat melihat kondisi terkini sekaligus perjalanan perubahannya | berlaku |
| K-14 | 2026-11-02 | Format pesan controller diambil dari VCF; controller di Priscolin diasumsikan bertipe sama | Keputusan pemilik kebutuhan; dipastikan saat survei/FAT | digantikan oleh K-17 |
| K-17 | 2026-11-02 | Format tap RFID dan perintah controller sama persis dengan VCF (boleh diperbaiki bila perlu); logika sensor auto-close barrier dapat berubah karena jenis sensor berbeda | Keputusan pemilik kebutuhan | berlaku |
| K-18 | 2026-11-02 | Acuan struktur customer_prereg adalah branch `dev_1.3.1/bc`, ditambah 2 perbaikan terbaru di `production` | `bc` 66 commit lebih maju, cocok dengan database dan sudah mendukung PO sebagian | berlaku |
| K-20 | 2026-11-02 | Layanan pabrik menyediakan API dengan alamat dan format yang sama dengan VCF untuk aplikasi Android | Aplikasi cukup diganti alamat servernya | berlaku |
| K-23 | 2026-11-02 | Blueprint untuk manajemen (`BLUEPRINT.md`, dicetak PDF) dipisah dari catatan teknis (`TECHNICAL.md`) | Blueprint terlalu teknis untuk manajemen | berlaku |
| K-24 | 2026-11-02 | Satu file `prisma/schema.prisma` per aplikasi (prereg dan site), berisi semua model aplikasi itu | Lebih rapi daripada satu file `.prisma` per domain/modul | berlaku |
| K-25 | 2026-11-02 | Nama tabel memakai awalan `mst_` (master), `awb_` (transaksi) dan `sys_` (teknis), `snake_case` dan bentuk tunggal | Jenis data langsung terlihat dari nama tabelnya | digantikan oleh K-27 |
| K-26 | 2026-11-02 | Schema database dibiarkan kosong (tanpa model dan migrasi); tabel dan migrasi pertama dibuat tim pengembang mengikuti aturan penamaan. Modul contoh tetap ada sebagai kerangka dan menyimpan data sementara di memori | Tabel dirancang oleh tim; repo hanya memberi kerangka dan panduan | berlaku |
| K-27 | 2026-11-03 | Aturan nama tabel cukup dua awalan: `mst_` untuk data master dan `awb_` untuk data transaksi; selebihnya bebas asal jelas | Aturan K-25 terlalu ketat; keputusan pemilik kebutuhan | berlaku |
| K-28 | 2026-11-03 | Nama kolom memakai `snake_case` berbahasa Inggris: kunci utama `id`, relasi `<tabel>_id`, ya/tidak `is_`/`has_`, waktu `_at`, tanggal `_date`, pengguna `_by`; setiap tabel punya `created_at` dan `updated_at` | Tim butuh panduan singkat yang sama untuk kedua database | berlaku |

## Riwayat teknis

| No | Tanggal | Area | Sebelumnya | Sekarang | Alasan / referensi |
|---|---|---|---|---|---|
| R-004 | 2026-11-02 | Repositori | — | Kerangka repositori: aplikasi prereg dan site, paket bersama, aturan pemisahan modul dan pengujian | K-01, K-02, K-09 |
| R-005 | 2026-11-02 | Perangkat | Usulan aplikasi gateway terpisah untuk perangkat | Koneksi TCP ke controller di layanan pabrik; kiosk hanya tampilan | K-03 → K-04 |
| R-006 | 2026-11-02 | Tooling | Usulan pnpm; TypeScript 7 | npm workspaces; TypeScript 6.0 | K-05 → K-06; K-07 → K-08 |
| R-007 | 2026-11-02 | Database | Engine belum ditetapkan (PRD O-06); repository menyimpan data sementara di memori | PostgreSQL untuk Customer Pre-Registration dan SQL Server untuk pabrik, dengan migrasi awal | PRD D-19, PRD v0.4; K-10, K-11 |
| R-008 | 2026-11-02 | Dokumentasi | — | Blueprint dengan pemeriksaan otomatis, riwayat yang tidak ditimpa dan versi PDF | K-12 |
| R-010 | 2026-11-02 | Perangkat | Format pesan controller belum diketahui | Format diambil dari VCF (`:W1<kartu>!`, `:INPn!`, `:PING!`, `:OPENn!`); belum diterapkan | K-14 |
| R-014 | 2026-11-02 | Perangkat | Controller Priscolin diasumsikan sama dengan VCF | Format tap RFID dan perintah sama persis; logika sensor auto-close barrier dapat berubah | K-14 → K-17 |
| R-015 | 2026-11-02 | Dokumentasi | — | Inventaris tabel sistem lama (usulan salin/ubah/tidak dipakai) dan protokol controller lengkap ditulis di `docs/design/` | K-13, K-17 |
| R-016 | 2026-11-02 | Database | 6 pertanyaan terbuka di inventaris tabel; API aplikasi Android belum diputuskan | 4 diputuskan: acuan branch, master supir/kendaraan/transporter di HO, API meniru VCF, akun layanan SAP; layar re-adopt dan ekspor struktur WB.NET masih terbuka | K-18 s.d. K-21 |
| R-017 | 2026-11-02 | Perangkat | R-010 menulis format input controller sebagai `:INPn!` | Koreksi: format input yang benar adalah `:INP<n><0/1>;`, diakhiri titik koma (lihat `docs/design/protokol-controller.md`) | Koreksi atas R-010 |
| R-019 | 2026-11-02 | Dokumentasi | Blueprint berisi hal untuk manajemen dan hal teknis sekaligus | Blueprint (manajemen, PDF) memakai bahasa sederhana; keputusan teknis, riwayat teknis dan daftar teknis pindah ke `TECHNICAL.md` tanpa mengubah isi barisnya | K-23 |
| R-020 | 2026-11-02 | Database | Satu file `.prisma` per domain/modul di folder `prisma/schema/` | Satu `prisma/schema.prisma` per aplikasi; model dan migrasi tidak berubah | K-24 |
| R-021 | 2026-11-02 | Database | Belum ada aturan penamaan tabel | Awalan `mst_` (master), `awb_` (transaksi) dan `sys_` (teknis), `snake_case`, bentuk tunggal | K-25 |
| R-022 | 2026-11-02 | Database | Model contoh `Journey` dan `PreRegistration` dengan migrasi awal di kedua database | Schema tanpa model dan migrasi; modul contoh tetap ada dan menyimpan data sementara di memori; tabel contoh di database lokal dihapus | K-26 |
| R-023 | 2026-11-03 | Database | Awalan `mst_` (master), `awb_` (transaksi) dan `sys_` (teknis), `snake_case`, bentuk tunggal, aturan model dan kolom Prisma | Hanya awalan `mst_` (master) dan `awb_` (transaksi); selebihnya bebas asal jelas | K-25 → K-27 |
| R-024 | 2026-11-03 | Perangkat | `docs/design/protokol-controller.md` merujuk beberapa sumber dan membandingkan dua implementasi lama | Hanya merujuk kode VCF di GitHub; isinya fungsi tiap relay dan input, dan cara layanan pabrik menanganinya (satu koneksi, tap, auto-close, buka dari aplikasi, sirene) | Permintaan pemilik kebutuhan; K-17 |
| R-025 | 2026-11-03 | Infrastruktur | Jaringan Docker database lokal dipilih otomatis oleh Docker (`172.22.0.0/16`), bentrok dengan jaringan kantor sehingga server internal di `172.22.x.x` tidak terjangkau | Subnet dipatok ke `192.168.243.0/24` di `infra/dev/compose.yaml` | Jaringan kantor memakai `172.22.0.0/16` |
| R-026 | 2026-11-03 | Database | Belum ada aturan nama kolom | `snake_case` berbahasa Inggris dengan `id`, `<tabel>_id`, `is_`/`has_`, `_at`, `_date`, `_by`; setiap tabel punya `created_at` dan `updated_at` | K-28 |
| R-027 | 2026-11-03 | Dokumentasi | `docs/design/inventaris-tabel.md`: usulan salin/ubah/tidak dipakai untuk setiap tabel sistem lama | `docs/design/penamaan-tabel.md`: panduan singkat nama tabel dan kolom; struktur tabel lama dilihat langsung oleh tim. Keputusan dari inventaris tetap di K-18 s.d. K-22, hal terbuka tetap di `BLUEPRINT.md` | Permintaan pemilik kebutuhan |
| R-028 | 2026-11-03 | Pengujian | `tests/global-setup.ts` menjalankan migrasi lewat `npx prisma`; di Windows gagal karena `npx.cmd` tidak bisa dijalankan tanpa shell, dan pesannya tertutup error Vitest `code.charCodeAt is not a function` | Prisma CLI dijalankan langsung dengan Node (`process.execPath`); pesan gagal setup selalu dicetak lebih dulu | `npm run check` gagal di laptop Windows pengembang |
| R-029 | 2026-11-04 | Frontend | Halaman prereg/web berupa kerangka sederhana tanpa autentikasi | Halaman login publik dan alur lupa password dengan verifikasi OTP email (AWB-6); pemisahan logic (pages/auth) dan presentasi (components/auth), routing dengan React.lazy, serta penambahan komponen Button, Input, dan AuthLayout di packages/ui | Kebutuhan antarmuka AWB-6 |
| R-030 | 2026-11-04 | Frontend | Belum ada antarmuka pengelolaan pengguna (admin) di prereg/web | Halaman admin user management untuk akun mitra dan internal (AWB-8) dengan filter peran/pabrik/pencarian, form tambah akun (CUSTOMER, VENDOR, internal), ubah/nonaktifkan status, reset password, dan komponen Table terstruktur di packages/ui | Kebutuhan antarmuka AWB-8 |
| R-031 | 2026-11-05 | Database | Schema database prereg masih kosong (tanpa model dan tabel akun/peran/mitra) | Skema tabel Prisma untuk akun, peran, hak akses, mitra SAP (customer, vendor, interco), relasi multi-kode mitra, pembatasan pabrik, dan OTP (AWB-2); migrasi awal PostgreSQL lokal dan seeder data peran serta 16.000+ data mitra dari referensi | Kebutuhan database AWB-2 |
| R-032 | 2026-11-05 | Backend | Belum ada API pengelolaan akun internal dan autentikasi peran | Endpoint CRUD akun internal (ADMIN only), password generator & mailer service, verifikasi peran, penugasan akses pabrik, dan blokir login akun nonaktif (AWB-7) | Kebutuhan API AWB-7 |
| R-033 | 2026-11-05 | Fullstack | Belum ada pengaturan hak akses dinamis dan proteksi izin halaman/menu | Modul role-permission dan middleware requirePermission di prereg/api, penolakan akses tidak berhak (403), serta antarmuka dinamis menu role & halaman matriks izin peran di prereg/web (AWB-9) | Kebutuhan antarmuka & keamanan AWB-9 |

## A. Aplikasi

| Aplikasi | Paket | Berjalan di | Port (dev) | Database | Status |
|---|---|---|---|---|---|
| `prereg/api` | `@awb/prereg-api` | AWS ECS, publik | 3000 | PostgreSQL | kerangka |
| `prereg/web` | `@awb/prereg-web` | AWS, publik | 5173 | — | kerangka |
| `site/api` | `@awb/site-api` | On-premise, tepat satu instance per pabrik | 4000 | SQL Server | kerangka |
| `site/web` | `@awb/site-web` | On-premise | 5174 | — | kerangka |
| `site/kiosk` | `@awb/site-kiosk` | On-premise, layar sentuh kiosk (hanya tampilan) | 5175 | — | kerangka |

## B. Domain dan modul backend

### site/api

| Domain | Cakupan | PRD | Status |
|---|---|---|---|
| `site/api/domains/journey` | Satu catatan per kunjungan truk: tahap saat ini, pengikatan kartu, audit | FR-008–FR-010, FR-043 | kerangka |
| `site/api/domains/registration` | Reg IN dan Reg OUT, cache prereg, QR, fallback QR, registrasi tanpa prereg, keluar | FR-001–FR-010, FR-027, FR-029, FR-045–FR-047 | direncanakan (router saja) |
| `site/api/domains/weighbridge` | Pengganti WB.NET: tap 1/2, penimbangan, OCR, pemeriksaan AI, toleransi, tiket | FR-011–FR-019, FR-028, FR-048–FR-050 | direncanakan (router saja) |
| `site/api/domains/tcs` | Alur yang dapat dikonfigurasi, tahap, input stasiun, keputusan QC | FR-020–FR-026 | direncanakan (router saja) |
| `site/api/domains/sync` | Outbox/inbox dengan HO, rekonsiliasi, klien prereg | FR-031–FR-036 | direncanakan (router saja) |
| `site/api/domains/erp` | Posting ke SAP (keluar saja) | FR-037, O-07 | direncanakan |

| Modul | Fungsi | Status |
|---|---|---|
| `site/api/domains/journey/journey` | Membaca journey berdasarkan id (contoh pola modul; data sementara di memori) | kerangka |

### prereg/api

| Modul | Fungsi | PRD | Status |
|---|---|---|---|
| `prereg/api/modules/pre-registration` | Membaca Customer Pre-Registration berdasarkan id (contoh pola modul; data sementara di memori) | FR-001 | kerangka |
| `prereg/api/modules/internal-user` | Pengelolaan akun staf internal (ADMIN only), pembuatan password sistem, reset password, pembatasan akses pabrik, dan autentikasi peran | FR-040, FR-041 | selesai |
| `prereg/api/modules/role-permission` | Pengelolaan hak akses izin peran dan menu, penolakan akses terlarang (HTTP 403), dan matriks perizinan peran | FR-042 | selesai |

## C. Endpoint API

| Aplikasi | Metode | Path | Modul | Contract | Status |
|---|---|---|---|---|---|
| site/api | GET | `/health` | `src/app.ts` | — | selesai (termasuk status koneksi controller) |
| site/api | GET | `/api/journeys/:id` | journey/journey | — | kerangka |
| site/api | — | `/api/registration`, `/api/weighbridge`, `/api/tcs`, `/api/sync` | router domain | — | direncanakan (terpasang, belum ada route) |
| prereg/api | GET | `/health` | `src/app.ts` | — | selesai |
| prereg/api | GET | `/api/pre-registrations/:id` | pre-registration | — | kerangka |
| prereg/api | POST | `/api/auth/login` | internal-user | — | selesai (blokir nonaktif) |
| prereg/api | GET | `/api/internal-users` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | GET | `/api/internal-users/:id` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | POST | `/api/internal-users` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | PUT | `/api/internal-users/:id` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | PATCH | `/api/internal-users/:id/status` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | POST | `/api/internal-users/:id/reset-password` | internal-user | — | selesai (khusus ADMIN) |
| prereg/api | GET | `/api/access/permissions` | role-permission | — | selesai |
| prereg/api | GET | `/api/access/roles` | role-permission | — | selesai (khusus ADMIN) |
| prereg/api | GET | `/api/access/roles/:id/permissions` | role-permission | — | selesai (khusus ADMIN) |
| prereg/api | PUT | `/api/access/roles/:id/permissions` | role-permission | — | selesai (khusus ADMIN) |
| prereg/api | GET | `/api/access/check-access` | role-permission | — | selesai |
| prereg/api | GET | `/api/access/protected/*` | role-permission | — | selesai (verifikasi RBAC) |
| prereg/api | — | `/api/internal/*` | `src/routes/internal.ts` | contract sinkronisasi | direncanakan (route antar layanan untuk pabrik; perlu autentikasi layanan) |

## D. Model data dan migrasi

Schema kedua database (`apps/prereg/api/prisma/schema.prisma` dan `apps/site/api/prisma/schema.prisma`) sengaja kosong (K-26). Tim pengembang membuat tabel dan migrasi pertama mengikuti "Aturan penamaan tabel", lalu mencatatnya di sini.

| Model | Aplikasi · database | Tabel | Pemilik | Status |
|---|---|---|---|---|
| `User` | `prereg/api` · PostgreSQL | `mst_user` | tim pengembang | migrasi diterapkan |
| `Role` | `prereg/api` · PostgreSQL | `mst_role` | tim pengembang | migrasi diterapkan |
| `Permission` | `prereg/api` · PostgreSQL | `mst_permission` | tim pengembang | migrasi diterapkan |
| `RolePermission` | `prereg/api` · PostgreSQL | `mst_role_permission` | tim pengembang | migrasi diterapkan |
| `Partner` | `prereg/api` · PostgreSQL | `mst_partner` | tim pengembang | migrasi diterapkan |
| `UserPartner` | `prereg/api` · PostgreSQL | `mst_user_partner` | tim pengembang | migrasi diterapkan |
| `Plant` | `prereg/api` · PostgreSQL | `mst_plant` | tim pengembang | migrasi diterapkan |
| `UserPlant` | `prereg/api` · PostgreSQL | `mst_user_plant` | tim pengembang | migrasi diterapkan |
| `UserOtp` | `prereg/api` · PostgreSQL | `sys_otp` | tim pengembang | migrasi diterapkan |

| Migrasi | Aplikasi | Isi |
|---|---|---|
| `20261105041933_init_auth_tables` | `prereg/api` | Tabel `mst_user`, `mst_role`, `mst_permission`, `mst_role_permission`, `mst_partner`, `mst_user_partner`, `mst_plant`, `mst_user_plant`, `sys_otp` (AWB-2) |

## E. Contract (format data antar aplikasi)

Skema di `@awb/contracts`; penjelasannya ada di README, bagian "Shared packages".

| Skema | File | Dari → ke | Status |
|---|---|---|---|
| `transactionType` | `common/transaction.ts` | semua aplikasi | terdefinisi |
| `registrationOrigin` | `common/transaction.ts` | semua aplikasi | terdefinisi |
| `syncEnvelope` | `sync/envelope.ts` | prereg ↔ site | terdefinisi, belum dikirim |
| `preregApprovedPayload` | `sync/prereg-approved.ts` | prereg → site | terdefinisi, belum dikirim |
| `preregApprovedEvent` | `sync/prereg-approved.ts` | prereg → site | terdefinisi, belum dikirim |
| `wbSessionPhase` | `realtime/lane-event.ts` | site/api → site/kiosk | terdefinisi |
| `laneScreenEvent` | `realtime/lane-event.ts` | site/api → site/kiosk | terdefinisi, belum dikirim |

## F. Fitur frontend

| Fitur | Layar PRD | Status |
|---|---|---|
| `prereg/web/features/pre-registration` | UI-01 | halaman contoh |
| `prereg/web/features/approval` | UI-02 | halaman contoh |
| `prereg/web/features/ho-registration` | UI-18 | halaman contoh |
| `site/web/features/weighbridge` | Menu WB.NET (daftar parity O-01) | halaman contoh |
| `site/web/features/tcs` | UI-10, UI-11 | halaman contoh |
| `site/web/features/dashboard` | UI-14, UI-15 | halaman contoh |
| `site/web/features/admin` | UI-16 | halaman contoh |
| `site/kiosk/features/registration` | UI-03–UI-07, UI-17 | layar contoh |
| `site/kiosk/features/weighing` | UI-08, UI-19, UI-09 | layar contoh |
| `site/kiosk/features/exit` | UI-12, UI-13 | layar contoh |

## G. Perangkat dan integrasi

| Item | Fungsi | Status |
|---|---|---|
| `site/api/devices/controller` | Satu koneksi TCP per controller timbangan (2 per jembatan timbang), sambung ulang otomatis, status di `/health`, `sendToController()` untuk perintah | koneksi selesai; format pesan dicatat di `docs/design/protokol-controller.md`, belum diterapkan (data mentah saja) |
| Sinkronisasi HO ↔ pabrik | Outbox/inbox dengan contract sinkronisasi | direncanakan |
| SAP / ERP | Posting hasil yang diterima. Akun: saat Logistik approve memakai kredensial SAP petugas (`session_sap`); akses lain memakai satu akun di `SAP_API_CREDENTIALS` (`user:password`, Basic auth) seperti `warehouse_be` (K-22) | direncanakan (kontrak terbuka, O-07) |
| Tampilan realtime kiosk (`site/api/src/realtime`) | Mengirim status lane ke layar kiosk | direncanakan |
| Kamera AI/OCR, indikator, printer | Adapter perangkat | direncanakan (O-05, O-13) |

## H. Paket bersama

| Paket | Isi | Status |
|---|---|---|
| `packages/contracts` | Skema zod antar aplikasi (bagian E) | dikerjakan |
| `packages/server-core` | `CustomError`, `NotFoundError`, `ValidationError`, `errorHandler`, `success()`, `loadEnv()` | selesai untuk saat ini |
| `packages/ui` | `AppShell`, `Screen`, `Button`, `Input`, `AuthLayout`, `Table` | kerangka |
