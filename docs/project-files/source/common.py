"""Structured authoring data shared by the BRD, PRD, and review registers."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOP = ROOT.parent  # docs folder: README.txt and documents/
PROJECT = TOP.parents[1]  # KPN folder holding the referenced source repos (awb-dws/docs → KPN)
VERSION = "0.1"
DATE = "27 Oktober 2026"
STATUS = "DRAFT UNTUK REVIEW"
NAME = "Autonomous Weighbridge — Downstream"
SHORT = "AWB-DWS"


def p(text):
    return {"type": "paragraph", "text": text}


def h(text):
    return {"type": "subheading", "text": text}


def bullets(*items):
    return {"type": "bullets", "items": list(items)}


def table(headers, rows, widths=None):
    return {"type": "table", "headers": headers, "rows": rows, "widths": widths}


def figure(name, caption, height_mm=145):
    return {"type": "figure", "name": name, "caption": caption, "height_mm": height_mm}


def note(title, text):
    return {"type": "note", "title": title, "text": text}


def section(title, *blocks):
    return {"title": title, "blocks": list(blocks)}


SOURCES = [
    ("SRC-01", "Arahan dan klarifikasi pemilik kebutuhan", "Percakapan proyek, 27 Oktober 2026",
     "Otoritas cakupan dan keputusan bisnis; diringkas dalam D-01 s.d. D-19.", ""),
    ("SRC-02", "Proposal UWB upstream", "UWB Proposal v1.pdf",
     "Referensi kontrol timbang otomatis dan gambaran modul; 54 halaman, metadata 2021. Angka manfaat, harga, jadwal, dan merek vendor bukan baseline downstream.", "UWB Proposal v1.pdf"),
    ("SRC-03", "Prereg: rute, pengajuan, finalisasi, SAP", "customer_prereg/routes/LoadingNote.js; controllers/LoadingNoteController.js; models/LoadingNoteModel.js",
     "Aturan bisnis customer dan Logistik HO dipertahankan; integrasi QR dan sinkronisasi ditambahkan.", "customer_prereg/models/LoadingNoteModel.js"),
    ("SRC-04", "Prereg: surat jalan existing", "customer_prereg/controllers/PDFController.js",
     "Surat jalan, nomor LN, supir, kendaraan, material, jumlah rencana dan print count; pencetakan QR belum ditemukan pada sumber ini.", "customer_prereg/controllers/PDFController.js"),
    ("SRC-05", "Definisi alur dinamis TCS/VCF", "VCF/vcs_be_dynamic/database/seeders/FlowSeeder.php",
     "Baseline BEL/JUL/LSK/LSM, kelompok paralel, QC opsional, tap dan retry. Seeder tidak membuktikan konfigurasi live.", "VCF/vcs_be_dynamic/database/seeders/FlowSeeder.php"),
    ("SRC-06", "Katalog komoditas", "VCF/vcs_be_dynamic/config/commodities.php",
     "Katalog luas termasuk bahan baku, produk refinery dan material pendukung; FAME memiliki minimal_flow pada kode.", "VCF/vcs_be_dynamic/config/commodities.php"),
    ("SRC-07", "Pengajuan stasiun dan penolakan", "VCF/vcs_be_dynamic/app/Http/Controllers/Api/StageSubmissionController.php",
     "Hold/resample, hasil stasiun, flag rejected; penolakan diarahkan ke WB OUT sebelum keluar.", "VCF/vcs_be_dynamic/app/Http/Controllers/Api/StageSubmissionController.php"),
    ("SRC-08", "Registrasi keluar existing", "VCF/vcs_be_dynamic/app/Http/Controllers/Web/ExitController.php",
     "Penutupan perjalanan, jejak tap dan pelepasan RFID. Klik petugas pada existing perlu diganti alur kiosk.", "VCF/vcs_be_dynamic/app/Http/Controllers/Web/ExitController.php"),
    ("SRC-09", "Integrasi timbang existing", "VCF/vcs_be_dynamic/app/Models/WbGatepass.php; app/Services/WbMirrorSyncService.php",
     "Dependensi SQL Server WB.NET, waktu timbang aktual dan korelasi dokumen; target baru tidak bergantung pada WB.NET lama.", "VCF/vcs_be_dynamic/app/Services/WbMirrorSyncService.php"),
    ("SRC-10", "Pengendalian barrier", "VCF/vcs_be_dynamic/app/Services/BarrierAutoCloseStateMachine.php",
     "Pemisahan balasan relay dan status sensor; status tidak diketahui bukan kondisi aman; konfirmasi posisi arm.", "VCF/vcs_be_dynamic/app/Services/BarrierAutoCloseStateMachine.php"),
    ("SRC-11", "Bukti historis sensor", "VCF/reports/controller_sensor_evidence_20261021/WB1_WB2_WB3_Sensor_Evidence_2026-10-21.txt",
     "Pembelajaran instalasi VCF terdahulu; bukan bukti kondisi atau inventaris perangkat Priscolin. Survey lokasi pilot tetap diperlukan.", "VCF/reports/controller_sensor_evidence_20261021/WB1_WB2_WB3_Sensor_Evidence_2026-10-21.txt"),
    ("SRC-12", "Flowchart BEL dari pemilik kebutuhan", "project-files/references/flow-BEL-user.png",
     "Referensi visual awal; cabang End untuk reject dilengkapi oleh keputusan D-10 menjadi WB OUT dan registrasi keluar.", ""),
    ("SRC-13", "Logo KPN CORP existing", "KOAP/kpn-assessment-be/assets/KPN_CORP_NEW_LOGO.png",
     "Aset identitas yang digunakan untuk sampul dan dokumen; tidak membuat logo baru.", "KOAP/kpn-assessment-be/assets/KPN_CORP_NEW_LOGO.png"),
    ("SRC-14", "BoM Priscolin Karawang", "AWS-BOM All Plant Downstream.xlsx / 2-Priscolin Karawang-7803",
     "49 baris perangkat/material; 2 WB indikator digital PSC-7803; estimasi Rp863.989.020. Tidak termasuk civil/pondasi, pulling cable dan network termination.",
     "/home/benzeta/Downloads/AWS-BOM All Plant Downstream.xlsx"),
]

DECISIONS = [
    ("D-01", "Cakupan transaksi", "BEL, JUL, LSK, LSM masuk cakupan awal.", "Terkonfirmasi", "SRC-01"),
    ("D-02", "Tolling dan multi-DO", "Ditunda; merupakan urusan dari awal flow prereg. Bukan kapabilitas baru fase ini.", "Terkonfirmasi", "SRC-01"),
    ("D-03", "Penggantian WB.NET", "Mengganti seluruh WB.NET. Menu/fungsi ditargetkan sama, tampilan berubah total. Screenshot menyusul.", "Terkonfirmasi; parity menunggu bukti", "SRC-01"),
    ("D-04", "Penempatan data", "Satu database operasional terpadu per pabrik; prereg AWS/HO disinkronkan dengan pabrik.", "Terkonfirmasi", "SRC-01"),
    ("D-05", "Fallback registrasi", "Saat QR belum tersinkron di pabrik, supir menginput sendiri ke database pabrik; ketika online data direkonsiliasi ke AWS. Pelaksana ini dapat berubah.", "Terkonfirmasi sebagai rancangan awal", "SRC-01"),
    ("D-06", "Customer Pre-Registration dan approval", "Jika Customer Pre-Registration digunakan, customer mengisi dan Logistik HO menyetujui sesuai aturan existing. Tampilan diperbarui; layanan ini opsional sesuai D-15.", "Terkonfirmasi", "SRC-01/SRC-03"),
    ("D-07", "QR baru", "QR belum ada pada prereg dan dibuat dalam proyek ini sebagai tambahan pada surat jalan.", "Terkonfirmasi", "SRC-01/SRC-04"),
    ("D-08", "Pengambilan RFID", "Kartu diletakkan di tempat biasa. Setelah data registrasi diterima, supir mengambil satu kartu lalu tap pada kiosk yang sama untuk menautkannya. QR digunakan pada jalur Customer Pre-Registration; alur tanpa layanan ini mengikuti D-15.", "Terkonfirmasi", "SRC-01"),
    ("D-09", "Petugas stasiun", "Petugas tetap melakukan sampling, pengujian dan handling serta menginput hasil melalui TCS. Aturan tap mengikuti mst_flow_stages.", "Terkonfirmasi", "SRC-01/SRC-05"),
    ("D-10", "Penolakan material", "Reject menuju WB OUT kemudian registrasi keluar; perjalanan tidak selesai di titik reject.", "Terkonfirmasi", "SRC-01/SRC-07"),
    ("D-11", "Lokasi pilot yang diusulkan", "Priscolin Karawang menjadi usulan utama; Priscolin Bekasi sempat menjadi alternatif. Lokasi final masih perlu ditetapkan. VCF yang sudah berjalan menjadi acuan proses, bukan penetapan site pilot.", "Usulan lokasi; menggantikan baseline Tj. Pura", "SRC-01/SRC-14"),
    ("D-12", "Dasar investasi pilot", "Ringkasan lima kelompok BoM Karawang masuk bagian Analisis Biaya dan Manfaat pada BRD: 2 WB digital, estimasi perangkat/material Rp863.989.020. Rincian 49 item menjadi lampiran Excel terpisah. Total anggaran proyek masih memerlukan pelengkapan biaya lain.", "Terkonfirmasi sebagai dasar usulan", "SRC-01/SRC-14"),
    ("D-13", "Tujuan BRD internal", "BRD digunakan sebagai usulan proyek internal untuk manajemen dengan tujuh bagian inti: ringkasan eksekutif, tujuan bisnis, ruang lingkup, kebutuhan bisnis, pemangku kepentingan, batasan proyek serta analisis biaya dan manfaat. Tanpa bagian referensi atau kontrol dokumen.", "Terkonfirmasi", "SRC-01"),
    ("D-14", "BRD dapat dipahami tanpa pengetahuan aplikasi lama", "AWB Downstream dijelaskan sebagai satu layanan lengkap. Tujuan serta kapabilitas pendaftaran, registrasi/penimbangan dan pengendalian kegiatan pabrik dijelaskan sebelum nama aplikasi existing; perjalanan pengguna diterangkan dari pengajuan customer sampai kendaraan keluar.", "Terkonfirmasi", "SRC-01"),
    ("D-15", "Customer Pre-Registration opsional", "Truk harus dapat registrasi dengan atau tanpa Customer Pre-Registration. Data registrasi tanpa layanan ini dapat diisi oleh supir atau petugas HO. Adopsi customer dilakukan bertahap dan tidak menjadi syarat layanan pabrik. Alur ini berbeda dari fallback data QR yang sudah diterbitkan tetapi belum tersinkron.", "Opsional dan pengisi data terkonfirmasi", "SRC-01"),
    ("D-16", "Dua tap RFID serta AI/OCR saat timbang", "Pada WB IN dan WB OUT, supir turun dan melakukan kedua tap di dalam area timbangan. Tap pertama menampilkan data; tap kedua mengambil berat dari sensor timbang melalui indikator. AI memeriksa posisi/perimeter dan orang; OCR membaca pelat. Area deteksi mengikuti lokasi kiosk/supir; aturan hasil AI/OCR masih perlu ditetapkan.", "Alur dan lokasi tap terkonfirmasi; aturan hasil AI/OCR masih terbuka", "SRC-01/SRC-12"),
    ("D-17", "Kesiapan seluruh fasilitas", "Survei mencakup registrasi, kiosk dan RFID/QR reader, kamera AI/OCR, sensor/barrier, jalur supir, stasiun pabrik, server/jaringan, listrik, UPS, grounding, kabel serta civil; cakupannya meliputi seluruh layanan kendaraan.", "Kebutuhan diperluas dalam BRD; jumlah final melalui survei", "SRC-01/SRC-14"),
    ("D-18", "Istilah yang dipakai pada BRD", "Gunakan Customer Pre-Registration, WB.NET, TCS, tap RFID dan istilah operasional yang biasa dipakai. Jelaskan bahwa sistem mengatur seluruh alur kendaraan dalam satu sistem. Gunakan bahasa sederhana serta nama tim yang jelas; hapus penyebutan pemilik WB.NET.", "Terkonfirmasi", "SRC-01"),
    ("D-19", "Engine database", "Customer Pre-Registration di AWS menggunakan PostgreSQL. Seluruh sistem on-premise di pabrik (registrasi, timbangan pengganti WB.NET dan TCS) menggunakan SQL Server sebagai satu database operasional per pabrik. Ditetapkan pemilik kebutuhan pada 2 November 2026.", "Terkonfirmasi", "SRC-01"),
]

OPEN_ITEMS = [
    ("O-01", "Inventaris menu dan perilaku WB.NET lama", "Pemilik proses WB / tim proyek", "Screenshot, manual atau walkthrough; nama menu asli, peran, field, validasi, hasil cetak, laporan dan integrasi.", "Sebelum baseline parity disetujui"),
    ("O-02", "Otorisasi fallback offline", "Pemilik proses + Logistik HO + IT", "Setujui bukti approval pada QR, masa berlaku, batas keterlambatan, field supir dan respons bila bukti tidak dapat diverifikasi.", "Sebelum fallback dipakai di pilot"),
    ("O-03", "Pengembalian dan persediaan kartu", "Operasional pabrik", "Tentukan tempat pengembalian biasa, cara verifikasi stok/kehilangan dan apakah kartu baru tersedia setelah pengembalian dikonfirmasi.", "Sebelum FAT registrasi keluar"),
    ("O-04", "Konfigurasi alur dan tap lokasi pilot", "Pemilik TCS + PIC Priscolin", "Validasi konfigurasi flow untuk Priscolin; tap kelompok paralel JUL/LSK, QC opsional LSK/LSM, pengecualian FAME dan kelayakan komoditas. Proses VCF existing menjadi acuan.", "Sebelum UAT per alur"),
    ("O-05", "Survey seluruh fasilitas dan validasi BoM", "Engineering / Instrument / IT Priscolin", "BoM mengasumsikan 2 WB digital PSC-7803. Validasi kiosk registrasi/WB, QR/RFID, kamera AI/OCR dan pencahayaan, sensor/barrier, jalur supir, stasiun pabrik, server/jaringan/listrik serta pekerjaan pendukung. Cocokkan alokasi dan jumlah dengan layout; beberapa catatan berbeda dari Total Order.", "Sebelum PO dan FAT/SAT"),
    ("O-06", "Database dan migrasi", "Arsitek / DBA / tim aplikasi", "Engine sudah ditetapkan (D-19: PostgreSQL untuk Customer Pre-Registration, SQL Server untuk pabrik). Tetapkan pemetaan ID dan master, batas histori, strategi transaksi aktif dan pemulihan.", "Sebelum desain teknis dan cutover"),
    ("O-07", "Kontrak SAP dan dokumen per transaksi", "Tim ERP + Logistik HO", "Objek PO/SO/DO/STO yang berlaku per BEL/JUL/LSK/LSM; urutan posting, pembatalan, retry, sumber master dan referensi integrasi.", "Sebelum UAT ERP"),
    ("O-08", "Aturan timbang dan pemilik exception", "Pemilik WB + QC + manajemen site", "Stabilitas, zero, pembulatan, toleransi berat/kuantitas/tare, hak override, penerimaan OutSpec dan batas resampling.", "Sebelum UAT penimbangan"),
    ("O-09", "Kapasitas dan tingkat layanan", "Operasional + IT", "Truk per hari/jam, jumlah pengguna, target durasi, availability, RTO/RPO, retensi dan anggaran penyimpanan foto.", "Sebelum sizing dan komitmen SLA"),
    ("O-10", "Penetapan pilot dan anggaran lengkap", "Manajemen / PM / pemilik bisnis", "Tetapkan lokasi final (usulan Karawang), penanggung jawab dan jadwal; lengkapi biaya di luar BoM serta status pajak dan pengadaan sebelum komitmen anggaran penuh.", "Sebelum komitmen delivery / pengadaan"),
    ("O-11", "Kebijakan QR dan perjalanan", "Logistik HO + operasional site", "Aturan batal/revisi/reissue/expiry, satu dokumen untuk beberapa perjalanan bila ada, dan kapan reservasi yang belum datang dilepas.", "Sebelum finalisasi lifecycle QR"),
    ("O-12", "Data registrasi tanpa Customer Pre-Registration", "Logistik HO + Operasional Pabrik", "Data dapat diisi oleh supir atau petugas HO. Lengkapi daftar field/dokumen, pemeriksaan data dan akses HO sesuai BEL/JUL/LSK/LSM; tidak mengasumsikan persetujuan HO baru hanya karena Customer Pre-Registration tidak digunakan.", "Sebelum pengujian registrasi tanpa Customer Pre-Registration"),
    ("O-13", "Aturan AI/OCR dan area deteksi", "Operasional Pabrik + Engineering + IT", "Kedua tap dilakukan di dalam area timbangan: pertama tampil data, kedua ambil berat sensor. Sesuaikan area deteksi dengan posisi kiosk/supir. Tetapkan penggunaan hasil AI/OCR untuk lanjut atau peringatan, termasuk kegagalan baca dan pelat tidak sesuai.", "Sebelum pengujian timbang dengan AI/OCR"),
]

BR = [
    ("BR-01", "Registrasi dengan atau tanpa Customer Pre-Registration", "Customer Pre-Registration bersifat opsional dan tetap mengikuti pengajuan/persetujuan yang berlaku jika digunakan. Data registrasi truk tanpa layanan ini dapat diisi oleh supir atau petugas HO.", "D-06/D-07/D-15", "MUST"),
    ("BR-02", "Kemandirian layanan registrasi", "Supir harus dapat menyelesaikan registrasi secara mandiri, baik dengan maupun tanpa Customer Pre-Registration, agar layanan rutin tidak bergantung pada pertemuan dengan operator.", "D-08/D-15", "MUST"),
    ("BR-03", "Kelangsungan operasional pabrik", "Kedatangan yang sudah memenuhi persyaratan bisnis harus tetap dapat dilayani ketika informasi dari HO terlambat tersedia, dengan pencatatan yang dapat dipertanggungjawabkan.", "D-04/D-05", "MUST"),
    ("BR-04", "Kemandirian pengelolaan timbangan", "KPN harus dapat menjalankan seluruh fungsi timbang yang disepakati melalui aplikasi pengganti WB.NET dengan menu dan fungsi yang sama serta tampilan baru.", "D-03/O-01", "MUST"),
    ("BR-05", "Keandalan hasil timbang", "Pada WB IN/OUT, supir melakukan kedua tap di dalam area timbangan: pertama menampilkan data, kedua mengambil berat sensor melalui indikator. AI memeriksa posisi/perimeter/orang dan OCR mencocokkan pelat dengan data truk. Hasil timbang beserta buktinya dapat diperiksa kembali.", "D-16; SRC-02/SRC-09/SRC-10", "MUST"),
    ("BR-06", "Konsistensi empat jenis transaksi", "Pembelian, penjualan, langsir keluar dan langsir masuk harus dilayani sesuai urutan serta persyaratan bisnis masing-masing.", "D-01/D-09/O-04", "MUST"),
    ("BR-07", "Keterlacakan penanganan material", "Perusahaan harus dapat menghubungkan hasil pemeriksaan, sampling, pengujian dan penanganan material dengan kendaraan serta transaksi yang benar.", "D-09/SRC-05", "MUST"),
    ("BR-08", "Kendali keputusan mutu", "Penahanan, pemeriksaan ulang dan penerimaan material di luar spesifikasi harus tetap berada pada kewenangan yang ditetapkan agar keputusan mutu dapat dipertanggungjawabkan.", "SRC-05/SRC-07/O-08", "MUST"),
    ("BR-09", "Kepastian penyelesaian keluar", "Kendaraan dengan material diterima maupun ditolak harus menyelesaikan timbang keluar dan registrasi keluar dengan hasil akhir yang jelas.", "D-10", "MUST"),
    ("BR-10", "Keutuhan catatan perjalanan", "Setiap kedatangan harus memiliki satu catatan perjalanan yang konsisten agar pergantian kartu atau pengulangan proses tidak menyebabkan pencatatan transaksi berulang.", "D-08/SRC-08", "MUST"),
    ("BR-11", "Keselarasan informasi HO dan pabrik", "HO dan pabrik harus memperoleh informasi kedatangan serta hasil operasional yang selaras, termasuk penyelesaian pencatatan sementara saat koneksi terganggu.", "D-04/D-05", "MUST"),
    ("BR-12", "Ketepatan administrasi transaksi", "Hasil operasional yang disetujui harus mendukung pencatatan SAP secara benar dan lengkap; transaksi ditolak harus dibedakan dari penerimaan atau penjualan normal.", "D-03/SRC-03/O-07", "MUST"),
    ("BR-13", "Pengawasan operasional", "Manajemen harus dapat mengetahui posisi kendaraan, pekerjaan tertunda, durasi proses dan hasil transaksi untuk menindaklanjuti hambatan operasional.", "SRC-02/SRC-07/SRC-09", "MUST"),
    ("BR-14", "Akuntabilitas kewenangan", "Persetujuan, perubahan dan penanganan pengecualian harus dilakukan oleh pihak yang berwenang serta dapat ditelusuri untuk menjaga tanggung jawab bisnis.", "D-06/D-09", "MUST"),
    ("BR-15", "Kesiapan pelayanan mandiri", "Pabrik pilot harus menyiapkan registrasi, perangkat timbang/AI/OCR, stasiun, area supir, jaringan dan listrik beserta petugas serta prosedur gangguan untuk seluruh alur layanan.", "D-11/D-17/SRC-10/SRC-11", "MUST"),
    ("BR-16", "Keberlanjutan saat peralihan", "Peralihan ke aplikasi pengganti harus menjaga kelengkapan transaksi dan kesinambungan layanan pabrik, termasuk penyelesaian transaksi yang masih berjalan.", "D-03/O-06", "MUST"),
    ("BR-17", "Kemudahan layanan dan dokumen", "Supir harus memperoleh petunjuk yang mudah dipahami dan bukti timbang yang jelas agar dapat menyelesaikan proses tanpa bantuan rutin petugas.", "D-08/SRC-04", "MUST"),
    ("BR-18", "Ketertiban aliran kendaraan", "Pabrik perlu dapat mengarahkan kendaraan ke tahap berikutnya dan menata antrean sesuai kebutuhan kapasitas untuk mengurangi penumpukan.", "SRC-02/O-04/O-09", "SHOULD"),
]

FLOW_ROWS = [
    ("BEL", "Pembelian", "Reg IN → WB IN → Sampling → Lab → Unloading → WB OUT → Reg OUT", "Tap sampling dan unloading sesuai konfigurasi. Hold/resample tidak sama dengan reject."),
    ("JUL", "Penjualan", "Reg IN → WB IN → Inspection → [Loading + Sampling + Lab] → WB OUT → Reg OUT", "Kelompok paralel qc_phase; tap inspection mencakup awal kelompok pada seeder. Semua anggota wajib selesai."),
    ("LSK", "Langsir keluar", "Reg IN → WB IN → Inspection → [Loading + QC opsional] → WB OUT → Reg OUT", "run_qc pada inspection menentukan sampling+lab dijalankan atau dilewati; keputusan disimpan."),
    ("LSM", "Langsir masuk", "Reg IN → WB IN → Inspection → QC opsional → Unloading → WB OUT → Reg OUT", "QC opsional ditentukan saat inspection pada seeder saat ini; tap unloading tetap mengikuti konfigurasi."),
]

GLOSSARY = [
    ("AWB-DWS", "Nama kerja proyek Autonomous Weighbridge untuk downstream; bukan nama produk yang sudah disetujui."),
    ("WB / WB IN / WB OUT", "Weighbridge; penimbangan pertama dan penimbangan sebelum keluar sesuai tahapan perjalanan. Berbeda dari gerbang registrasi."),
    ("WB.NET", "Aplikasi timbang yang akan diganti dengan menu dan fungsi yang sama serta tampilan baru."),
    ("TCS / VCF", "Fungsi kontrol perjalanan kendaraan dan pekerjaan stasiun; repositori acuan adalah VCF versi dinamis. Akronim tidak diseragamkan tanpa konfirmasi bisnis."),
    ("Customer Pre-Registration / LN / surat jalan", "Layanan opsional sebelum truk datang, dengan aturan pengajuan serta persetujuan existing. LN/surat jalan yang sah mengikuti proses yang berlaku."),
    ("RFID / binding", "Kartu identitas akses; binding menautkan kartu yang ditap ke satu perjalanan aktif secara atomik."),
    ("Fallback data QR", "Pengisian catatan lokal oleh supir saat Customer Pre-Registration sudah ada tetapi datanya belum tersedia di pabrik. Berbeda dari registrasi tanpa Customer Pre-Registration; tidak membuat persetujuan HO baru."),
    ("Provisional / reconciliation", "Catatan lokal menunggu pencocokan dengan prereg HO; rekonsiliasi mempertahankan identitas perjalanan dan fakta operasional."),
    ("OutSpec / hold / reject", "OutSpec adalah hasil kualitas; hold menunda keputusan atau memicu resample; reject mengakhiri proses material dan mengarahkan truk ke WB OUT."),
    ("Idempotensi / outbox", "Pengulangan permintaan menghasilkan satu efek bisnis; outbox menyimpan pesan sinkronisasi bersama transaksi lokal sampai diterima tujuan."),
    ("Parity", "Kesesuaian fungsi, menu, aturan, hasil cetak dan laporan aplikasi pengganti dengan bukti WB.NET lama."),
    ("FAT / SAT / UAT", "Pengujian fungsi sebelum lapangan, pengujian instalasi lapangan, dan penerimaan oleh pengguna bisnis."),
    ("MUST / SHOULD / LATER", "Prioritas rancangan: syarat baseline pilot / peningkatan yang perlu prioritisasi / di luar fase ini. Bukan bukti implementasi atau sign-off."),
    ("TBD", "Belum diputuskan; pemilik dan batas penyelesaiannya dicatat pada register O-xx."),
]
