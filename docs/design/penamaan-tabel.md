# Penamaan tabel dan kolom

Berlaku untuk kedua database (PostgreSQL di prereg, SQL Server di pabrik). Struktur tabel sistem lama boleh dipakai sebagai acuan, tetapi namanya mengikuti aturan di bawah.

## Tabel

| Awalan | Untuk                                         | Contoh                                                        |
| ------ | --------------------------------------------- | ------------------------------------------------------------- |
| `mst_` | Data master: data acuan yang jarang berubah   | `mst_customer`, `mst_driver`, `mst_vehicle`, `mst_controller` |
| `awb_` | Data transaksi: kejadian yang terus bertambah | `awb_pre_registration`, `awb_journey`, `awb_weighing`         |

Tabel lain, misalnya antrean sinkronisasi atau OTP, cukup diberi nama yang jelas.

## Kolom

Pakai bahasa Inggris, huruf kecil dan garis bawah (`snake_case`).

| Jenis                   | Aturan                          | Contoh                      |
| ----------------------- | ------------------------------- | --------------------------- |
| Kunci utama             | `id`                            | `id`                        |
| Relasi ke tabel lain    | nama tabel tanpa awalan + `_id` | `customer_id`, `journey_id` |
| Ya/tidak                | awalan `is_` atau `has_`        | `is_active`, `is_bypass`    |
| Tanggal dan jam         | akhiran `_at`                   | `created_at`, `weighed_at`  |
| Tanggal saja            | akhiran `_date`                 | `do_date`                   |
| Pengguna yang melakukan | akhiran `_by` (id pengguna)     | `created_by`, `approved_by` |

Setiap tabel punya `created_at` dan `updated_at`.

## Di Prisma

Model dan field memakai nama biasa (`Journey`, `customerId`), lalu dipetakan ke nama tabel dan kolom dengan `@@map` dan `@map`:

```prisma
model Journey {
  id         Int      @id @default(autoincrement())
  customerId Int      @map("customer_id")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("awb_journey")
}
```
