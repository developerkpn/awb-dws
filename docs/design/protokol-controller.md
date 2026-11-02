# Protokol controller timbangan (RFID, relay, sensor)

Acuan untuk `apps/site/api/src/devices/controller/`. Formatnya harus **sama persis** dengan sistem lama (keputusan K-17).

Sumber:

- **VCF (acuan utama):** `WbGateListenerService.php`, `WbSocketService.php`, `BarrierAutoCloseStateMachine.php`, `MstController.php`
- **AgentWBController:** `AgentRuntimeEngine.cs`
- **Rekaman lalu lintas:** 21 Oktober 2026 (`VCF/reports/controller_sensor_evidence_20261021`)

Board controller-nya: **SMIO / "SecuMaster-203"**.

## Koneksi

- **Controller adalah TCP server**, port bawaan **50001**. Layanan pabrik menyambung sebagai client.
- **Controller hanya menerima satu client.** Koneksi kedua memutus koneksi pertama. Akibatnya:
  - hanya boleh ada satu layanan pabrik
  - saat uji coba di pabrik yang masih berjalan, listener VCF lama harus dimatikan sebelum sistem baru tersambung ke controller yang sama
- **Keep-alive (VCF):**
  - kirim `PING` sesaat setelah tersambung
  - kirim `PING` lagi setelah 25 detik tanpa data
  - sambung ulang paksa setelah 60 detik tanpa data
- **Jeda sambung ulang:** mulai 3 detik, berlipat sampai paling lama 60 detik.
- **Tap ganda:** tap kartu yang sama dalam 3 detik diabaikan.

## Format pesan

- **Keluar:** `:` + perintah + `!` + `\r\n`, dalam ASCII. Contoh: `:OPEN1!\r\n`.
  - VCF memakai `\r\n`, sedangkan AgentWBController tidak.
  - Apakah board butuh `\r\n` belum terbukti.
- **Masuk:** `:<isi>!`, kecuali perubahan input yang diakhiri `;`. Contoh: `:INP21;`.
- **Beberapa pesan bisa datang sekaligus** dalam satu pembacaan, tanpa pemisah baris. Contoh: `:W1<10 digit>!:PINGOK!:OUT11!:INP41;`.

## Pesan masuk

| Pesan | Artinya |
|---|---|
| `:W1<angka>!` | Kartu di-tap di reader 1; nomor kartu = angkanya (di lapangan 10 digit) |
| `:W2<angka>!` | Kartu di reader 2. Belum pernah terlihat di lapangan; VCF salah membacanya |
| `:PINGOK!` | Balasan `PING` |
| `:OUT<n><0/1>!`, misalnya `:OUT11!` | Konfirmasi relay |
| `:INP<n><0/1>;`, misalnya `:INP21;` | Input n berubah (1 = aktif) |
| `:IN1ONIN2OFFIN3ON...OUT1OFF...!` | Status lengkap, sebagai balasan `INFO` |
| `:IN<n>ON!` / `:IN<n>OFF!` | Satu input (diduga firmware lama) |

## Perintah keluar (perilaku VCF)

| Perintah | Artinya | Kapan |
|---|---|---|
| `OPEN1` | Buka palang (relay 1) | Tap sah, kartu bypass, buka dari sistem, buka ulang saat ada halangan |
| `OPEN2` | Tutup palang (relay 2) | Auto-close |
| `OUT3ON` / `OUT3OFF`, atau `OPEN3` | Lampu lalu lintas | Setiap buka/tutup (mode `latch` atau `toggle`) |
| `OUT4ON` … `OUT4OFF` | Buzzer | Tap ditolak |
| `INFO` | Minta status lengkap | Tiap 2 detik selama palang tidak diam |
| `PING` | Cek koneksi | Lihat bagian Koneksi |

Teks `"(0) Successfull"`, `"(8) Inactive Card"` dan `"(9) UnRegistered Card"` di AgentWBController **tidak dikirim** ke controller. Teks itu hanya dicatat di database.

## Pengaturan per controller (`mst_controllers`)

- **Alamat:** `controller_ip`, `controller_port`.
- **Peran:** `usage` (`WB1`/`WB2`/`WB3`) dan `wb_side`. `side_a` adalah sisi tap untuk WB IN, `side_b` untuk WB OUT.
- **`sensor_qty`:** auto-close aktif bila nilainya ≥ 1.
- **`gate_config` (JSON), dengan nilai bawaan:**
  - `open_cmd` OPEN1, `close_cmd` OPEN2
  - `traffic_output` 3, `traffic_mode` latch
  - `info_cmd` INFO
  - `tracked_inputs` atau `input_count` 3
  - `position_input` kosong
  - `close_travel_seconds` 5, `all_clear_hold_seconds` 2
  - `info_poll_seconds` 2, `max_open_seconds` 120, `alert_repeat_seconds` 60

## Auto-close palang (VCF)

**Bagian ini kemungkinan berubah**, karena sensor di Priscolin berbeda dari VCF (K-17).

**Input:**

| Input | Fungsi |
|---|---|
| IN1 | Loop kendaraan |
| IN2, IN3 | Photocell di dalam dan di luar palang |
| IN4 | Saklar batas lengan palang (belum terpasang; data lapangan bertentangan) |

**Urutan status:** `CLOSED_IDLE` → `OPEN_WAITING_VEHICLE` → `VEHICLE_PRESENT` → `ALL_CLEAR_HOLD` → `CLOSING`.

**Aturan tutup:**

- Palang ditutup setelah semua input mati selama 2 detik sesudah kendaraan lewat.
- Kalau tidak ada kendaraan, palang ditutup setelah 120 detik, dan hanya bila semua input terbukti mati.

**Aturan keselamatan:**

- Input yang statusnya tidak diketahui **tidak dianggap aman**.
- Palang tidak ditutup selama ada input aktif.
- Ada input aktif saat menutup → buka ulang (`OPEN1`).
- Perintah tutup gagal terkirim → coba lagi.
- Terbuka lebih dari 120 detik dan belum aman → peringatan `barrier_blocked`, diulang tiap 60 detik.

## Perbedaan sistem lama dan usulan

| Hal | AgentWBController (C#) | VCF (PHP) |
|---|---|---|
| Akhir perintah | tanpa `\r\n` | `\r\n` |
| Tanda tap ditolak | `OPEN4` (pulsa buzzer); juga dikirim setiap tersambung | `OUT4ON`, 5 detik, `OUT4OFF` |
| Tutup palang | tidak ada | `OPEN2` berdasarkan sensor |
| Beberapa pesan sekaligus | rusak (tap bisa hilang atau terbaca salah) | ditangani |
| Pesan terpotong antar pembacaan | tidak ditangani | tidak ditangani |
| `PING` | timer tetap, tanpa batas sunyi | setelah 25 detik sunyi, sambung ulang setelah 60 detik |

**Usulan:**

- **Ikuti perilaku VCF**, karena lebih baru dan dipakai TCS saat ini.
- Perbaikan yang aman:
  1. simpan sisa pesan yang terpotong sampai pembacaan berikutnya
  2. baca `W2` dengan benar
  3. kirim perintah yang tertunda lewat antrean, bukan dengan menunggu (VCF memakai `sleep(5)` yang memblokir)

## Belum pasti

- Apakah board butuh `\r\n` di akhir perintah.
- Apakah pesan pernah terpotong di antara dua pembacaan TCP.
- Apakah `W2` pernah muncul di lapangan.
- Kabel IN4: kode bilang tidak terpasang, tetapi rekaman 21 Oktober menunjukkan IN4 berubah ketika palang dibuka/ditutup.
- Panjang dan arti nomor kartu, yang sejauh ini hanya diketahui dari pengamatan.
