"""Self-contained business proposal for the proposed Priscolin Karawang pilot."""

import json
from pathlib import Path
from common import p, h, bullets, table, section

BOM = json.loads((Path(__file__).parent / "karawang-bom.json").read_text(encoding="utf-8"))


def amount(value):
    return f"{int(value):,}".replace(",", ".")


def rupiah(value):
    return "Rp" + amount(value)


TOTAL = rupiah(BOM["grand_total"])
OBJECTIVE_BY_BR = {
    "BR-01": "OBJ-02", "BR-02": "OBJ-01", "BR-03": "OBJ-03",
    "BR-04": "OBJ-05", "BR-05": "OBJ-02", "BR-06": "OBJ-02",
    "BR-07": "OBJ-02", "BR-08": "OBJ-02", "BR-09": "OBJ-02",
    "BR-10": "OBJ-02", "BR-11": "OBJ-03", "BR-12": "OBJ-02",
    "BR-13": "OBJ-04", "BR-14": "OBJ-02", "BR-15": "OBJ-01",
    "BR-16": "OBJ-05", "BR-17": "OBJ-01", "BR-18": "OBJ-04",
}


BRD = {
    "kind": "BRD",
    "title": "Business Requirements Document",
    "subtitle": "Autonomous Weighbridge Downstream",
    "code": "KPN-AWB-DWS-BRD-001",
    "version": "0.7", "date": "28 Oktober 2026", "status": "USULAN PROYEK INTERNAL",
    "core_section_count": 7,
    "purpose": "Mengatur seluruh alur kendaraan dalam satu sistem, dari Customer Pre-Registration sampai truk keluar pabrik.",
    "pilot_label": "PRISCOLIN KARAWANG — USULAN PILOT",
    "compact_opening": True, "show_toc": False, "show_cover_controls": False,
    "cover_overline": "USULAN PROYEK INTERNAL / KPN CORP",
    "opening_title": "Autonomous Weighbridge\nDownstream",
    "opening_subtitle": "Business Requirements Document  |  Usulan Pilot Priscolin Karawang",
    "header_label": "AWB-DWS / USULAN PILOT PRISCOLIN KARAWANG",
    "footer_label": "KPN CORP  |  INTERNAL",
    "sections": [
        section("Ringkasan Eksekutif",
            p("AWB Downstream mengatur dan mencatat seluruh alur kendaraan dalam satu sistem: Customer Pre-Registration, registrasi masuk, timbang, proses di pabrik dan registrasi keluar. Customer Pre-Registration bersifat opsional; truk yang belum menggunakannya tetap dapat registrasi di pabrik."),
            h("Fungsi Utama Sistem"),
            table(["Layanan", "Fungsi bagi pengguna"], [
                ["Customer Pre-Registration (opsional)", "Customer mengisi data sebelum truk datang. Logistik Kantor Pusat (HO) menyetujui, lalu surat jalan ber-QR dipakai untuk mempercepat registrasi."],
                ["Registrasi masuk", "Mendukung truk dengan atau tanpa Customer Pre-Registration. Data registrasi dapat diisi supir atau petugas HO, lalu dihubungkan ke kartu RFID."],
                ["Timbang masuk dan keluar", "Supir menjalankan dua tap RFID di kiosk: cek data, lalu meminta pencatatan berat. Kamera AI dan OCR membantu pemeriksaan kendaraan."],
                ["Proses pabrik sampai keluar", "Mengatur tahap pemeriksaan, sampling, lab dan loading/unloading; mencatat hasil petugas, tiket timbang dan selesainya perjalanan truk."],
            ], [0.31, 0.69]),
            {"type": "metrics", "items": [
                [TOTAL, "Estimasi perangkat dan material pilot"],
                ["2 unit", "Jembatan timbang pilot Karawang"],
            ]},
            p("Supir menggunakan kiosk layar sentuh; petugas tetap menangani QC dan loading/unloading serta mengisi hasilnya."),
            h("Keputusan yang Diajukan kepada Manajemen"),
            bullets(
                "Persetujuan pilot di Priscolin Karawang sebagai lokasi usulan, serta penugasan Logistik, Operasional Pabrik, IT dan Engineering.",
                "Pelaksanaan survei dan penyusunan anggaran lengkap berdasarkan estimasi perangkat/material di atas.",
            ),
        ),
        section("Tujuan Bisnis",
            p("Proyek ini bertujuan membuat seluruh alur kendaraan berjalan dan tercatat dalam satu sistem. Customer, supir, Logistik HO dan petugas pabrik dapat melihat data serta pekerjaan yang sesuai dengan tugasnya. Layanan di pabrik tetap berjalan meskipun customer belum menggunakan Customer Pre-Registration."),
            table(["Tujuan", "Ukuran keberhasilan pilot"], [
                ["Registrasi dan timbang mandiri", "Supir dapat menyelesaikan registrasi, timbang dan keluar tanpa bantuan rutin operator. Kedatangan dengan dan tanpa Customer Pre-Registration diuji."],
                ["Data transaksi yang benar", "Dokumen, identitas truk, hasil timbang dan hasil petugas sesuai pada pembelian, penjualan serta langsir masuk/keluar."],
                ["Alur yang mudah dipantau", "Tahap truk, antrean, waktu tunggu dan pekerjaan yang belum selesai dapat dilihat. Waktu proses sebelum dan selama pilot dibandingkan."],
                ["Layanan tetap berjalan", "Kedatangan tanpa Customer Pre-Registration serta data HO yang terlambat dapat ditangani sesuai prosedur masing-masing."],
                ["Penggantian WB.NET", "Aplikasi baru memenuhi menu, fungsi, hasil cetak dan laporan WB.NET yang disepakati bersama pengguna."],
            ], [0.34, 0.66]),
            p("Kondisi awal dan target pengurangan waktu proses ditetapkan bersama Operasional Pabrik saat persiapan pilot. Nilai penghematan ditentukan setelah hasil pengukuran tersedia."),
            h("Penggunaan Aplikasi yang Sudah Ada"),
            p("Customer Pre-Registration yang sudah ada menjadi dasar layanan opsional sebelum truk datang. Aturan pengajuan dan persetujuannya tetap sama; tampilan diperbarui dan QR ditambahkan pada surat jalan. Penerapannya ke customer dapat dilakukan bertahap tanpa menunggu seluruh customer menggunakannya."),
            p("Fungsi TCS dipakai untuk mengatur tahap pemeriksaan, sampling, lab dan loading/unloading beserta hasil petugas. Untuk penimbangan, aplikasi baru menggantikan seluruh WB.NET dengan menu dan fungsi yang sama serta tampilan baru. Semuanya mendukung satu alur kendaraan AWB Downstream."),
        ),
        section("Ruang Lingkup Proyek",
            h("Alur Kendaraan dari Awal sampai Akhir"),
            table(["Tahap", "Layanan yang diberikan aplikasi"], [
                ["1. Customer Pre-Registration (opsional)", "Jika digunakan, customer mengisi data dan Logistik HO menyetujui sesuai aturan yang berlaku. Surat jalan ber-QR kemudian dapat dipindai saat registrasi di pabrik."],
                ["2. Registrasi masuk", "QR dipakai bila tersedia. Tanpa Customer Pre-Registration, data registrasi diisi supir atau petugas HO. Setelah data tersedia, supir mengambil kartu RFID dari tempat biasa lalu tap di kiosk yang sama untuk menghubungkannya ke registrasi."],
                ["3. Timbang masuk (WB IN)", "Supir turun dari truk ke kiosk di dalam area timbangan. Tap RFID pertama menampilkan data untuk dicek dan dicocokkan. Tap kedua mengambil berat dari sensor timbangan melalui indikator."],
                ["4. Proses di pabrik (TCS)", "Petugas melakukan pemeriksaan, sampling, lab dan loading/unloading sesuai jenis transaksi lalu mengisi hasil. Supir tap RFID pada tahap yang memerlukannya."],
                ["5. Timbang keluar (WB OUT)", "Supir turun dan melakukan kedua tap di dalam area timbangan: tap pertama menampilkan data, lalu tap kedua mengambil berat keluar dari sensor timbangan melalui indikator."],
                ["6. Registrasi keluar", "Supir tap RFID dan memeriksa data di kiosk keluar. Sistem mencetak tiket timbang dan menyelesaikan registrasi keluar."],
            ], [0.25, 0.75]),
            p("Pada WB IN dan WB OUT, kamera AI memeriksa posisi truk, batas area (perimeter) dan keberadaan orang pada area pemantauan yang ditentukan. OCR membaca pelat nomor untuk dicocokkan dengan data truk. Area deteksi diatur mengikuti posisi kiosk dan supir yang melakukan kedua tap di dalam area timbangan."),
            h("Jenis Transaksi yang Dilayani"),
            table(["Transaksi", "Arah material dan kegiatan utama"], [
                ["Pembelian (BEL)", "Material masuk dari pemasok: sampling dan lab sebelum unloading."],
                ["Penjualan (JUL)", "Material keluar untuk customer: inspection, lalu loading dan proses QC sebelum transaksi selesai."],
                ["Langsir keluar (LSK)", "Pemindahan material keluar pabrik: inspection dan loading, dengan sampling/lab bila diperlukan."],
                ["Langsir masuk (LSM)", "Pemindahan material masuk pabrik: inspection, sampling/lab bila diperlukan, lalu unloading."],
            ], [0.28, 0.72]),
            p("Customer Pre-Registration diakses melalui internet pada AWS di HO. Kegiatan pabrik memakai aplikasi dan satu database di lokasi masing-masing, dengan sinkronisasi data dua arah ke HO."),
            p("Pilot Karawang menjadi tahap awal sebelum perluasan ke pabrik lain. Tolling dan multi-DO pada Customer Pre-Registration ditunda."),
        ),
        section("Kebutuhan Bisnis",
            p("Kebutuhan berikut harus tersedia agar seluruh alur kendaraan dapat berjalan dalam satu sistem. Pengguna memeriksa hasilnya saat pilot."),
            table(["Area kebutuhan", "Hasil bisnis yang harus dipenuhi"], [
                ["Customer Pre-Registration opsional", "Customer dapat mengisi data lebih awal untuk mempercepat registrasi. Aturan pengajuan dan persetujuan Logistik HO tetap berlaku pada layanan ini; penggunaannya tidak menjadi syarat seluruh kedatangan."],
                ["Registrasi dan kartu RFID", "Registrasi menerima truk dengan atau tanpa Customer Pre-Registration. Data dokumen, kendaraan dan supir dapat diisi oleh supir atau petugas HO. Kartu RFID dihubungkan ke satu registrasi."],
                ["Dua tap saat timbang", "Pada WB IN dan WB OUT, supir turun dan melakukan kedua tap di dalam area timbangan. Tap pertama menampilkan data untuk dicek; tap kedua mengambil berat dari sensor timbangan melalui indikator. Tap pertama belum mencatat hasil timbang."],
                ["Pemeriksaan AI dan OCR", "Sistem memeriksa posisi/perimeter kendaraan, mendeteksi orang di area timbang dan membaca pelat nomor dengan OCR. Hasil pemeriksaan serta foto terkait dengan data dan hasil timbang truk yang sama."],
                ["Proses pabrik dan hasil petugas", "Tahap inspection, sampling, lab dan loading/unloading mengikuti jenis transaksi. Petugas tetap melakukan pekerjaan dan mengisi hasil; keputusan QC tetap pada petugas yang ditunjuk."],
                ["Data QR belum tersinkron", "Jika Customer Pre-Registration sudah ada tetapi belum tersedia di pabrik, supir mengisi data berdasarkan surat jalan yang sah. Data disinkronkan kembali saat online. Kasus ini dibedakan dari kedatangan tanpa Customer Pre-Registration."],
                ["Penyelesaian transaksi", "Hasil timbang masuk/keluar, perhitungan, tiket dan laporan memenuhi kebutuhan BEL, JUL, LSK dan LSM. Truk dengan material ditolak tetap melalui WB OUT dan registrasi keluar."],
                ["Data dan riwayat transaksi", "Dokumen, kartu, hasil timbang dan hasil petugas berada dalam satu perjalanan. Pengulangan proses tidak menggandakan transaksi; perubahan dan persetujuan dapat diperiksa kembali."],
                ["Pemantauan", "Operasional dan manajemen dapat melihat tahap truk, antrean, waktu tunggu, pekerjaan yang belum selesai dan hasil transaksi."],
                ["Kesiapan penggunaan", "Menu dan fungsi WB.NET yang disepakati tetap tersedia pada aplikasi baru. Perangkat, area kerja, pengguna dan prosedur bantuan/gangguan disiapkan sebelum pilot."],
            ], [0.29, 0.71]),
        ),
        section("Pihak yang Terlibat",
            p("Tugas pengguna dan tim pelaksana dibagi sebagai berikut. Penanggung jawab masing-masing bagian ditunjuk saat persiapan pilot."),
            table(["Pihak", "Peran dalam layanan dan proyek"], [
                ["Manajemen", "Menetapkan lokasi final, anggaran dan tim; menilai hasil pilot serta perluasan ke pabrik lain."],
                ["Operasional Pabrik", "Menyiapkan prosedur registrasi dan timbang, termasuk kedatangan tanpa Customer Pre-Registration; menyiapkan pengguna dan memeriksa hasil aplikasi baru."],
                ["Logistik HO", "Menyetujui Customer Pre-Registration sesuai proses yang berlaku. Petugas HO juga dapat mengisi data registrasi untuk truk tanpa Customer Pre-Registration."],
                ["Customer", "Dapat menggunakan Customer Pre-Registration untuk mengisi data lebih awal. Dokumen transaksi yang diperlukan tetap harus tersedia meskipun layanan ini tidak digunakan."],
                ["Supir", "Dapat mengisi registrasi sendiri, mengambil/tap RFID, turun ke kiosk untuk kedua tap di dalam area timbangan dan mengikuti proses pabrik sampai registrasi keluar."],
                ["Petugas QC dan loading/unloading", "Melakukan inspection, sampling, lab dan loading/unloading; mengisi hasil dan membuat keputusan sesuai tugasnya."],
                ["Tim Aplikasi dan IT", "Menyiapkan aplikasi, data, koneksi dengan sistem perusahaan, jaringan dan dukungan saat pengujian serta pilot."],
                ["Engineering dan Pengadaan", "Memeriksa area dan kebutuhan perangkat, menyiapkan pemasangan serta pekerjaan pendukung di pabrik."],
            ], [0.36, 0.64]),
            h("Perubahan Cara Kerja"),
            p("Supir menjalankan registrasi dan timbang rutin melalui kiosk. Petugas pabrik tetap bekerja pada QC dan loading/unloading serta membantu kasus gangguan sesuai prosedur. Customer Pre-Registration diperkenalkan bertahap; layanan di pabrik tetap mendukung customer yang belum menggunakannya."),
        ),
        section("Batasan Proyek",
            table(["Batasan / ketergantungan", "Perlakuan dalam usulan"], [
                ["Lokasi masih diusulkan", "Priscolin Karawang menjadi dasar proposal dan estimasi perangkat/material. Lokasi final ditetapkan manajemen sebelum persiapan lapangan."],
                ["Customer Pre-Registration opsional", "Registrasi oleh supir atau petugas HO harus tersedia sejak pilot. Penggunaan Customer Pre-Registration oleh customer dapat ditingkatkan bertahap; layanan pabrik tetap berjalan tanpa menunggu seluruh customer menggunakannya."],
                ["Pemeriksaan saat timbang", "Kedua tap dilakukan di dalam area timbangan. Posisi kiosk, jalur supir dan area deteksi AI perlu diuji bersama. Aturan hasil AI/OCR untuk melanjutkan atau menahan proses ditetapkan sebelum pilot."],
                ["Fungsi WB.NET", "Menu, contoh dokumen, laporan dan kebutuhan pengguna WB.NET dibandingkan dengan aplikasi baru sebelum dipakai."],
                ["Anggaran dan jadwal", "Biaya lengkap, jadwal dan target pengurangan waktu disusun setelah survei dan pengukuran kondisi awal. Penggunaan ulang fasilitas belum dihitung sebagai pengurangan biaya."],
            ], [0.34, 0.66]),
            h("Kesiapan Lokasi dan Perangkat"),
            bullets(
                "Registrasi: kiosk masuk/keluar, layar sentuh, QR/RFID reader, tempat pengambilan kartu dan printer tiket.",
                "Timbang: indikator, sensor posisi, kamera AI/OCR, pencahayaan, barrier gate dan petunjuk/lampu kendaraan.",
                "Area supir: posisi kiosk/reader di dalam area timbangan untuk kedua tap, jalur turun/berjalan dari truk dan area pemantauan kamera yang sesuai.",
                "Stasiun pabrik: perangkat untuk petugas serta RFID reader sesuai tahap inspection, sampling, lab dan loading/unloading yang memerlukannya.",
                "Infrastruktur: server, jaringan, internet, listrik, UPS, grounding, kabel dan pekerjaan civil yang diperlukan.",
            ),
            h("Rencana Pilot"),
            p("Persiapan dimulai dengan survei lokasi, pengecekan perangkat dan kesepakatan prosedur. Aplikasi serta perangkat kemudian disiapkan dan diuji pada BEL, JUL, LSK dan LSM, termasuk kedatangan tanpa Customer Pre-Registration serta gangguan data/perangkat. Hasil pilot menjadi dasar perbaikan dan keputusan perluasan. Jadwal ditetapkan setelah kebutuhan lapangan jelas."),
        ),
        section("Analisis Biaya dan Manfaat",
            p(f"Dasar estimasi adalah daftar kebutuhan perangkat dan material atau Bill of Materials (BoM) Priscolin Karawang untuk {BOM['weighbridges']} jembatan timbang digital. Nilai awal sebesar {TOTAL}, dengan rincian kelompok berikut."),
            table(["Kelompok kebutuhan", "Estimasi (Rp)"],
                  [[g["title"], amount(g["total"])] for g in BOM["groups"]]
                  + [["TOTAL ESTIMASI BoM", amount(BOM["grand_total"])]],
                  [0.67, 0.33]),
            p("Rincian perangkat, kuantitas dan harga satuan disediakan dalam BoM Priscolin Karawang sebagai lampiran Excel terpisah."),
            h("Manfaat yang Menjadi Dasar Investasi"),
            table(["Manfaat", "Dasar penilaian"], [
                ["Efisiensi pelayanan", "Keberhasilan layanan mandiri, kebutuhan bantuan dan perubahan waktu tunggu selama pilot."],
                ["Data dan pengawasan", "Kelengkapan catatan dari registrasi sampai keluar, hasil timbang beserta bukti pemeriksaan, serta kemudahan memeriksa riwayat keputusan."],
                ["Layanan yang tetap berjalan", "Pemenuhan fungsi pengganti WB.NET serta keberhasilan melayani kedatangan tanpa Customer Pre-Registration dan kasus data HO terlambat."],
            ], [0.34, 0.66]),
            h("Batas Nilai Investasi yang Ditampilkan"),
            p("Nilai di atas adalah estimasi BoM perangkat/material, bukan keseluruhan anggaran proyek. BoM secara eksplisit belum mencakup pengerjaan civil/pondasi, pulling cable dan network termination."),
            p("Biaya pengembangan aplikasi internal, layanan AWS/HO, persiapan pengguna dan dukungan operasional belum dirinci sebagai pos biaya tersendiri pada BoM. Status pajak dan biaya pengadaan lainnya juga perlu dikonfirmasi saat menyusun anggaran lengkap."),
            p("Kuantitas dan harga pada BoM dipertahankan sebagai dasar estimasi awal. Penghematan, masa pengembalian investasi dan total anggaran proyek belum dapat dihitung sebelum biaya lengkap serta kondisi awal operasional disepakati."),
        ),
    ],
}
