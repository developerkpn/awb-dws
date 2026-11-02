# @awb/contracts

**Formulir baku untuk data yang dikirim antar aplikasi.**

Customer Pre-Registration (AWS) dan sistem pabrik (on-premise) adalah aplikasi terpisah yang saling kirim data. Supaya formatnya tidak berbeda di kedua sisi, formatnya ditulis **sekali di sini** dan dipakai **kedua** aplikasi. Dengan begitu:

1. **Saat menulis kode:** kolom yang lupa diisi atau salah nama langsung ketahuan (`npm run typecheck`).
2. **Saat data diterima:** data yang salah ditolak beserta alasannya, tidak ikut tersimpan.

## Aturan

- **Masuk ke sini** hanya data yang dikirim **dari satu aplikasi ke aplikasi lain** (lewat HTTP, sinkronisasi atau socket). Data yang hanya dipakai di dalam satu aplikasi tetap disimpan di aplikasi itu.
- **Menambah kolom yang tidak wajib itu aman.**
- **Mengganti nama, menghapus atau mewajibkan kolom adalah perubahan besar.** Pabrik di-update pada waktu yang berbeda dari HO, jadi pabrik yang belum di-update masih memakai formulir lama. Naikkan `schemaVersion` dan tetap terima versi lama sampai semua pabrik sudah di-update.
- Setiap formulir baru dicatat di `BLUEPRINT.md`, Lampiran E.

## Isi

| File | Formulir | Dikirim dari → ke |
|---|---|---|
| `src/common/transaction.ts` | Daftar jenis transaksi (BEL/JUL/LSK/LSM) dan jenis registrasi | semua aplikasi |
| `src/sync/envelope.ts` | Amplop standar untuk semua data sinkronisasi | HO ↔ pabrik |
| `src/sync/prereg-approved.ts` | Pre-registration sudah di-approve | HO → pabrik |
| `src/realtime/lane-event.ts` | Status timbangan untuk layar kiosk | sistem pabrik → kiosk |

---

## `wbSessionPhase`: langkah truk di jembatan timbang

File: `src/realtime/lane-event.ts`. Daftar ini adalah **langkah-langkah satu truk di jembatan timbang**, dari naik sampai turun. Sistem pabrik mencatat truk sedang di langkah mana, karena:

- layar kiosk menampilkan petunjuk sesuai langkahnya
- ada hal yang **hanya boleh** terjadi di langkah tertentu

| Urutan | Status | Artinya | Contoh tampilan kiosk |
|---|---|---|---|
| 1 | `IDLE` | Timbangan kosong, menunggu truk | "Silakan masuk" |
| 2 | `ENTRY_ALLOWED` | Lampu hijau, truk boleh naik; timbangan dikunci untuk 1 truk | "Naik ke timbangan" |
| 3 | `POSITION_WAIT` | Truk sedang naik, posisinya belum pas | "Maju sedikit / berhenti" |
| 4 | `POSITIONED` | Truk sudah pas di atas timbangan; supir turun ke kiosk | "Turun, tap kartu" |
| 5 | `TAP1_VERIFIED` | **Tap pertama**: kartu dan tahap valid, data truk tampil, pelat dicek OCR; berat **belum** direkam | "Cek data Anda" |
| 6 | `READY_TO_CAPTURE` | Berat stabil dan aturan AI/OCR terpenuhi; menunggu tap kedua | "Tap lagi untuk rekam berat" |
| 7 | `CAPTURED` | **Tap kedua**: berat dibaca dari indikator | "Merekam berat..." |
| 8 | `COMMITTED` | Berat dan buktinya **sudah tersimpan** di database | "Berat tersimpan" |
| 9 | `EXIT_AUTHORIZED` | Lampu/palang keluar dibuka; supir kembali ke truk | "Kembali ke truk, silakan keluar" |
| 10 | `PLATFORM_CLEAR` | Truk sudah turun, timbangan kembali nol | — |
| 11 | `RELEASED` | Selesai, kembali ke `IDLE` untuk truk berikutnya | — |
| — | `FAULT` | Ada gangguan perangkat (sensor, kamera, indikator) di langkah mana pun | "Hubungi petugas" |

Aturan yang dijaga oleh langkah-langkah ini:

- **Tap kedua hanya diterima** setelah tap pertama dan saat berat sudah stabil (`READY_TO_CAPTURE`). Kalau tap kedua tidak datang dalam batas waktu, timbangan kembali ke `POSITIONED` dan supir mengulang dari tap pertama.
- **`CAPTURED` dan `COMMITTED` dipisah.** Kalau berat sudah terbaca tapi **gagal disimpan**, palang **tidak boleh** dibuka. Truk tidak boleh keluar tanpa catatan berat.
- **Truk berikutnya baru boleh naik setelah `PLATFORM_CLEAR`**, supaya berat truk sebelumnya tidak terbawa.
- **`FAULT`**: setelah gangguan, sistem memeriksa kondisi perangkat yang sebenarnya sebelum melanjutkan; perintah lama tidak diulang begitu saja.

Sumber: PRD v0.4, bagian "State sesi WB". Daftar ini masih **usulan**: nama dan jumlah langkah boleh diubah setelah alur di lapangan dicek.

---

## `syncEnvelope`: amplop data sinkronisasi

File: `src/sync/envelope.ts`. Semua data yang dikirim antara HO (AWS) dan pabrik dimasukkan ke **amplop yang sama**:

- **bagian luar amplop** berisi info standar yang sama untuk semua jenis pesan
- **isi amplop (`payload`)** berbeda per jenis pesan; misalnya untuk "pre-registration di-approve" isinya nomor dokumen, jenis transaksi dan seterusnya

| Kolom | Artinya | Dipakai penerima untuk |
|---|---|---|
| `eventId` | Nomor unik pesan; pengiriman ulang memakai nomor yang sama | **Tidak menyimpan dobel** bila pesan yang sama datang dua kali |
| `schemaVersion` | Versi format formulir | Tetap bisa membaca pesan dari pengirim versi lama saat masa update |
| `eventType` | Jenis pesan, misalnya `prereg.approved` | Menentukan cara memproses isinya |
| `aggregateId` | Data mana yang dimaksud, misalnya nomor pre-registration | Mencari data yang sama di database penerima |
| `aggregateVersion` | Versi data tersebut di pengirim | **Data lama yang datang belakangan tidak menimpa** data yang lebih baru |
| `siteId` | Pabrik pemilik data | Data Karawang tidak masuk ke pabrik lain |
| `source` / `target` | Pengirim dan penerima (`ho` atau kode pabrik) | Menolak pesan yang bukan untuknya |
| `occurredAt` | Kapan kejadiannya di pengirim | Jejak dan audit |
| `recordedAt` | Kapan pengirim menyimpan pesan itu | Jejak dan audit |
| `correlationId` | (opsional) Nomor untuk menghubungkan pesan yang saling terkait | Menelusuri masalah |
| `payload` | Isi pesan, berbeda per `eventType` | Data yang sebenarnya |

Sumber: PRD v0.4, bagian "Envelope event usulan".

### Rencana sinkronisasi (belum dibangun)

Begini cara data pre-registration dari AWS sampai ke database pabrik. Ini masih **usulan**, dan arah pengambilannya perlu dipastikan dengan kondisi jaringan pabrik.

```
AWS (prereg-api)                          Pabrik (site-api)
─────────────────                         ─────────────────
Antrean pesan keluar:
[amplop 101] [amplop 102] ...
                          ◄──  1. Jadwal (cron) tiap ±1 menit: "ada pesan baru setelah nomor 100?"
                          ──►  2. Kirim amplop 101, 102
                                3. Cek amplop dengan formulir ini, simpan ke SQL Server lokal,
                                   catat "terakhir sampai 102"
                          ◄──  4. "Sudah diterima sampai 102"
```

- **Pabrik yang mengambil (pull).** Server pabrik biasanya bisa mengakses internet, sedangkan AWS tidak bisa masuk ke jaringan pabrik.
- **Saat internet putus:** pabrik tetap jalan memakai data lokal. Begitu tersambung lagi, pengambilan dilanjutkan dari nomor terakhir, tanpa data hilang atau dobel.
- **Arah sebaliknya (pabrik → AWS):** hasil timbang dan status truk dikirim dengan amplop yang sama dan diulang otomatis bila gagal.
- **Pencarian langsung:** bila supir scan QR yang datanya belum ada di pabrik, pabrik dapat langsung bertanya ke AWS (PRD FR-004) sebelum memakai fallback.
- Interval jadwal (misalnya tiap 1 menit) belum diputuskan.
