# Blueprint Sistem AWB-DWS

Ringkasan kondisi proyek AWB Downstream untuk manajemen: apa yang dibangun, sampai mana progresnya, keputusan penting dan hal yang masih perlu diputuskan. Rincian teknis untuk tim pengembang ada di `TECHNICAL.md`.

## Cara memperbarui dokumen ini <!-- pdf:skip -->

Bagian ini tidak ikut dicetak ke PDF. Aturan lengkapnya ada di `TECHNICAL.md`, bagian "Cara memperbarui".

- Tulis dengan bahasa sederhana, tanpa istilah teknis. Hal teknis masuk ke `TECHNICAL.md`.
- Status progres: **Belum mulai** · **Persiapan** (struktur dasar sudah disiapkan) · **Dikerjakan** · **Selesai**.
- Keputusan dan riwayat tidak pernah dihapus atau ditimpa. Nomor K-xx dan R-xx dipakai bersama dengan `TECHNICAL.md`.
- Sebelum dibagikan, buat ulang PDF: `npm run blueprint:pdf`.

## 1. Ringkasan

AWB Downstream (AWB-DWS) menyatukan tiga aplikasi yang selama ini terpisah: Customer Pre-Registration (pendaftaran truk oleh customer), WB.NET (timbangan) dan TCS (kontrol pemeriksaan serta bongkar/muat di pabrik). Hasilnya satu sistem yang mengatur perjalanan truk dari pendaftaran sampai keluar pabrik. Kebutuhannya dijelaskan dalam BRD v0.7 dan PRD v0.4.

Sistem berjalan di dua tempat:

- **Customer Pre-Registration** berjalan di internet (AWS), supaya customer dan Logistik HO bisa mengaksesnya dari mana saja.
- **Sistem pabrik** (registrasi, timbangan, TCS dan kiosk) berjalan di server setiap pabrik, supaya operasional tetap jalan walaupun koneksi ke HO terputus.

Kedua sisi saling bertukar data secara otomatis.

![Alur truk dari pendaftaran sampai keluar pabrik.](docs/project-files/assets/diagrams/journey.png)

## 2. Komponen sistem

| Komponen | Untuk siapa dan fungsinya | Lokasi | Status |
|---|---|---|---|
| Portal Customer Pre-Registration | Customer mendaftarkan truk, Logistik HO menyetujui, petugas HO mendaftarkan truk tanpa pre-registration | Internet (AWS) | Persiapan |
| Sistem pabrik | Mengatur registrasi, timbangan pengganti WB.NET, pemeriksaan TCS dan perangkat timbangan | Server pabrik | Persiapan |
| Konsol petugas pabrik | Layar untuk operator timbangan, petugas TCS, dashboard dan admin | Pabrik | Persiapan |
| Kiosk supir | Layar sentuh untuk supir: registrasi, timbang dengan dua tap kartu, dan keluar | Pabrik | Persiapan |
| Aplikasi Android petugas TCS | Input hasil pemeriksaan, sampling, lab dan bongkar/muat; tampilannya tetap seperti sekarang | HP/tablet petugas | Belum mulai |

## 3. Progres per area

| Area | Status | Keterangan |
|---|---|---|
| Fondasi proyek | Selesai | Struktur proyek, aturan kerja tim, pengujian otomatis dan dokumen ini sudah siap. |
| Database | Persiapan | Database untuk HO dan pabrik sudah disiapkan. Tabelnya sedang disusun dari sistem lama (K-13). |
| Koneksi ke perangkat timbangan | Dikerjakan | Sistem sudah bisa tersambung ke controller timbangan (2 per jembatan timbang) dan menyambung ulang sendiri bila putus. Pembacaan tap kartu belum dibuat. |
| Customer Pre-Registration | Persiapan | Belum ada fitur yang bisa dipakai. Akan mendukung penjualan (JUL) dan pembelian (BEL, dengan input PO) (K-15). |
| Registrasi masuk dan keluar | Belum mulai | Scan QR, registrasi tanpa pre-registration dan pengambilan kartu RFID. |
| Timbangan (pengganti WB.NET) | Belum mulai | Dua tap kartu, kamera AI/OCR dan perhitungan berat. Menunggu daftar menu WB.NET dan aturan kamera AI/OCR. |
| TCS (pemeriksaan dan bongkar/muat) | Belum mulai | Alur BEL, JUL, LSK dan LSM. Web TCS digabung ke konsol pabrik; aplikasi Android tetap tampilannya (K-16). |
| Kiosk supir | Persiapan | Layar contoh sudah ada; tampilan status timbangan secara langsung belum dibuat. |
| Pertukaran data HO dan pabrik | Belum mulai | Format datanya sudah disepakati; pengirimannya belum dibuat. |
| Integrasi SAP | Belum mulai | Menunggu kesepakatan dengan tim SAP. Cara login ke SAP sudah diputuskan (K-22). |

## 4. Keputusan penting

Keputusan yang berdampak ke bisnis dan operasional. Keputusan tidak pernah dihapus; keputusan yang berubah tetap tercantum dengan status "digantikan oleh K-xx". Keputusan teknis ada di `TECHNICAL.md`.

| ID | Tanggal | Keputusan | Alasan | Status |
|---|---|---|---|---|
| K-10 | 2026-11-02 | Customer Pre-Registration memakai PostgreSQL; seluruh sistem on-premise memakai SQL Server (PRD D-19) | Keputusan pemilik kebutuhan | berlaku |
| K-13 | 2026-11-02 | Database baru untuk Customer Pre-Registration (PostgreSQL) dan pabrik (SQL Server); struktur tabel disalin dari sistem lama (customer_prereg, VCF, WB.NET), tidak harus semua dan boleh diubah | Keputusan pemilik kebutuhan | berlaku |
| K-15 | 2026-11-02 | Customer Pre-Registration ditambah transaksi BEL (beli): alurnya sama dengan JUL, tetapi yang diinput adalah PO, bukan DO/Kontrak | Aplikasi lama hanya mendukung JUL | berlaku |
| K-16 | 2026-11-02 | Web Laravel TCS digabung ke konsol pabrik (`site/web`); aplikasi Android TCS tampilannya tetap, tetapi backend dan database-nya pindah ke layanan pabrik | Satu sistem dan satu database per pabrik | berlaku |
| K-19 | 2026-11-02 | Master supir, kendaraan dan transporter dikelola di Customer Pre-Registration (HO) dan dikirim ke pabrik tujuan saat Logistik approve; integrasi SAP menyusul | Keputusan pemilik kebutuhan | berlaku |
| K-21 | 2026-11-02 | Akses SAP memakai akun layanan; password SAP pengguna tidak disimpan (`session_sap` tidak dipakai) | Keputusan pemilik kebutuhan | digantikan oleh K-22 |
| K-22 | 2026-11-02 | Saat Logistik approve, data dikirim ke SAP dengan akun SAP petugas yang approve, seperti aplikasi lama; akses SAP lainnya memakai satu akun SAP bersama, sama seperti aplikasi Warehouse Management | Keputusan pemilik kebutuhan | berlaku |

## 5. Hal yang perlu diputuskan

| Hal | Status | Keterangan |
|---|---|---|
| Tabel yang diambil dari sistem lama | Sedang ditinjau | Usulan sudah dibuat; 4 dari 6 pertanyaan sudah dijawab. |
| Layar re-adopt di aplikasi Android | Belum diputuskan | Layar untuk mengambil ulang data tiket dari WB.NET: dihilangkan, atau dipakai untuk koreksi data tiket di sistem baru. |
| Struktur database WB.NET | Tindak lanjut | Perlu salinan struktur tabel WB.NET (tanpa data) agar timbangan baru punya fungsi yang sama. |
| Pemindahan data lama | Ditunda | Data dari WB.NET, TCS dan Customer Pre-Registration lama. |
| Cara pindah ke sistem baru | Ditunda | Termasuk truk yang sedang berada di dalam pabrik saat pergantian. |
| Server cadangan pabrik | Ditunda | Saat ini setiap pabrik memakai satu server; bila server mati, timbangan berhenti. |
| Fungsi relay dan sisi controller | Dicek saat survei | Dipastikan saat survei di Priscolin. |
| Sensor penutup palang otomatis | Dicek saat survei | Jenis sensor di Priscolin berbeda dari pabrik lain. |

## 6. Riwayat perubahan

Riwayat hanya ditambah, tidak pernah diubah atau dihapus, sehingga kondisi awal setiap perubahan tetap dapat dilihat. Riwayat teknis ada di `TECHNICAL.md`.

| No | Tanggal | Area | Sebelumnya | Sekarang | Alasan / referensi |
|---|---|---|---|---|---|
| R-001 | 2026-11-02 | Kebutuhan: registrasi | Setiap truk wajib memiliki Customer Pre-Registration yang disetujui (PRD v0.2) | Customer Pre-Registration opsional; data registrasi juga dapat diisi supir atau petugas HO | BRD v0.7 D-15; PRD v0.3 |
| R-002 | 2026-11-02 | Kebutuhan: penimbangan | Satu tap kartu; berat direkam otomatis ketika syarat terpenuhi (PRD v0.2) | Dua tap di kiosk dalam area timbangan: tap pertama menampilkan data, tap kedua merekam berat | BRD v0.7 D-16; PRD v0.3 |
| R-003 | 2026-11-02 | Kebutuhan: AI/OCR | Objek yang terdeteksi selalu menahan penimbangan (PRD v0.2) | AI memeriksa posisi, perimeter dan orang; OCR mencocokkan pelat; tindakan atas hasilnya mengikuti kebijakan yang belum ditetapkan | BRD v0.7 D-16; PRD v0.3; O-13 |
| R-009 | 2026-11-02 | Database | Belum ditentukan apakah memakai database lama atau baru | Database baru; struktur tabel disalin secara selektif dari sistem lama dan boleh diubah | K-13 |
| R-011 | 2026-11-02 | Dokumentasi | — | Bagian "Hal yang belum diputuskan" ditambahkan; pemindahan data lama, perpindahan sistem dan server cadangan ditunda | Keputusan pemilik kebutuhan |
| R-012 | 2026-11-02 | Customer Pre-Registration | Hanya transaksi JUL (input DO/Kontrak) | JUL dan BEL; BEL memakai input PO dengan alur yang sama | K-15 |
| R-013 | 2026-11-02 | TCS | Web Laravel dan aplikasi Android memakai backend dan database VCF | Web digabung ke konsol pabrik; aplikasi Android tetap tampilannya, backend dan database pindah ke layanan pabrik | K-16 |
| R-018 | 2026-11-02 | Akses SAP | Semua akses SAP memakai satu akun layanan (K-21) | Saat Logistik approve memakai akun SAP petugas; akses SAP lainnya memakai satu akun bersama seperti Warehouse Management | K-21 → K-22 |
