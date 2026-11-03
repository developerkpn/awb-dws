# Controller timbangan: relay, sensor dan cara menanganinya

Acuan untuk `apps/site/api/src/devices/controller/`. Format pesan sama dengan VCF (K-17). Logika auto-close boleh berubah karena sensor di Priscolin berbeda.

Kode acuan ada di backend VCF di GitHub (`vcs_be_dynamic`, branch `prod`):

- `app/Services/WbGateListenerService.php`
- `app/Services/WbGateCommandService.php`
- `app/Services/BarrierAutoCloseStateMachine.php`
- `app/Models/MstController.php`

Board controller-nya SMIO, dengan 4 relay (OUT1–OUT4) dan 4 input (IN1–IN4).

## Fungsi tiap relay

| Relay | Perintah | Fungsinya | Kapan dikirim |
|---|---|---|---|
| 1 | `OPEN1` | Membuka palang. Palang tetap terbuka sampai ditutup lewat relay 2 | Tap kartu yang sah, kartu bypass, buka dari aplikasi, buka ulang bila ada halangan saat menutup |
| 2 | `OPEN2` | Menutup palang | Oleh auto-close, setelah semua sensor aman |
| 3 | `OUT3ON` / `OUT3OFF`, atau `OPEN3` | Lampu lalu lintas | Menyala (tanda jalan) saat palang dibuka, mati saat ditutup |
| 4 | `OUT4ON`, lalu `OUT4OFF` | Buzzer / sirene | Tap ditolak (5 detik), atau sirene yang diminta operator |

- **`OPENn` dan `OUTnON`/`OUTnOFF`:**
  - `OPENn` memberi pulsa singkat ke relay n.
  - `OUTnON` dan `OUTnOFF` menyalakan atau mematikan relay sampai diperintah lagi.
- **Lampu (relay 3)** punya dua mode:
  - `latch` (bawaan): `OUT3ON` saat buka dan `OUT3OFF` saat tutup
  - `toggle`: satu `OPEN3` membalik warna lampu, untuk lokasi yang lampunya tidak sinkron dengan ON/OFF
- **Jangan kirim `OPEN4`.** Relay 4 akan bekerja seperti palang. Buzzer hanya dinyalakan lewat `OUT4ON` / `OUT4OFF`.
- **Board tidak punya pengaman sendiri.** `OPEN2` tetap dijalankan walaupun ada truk di bawah palang, jadi pengamannya sepenuhnya ada di auto-close.
- **Konfirmasi relay:** setiap relay yang berubah dikonfirmasi controller dengan `:OUT<n><0/1>!`, misalnya `:OUT21!` (relay 2 aktif). Pesan ini bukan status sensor.
- **Perintah bisa diatur per controller** (`gate_config`), karena kabel di Priscolin baru dipastikan saat survei.

## Input (sensor)

| Input | Fungsinya |
|---|---|
| IN1 | Loop kendaraan: ada truk di atasnya |
| IN2, IN3 | Photocell di dalam dan di luar palang |
| IN4 | Saklar batas lengan palang (ON = naik, OFF = turun). Di VCF belum tersambung ke controller mana pun |

- **Perubahan input:** datang sendiri sebagai `:INP<n><0/1>;` (diakhiri titik koma). Contoh: `:INP21;` berarti IN2 aktif.
- **Status lengkap:** diminta dengan `INFO`.

## Cara menanganinya

### Satu koneksi per controller

- **Controller adalah TCP server** (port bawaan 50001) dan hanya menerima satu client. Koneksi kedua memutus koneksi pertama.
- **Hanya adapter controller di layanan pabrik yang tersambung.** Semua perintah dikirim lewat koneksi itu melalui antrean, tidak pernah lewat koneksi baru:
  - balasan tap
  - buka dari aplikasi
  - sirene
  - auto-close
- **Uji coba di pabrik yang masih berjalan:** layanan lama yang tersambung ke controller harus dimatikan dulu.
- **Keep-alive:**
  - kirim `PING` setelah tersambung, dan lagi setelah 25 detik tanpa data (balasannya `:PINGOK!`)
  - sambung ulang setelah 60 detik tanpa data
  - jeda sambung ulang mulai 3 detik, berlipat sampai paling lama 60 detik

### Tap kartu

1. `:W1<nomor kartu>!` masuk. Tap kartu yang sama dalam 3 detik diabaikan.
2. **Kartu bypass:** `OPEN1` tanpa memeriksa perjalanan, hanya di controller timbangan. Tap-nya tetap dicatat.
3. **Kartu dengan perjalanan aktif di tahap yang benar:**
   - tap dicatat
   - kirim `OPEN1` dan lampu (relay 3)
   - auto-close dijalankan
4. **Selain itu, tap ditolak:**
   - buzzer `OUT4ON`, lalu `OUT4OFF` 5 detik kemudian
   - alasan penolakan hanya dicatat di sistem, tidak dikirim ke controller
   - `OUT4OFF` dijadwalkan dengan timer, bukan dengan menunggu, supaya koneksi tetap melayani pesan lain

### Auto-close palang (relay 2)

**Urutan status:** `CLOSED_IDLE` → `OPEN_WAITING_VEHICLE` → `VEHICLE_PRESENT` → `ALL_CLEAR_HOLD` → `CLOSING` → `CLOSED_IDLE`

**Memantau:** selama palang tidak diam, minta `INFO` tiap 2 detik.

**Kapan ditutup:**

- Truk sudah lewat dan semua input mati selama 2 detik → `OPEN2`, lalu lampu dimatikan.
- Tidak ada truk → tutup setelah 120 detik, hanya bila semua input terbukti mati.

**Kapan dianggap sudah tertutup:**

- IN4 = OFF, bila IN4 tersambung
- tanpa IN4: 5 detik setelah `OPEN2`

**Pengaman:**

- Input yang statusnya belum diketahui dianggap tidak aman.
- Ada input aktif saat palang turun → buka lagi (`OPEN1`) dan ulangi dari awal.
- `OPEN2` gagal terkirim → coba lagi.
- Terbuka lebih dari 120 detik dan belum aman → peringatan `barrier_blocked` ke operator, diulang tiap 60 detik.

### Buka dari aplikasi dan sirene

- **Buka dari aplikasi** (operator atau manager):
  - perintah masuk antrean dan dikirim lewat koneksi yang sama
  - auto-close berjalan seperti biasa
  - bila gagal terkirim, tidak diulang otomatis; peminta bisa meminta lagi
- **Sirene:**
  - `OUT4ON`, lalu `OUT4OFF` setelah durasi yang diminta
  - permintaan baru saat sirene menyala memperpanjang waktunya

## Format pesan

- **Keluar:** `:` + perintah + `!` + `\r\n`, dalam ASCII. Contoh: `:OPEN1!\r\n`. Akhiran `\r\n` bisa diubah per controller.
- **Masuk:** `:<isi>!`, kecuali perubahan input yang diakhiri `;`.
- **Beberapa pesan bisa datang sekaligus** dalam satu pembacaan, tanpa pemisah. Contoh: `:W1<10 digit>!:PINGOK!:OUT11!:INP41;`.
- **Pesan yang terpotong** di antara dua pembacaan disimpan sampai pembacaan berikutnya.

| Pesan masuk | Artinya |
|---|---|
| `:W1<angka>!` | Kartu di-tap di reader 1 |
| `:W2<angka>!` | Kartu di-tap di reader 2. Nomor reader dibaca terpisah dari nomor kartu |
| `:PINGOK!` | Balasan `PING` |
| `:OUT<n><0/1>!` | Konfirmasi relay |
| `:INP<n><0/1>;` | Input n berubah (1 = aktif) |
| `:IN1ONIN2OFF...OUT1OFF...!` | Status lengkap, balasan `INFO` |

## Pengaturan per controller

Disimpan di tabel master controller:

- **Alamat:** IP dan port.
- **Peran:** timbangan `WB1`/`WB2`/`WB3` dan sisinya. Sisi A untuk WB IN, sisi B untuk WB OUT.
- **Jumlah sensor:** auto-close aktif bila nilainya ≥ 1.
- **`gate_config` (JSON), dengan nilai bawaan:**
  - `terminator` `\r\n`
  - `open_cmd` `OPEN1`, `close_cmd` `OPEN2`
  - `traffic_output` 3, `traffic_mode` `latch`, `traffic_toggle_cmd` `OPEN3`
  - `info_cmd` `INFO`
  - `tracked_inputs` (daftar input yang dipantau) atau `input_count` 3
  - `position_input` kosong (IN4 tidak tersambung)
  - `close_travel_seconds` 5, `all_clear_hold_seconds` 2
  - `info_poll_seconds` 2, `max_open_seconds` 120, `alert_repeat_seconds` 60

## Dipastikan saat survei

- Apakah kabel relay di Priscolin sama: relay 1 buka, relay 2 tutup, relay 3 lampu, relay 4 buzzer.
- Mode lampu yang cocok (`latch` atau `toggle`).
- Apakah IN4 tersambung.
- Apakah reader 2 (`W2`) dipakai.
- Apakah board butuh `\r\n` di akhir perintah.
- Panjang dan arti nomor kartu.
