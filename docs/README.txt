AWB-DWS — Autonomous Weighbridge / Downstream
BRD v0.7 — 28 Oktober 2026
PRD v0.4 — 2 November 2026
Status: DRAFT UNTUK REVIEW

DOKUMEN UTAMA
  documents/BRD-AWB-DWS-v0.7.docx / .pdf
  documents/PRD-AWB-DWS-v0.4.docx / .pdf
  documents/Blueprint-AWB-DWS-v<tanggal>.pdf — peta sistem, progres, keputusan dan
  riwayat perubahan; dibuat dari BLUEPRINT.md di root repositori (npm run blueprint:pdf).
  BRD: usulan proyek internal untuk manajemen, dengan ringkasan keputusan,
  tujuh bagian inti BRD, manfaat, lingkup dan ringkasan investasi Karawang.
  AWB Downstream mengatur seluruh alur kendaraan dalam satu sistem:
  Customer Pre-Registration opsional, registrasi masuk, WB IN/OUT,
  proses TCS dan registrasi keluar.
  Perjalanan pengguna dijelaskan tanpa mengasumsikan pembaca mengenal
  aplikasi Customer Pre-Registration, TCS atau WB.NET yang sudah ada.
  Rincian BoM berada dalam lampiran Excel terpisah:
  project-files/supporting/BoM-Priscolin-Karawang.xlsx
  BRD tidak memakai bagian referensi, kontrol dokumen atau formulir persetujuan.
  PRD: rincian perilaku produk, data, integrasi dan skenario penerimaan.
  PRD v0.4 diselaraskan dengan BRD v0.7: Customer Pre-Registration
  opsional, registrasi oleh supir/petugas HO, dua tap timbang serta AI/OCR.
  Field registrasi tanpa prereg (O-12) dan aturan hasil AI/OCR (O-13) masih terbuka.

BASELINE
  BEL, JUL, LSK, LSM; usulan pilot Priscolin Karawang.
  Lokasi final masih perlu ditetapkan; Bekasi pernah menjadi alternatif.
  Acuan Karawang: 2 WB, indikator digital PSC-7803.
  Estimasi BoM perangkat/material Rp863.989.020, 49 baris.
  Belum termasuk civil/pondasi, pulling cable dan network termination.
  Total anggaran proyek membutuhkan pelengkapan biaya di luar BoM.
  Tolling dan multi-DO ditunda.
  WB.NET diganti penuh dengan menu/fungsi yang sama dan tampilan baru.
  Menu/fungsi lama menunggu screenshot/walkthrough untuk validasi parity.
  Customer Pre-Registration opsional; jika digunakan, approval Logistik HO
  tetap berlaku dan QR baru ditambahkan pada surat jalan.
  Registrasi tanpa Customer Pre-Registration dapat diisi supir atau petugas HO.
  Pada WB IN/OUT, supir turun dan kedua tap dilakukan di dalam area timbangan:
  tap pertama menampilkan data, tap kedua
  meminta pencatatan berat indikator. AI memeriksa posisi/perimeter/orang;
  OCR membaca dan mencocokkan pelat nomor. Area deteksi disesuaikan dengan
  posisi kiosk dan supir; aturan hasil AI/OCR masih perlu dipastikan.
  Satu database operasional per pabrik, sinkron dua arah AWS/HO.
  Fallback data QR diinput supir sebagai rancangan awal; berbeda dari
  registrasi tanpa Customer Pre-Registration. Bukti otorisasi offline
  masih usulan dan perlu keputusan sebelum digunakan di pilot.
  Kartu diambil sendiri dari tempat biasa setelah data registrasi diterima,
  kemudian tap pada kiosk registrasi yang sama.
  Kesiapan fasilitas meliputi registrasi, timbang/AI/OCR, jalur supir, stasiun,
  server/jaringan/listrik serta pekerjaan pendukung.
  Petugas TCS tetap mengerjakan/input hasil; reject ke WB OUT lalu Reg OUT.

REGISTER REVIEW (CSV UTF-8, dapat dibuka di Excel)
  project-files/supporting/decision-register.csv
  project-files/supporting/open-decisions.csv
  project-files/supporting/business-requirements.csv
  project-files/supporting/functional-requirements.csv
  project-files/supporting/requirement-traceability.csv
  project-files/supporting/wbnet-menu-parity.csv
  project-files/supporting/uat-scenarios.csv
  project-files/supporting/source-register.csv
  project-files/supporting/business-objective-map-v0.7.csv
  project-files/supporting/karawang-bom.csv
  project-files/supporting/karawang-bom-validation.json
  project-files/supporting/BoM-Priscolin-Karawang.xlsx — ringkasan dan 49 item Karawang;
  snapshot nilai workbook pengguna, dengan catatan alokasi asli dipertahankan.

BAHAN VISUAL DAN SUMBER
  project-files/assets/kpn-corp.png — wordmark dari aset KPN existing.
  project-files/assets/diagrams/ — diagram PNG/SVG dan source Graphviz DOT.
  project-files/references/flow-BEL-user.png — flowchart awal pemilik kebutuhan.
  project-files/source/ — konten terstruktur, renderer dan snapshot JSON.
  project-files/source/karawang-bom.json — snapshot angka BoM yang dipakai dokumen.
  project-files/supporting/build-report.json — pemeriksaan konsistensi/artefak.
  project-files/previews/ — pratinjau halaman hasil cetak (bila sudah dibuat).

HAL YANG BELUM DIPUTUSKAN
  Lihat O-01 s.d. O-13, khususnya lokasi final, menu parity, approval fallback offline,
  pengembalian kartu, konfigurasi live, perangkat, aturan timbang,
  kontrak SAP, migrasi database, target layanan, registrasi tanpa
  Customer Pre-Registration dan aturan hasil AI/OCR.
  Dokumen tidak menyatakan persetujuan, parity penuh, atau fitur selesai.
  UAT dalam CSV adalah skenario rencana; belum dijalankan pada aplikasi.

MEMBANGUN ULANG
  Python 3.12+, Graphviz (dot), font Noto Sans TTF.
  Dari root repositori awb-dws:
  npm run docs:setup   (sekali saja; membuat docs/.venv)
  docs/.venv/bin/python docs/project-files/source/build_documents.py
  Hanya BRD: tambahkan --document BRD agar PRD tidak dibuat ulang.
  Font default: /usr/share/fonts/google-noto
  Override lokasi font dengan AWB_DOC_FONT_DIR.
  Font simbol default: /usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf
  Override font simbol dengan AWB_DOC_SYMBOL_FONT.
  Logo/flowchart referensi sudah disertakan; repositori sumber dibutuhkan
  hanya untuk memperbarui hash pada source-register.csv.
  Untuk memperbarui angka BoM dari workbook pengguna:
  docs/.venv/bin/python docs/project-files/source/extract_karawang_bom.py '/home/benzeta/Downloads/AWS-BOM All Plant Downstream.xlsx'

Pemeriksaan build: 18 BR,
50 FR dan
43 skenario UAT tertaut.
