"""Render code-native diagrams with Graphviz; no external services required."""

import subprocess
from pathlib import Path

PREFIX = r'''
digraph G {
graph [bgcolor="white", pad="0.25", nodesep="0.30", ranksep="0.35", dpi=180,
       fontname="Noto Sans", fontsize=11, compound=true, outputorder="edgesfirst"];
node [shape=box, style="rounded,filled", fillcolor="#F7F5F2", color="#BDB6B0",
      fontname="Noto Sans", fontsize=12, fontcolor="#302F31",
      margin="0.16,0.12", penwidth=1.1];
edge [fontname="Noto Sans", fontsize=10, fontcolor="#635F5D", color="#8D8580",
      penwidth=1.15, arrowsize=0.7];
'''

SPECS = {
    "architecture": r'''
rankdir=TB;
newrank=true;
subgraph cluster_ho {
 label="AWS / HEAD OFFICE"; labelloc=t; color="#BCB3AC"; style="rounded";
 customer [label="Customer (opsional)\nCustomer Pre-Registration"];
 hostaff [label="Petugas HO\nRegistrasi tanpa prereg"];
 portal [label="Portal prereg + QR\nApproval Logistik HO", fillcolor="#F7E9E7", color="#A13E34"];
 hodb [label="Database HO (PostgreSQL)\nPrereg + registrasi HO + versi", shape=cylinder];
 {rank=same; customer; hostaff;}
 customer -> portal; hostaff -> portal; portal -> hodb;
}
sap [label="SAP / ERP\nKontrak integrasi TBD", fillcolor="#ECEAE7"];
subgraph cluster_site {
 label="ON PREMISE / SETIAP PABRIK"; labelloc=t; color="#A13E34"; style="rounded";
 kiosk [label="Kiosk supir\nRegistrasi / WB 2 tap / keluar"];
 tcs [label="Petugas TCS\nInspection / QC / handling"];
 app [label="Aplikasi operasional terpadu\nWB baru + kontrol journey", fillcolor="#F7E9E7", color="#A13E34"];
 db [label="SATU DATABASE SITE (SQL Server)\nCache prereg + journey + WB\nStasiun + audit + inbox/outbox", shape=cylinder, fillcolor="#F7E9E7", color="#A13E34"];
 gateway [label="Gateway / adapter site"];
 hw [label="RFID / indikator / sensor\nBarrier / kamera AI-OCR / printer"];
 {rank=same; kiosk; tcs;}
 {rank=same; db; gateway;}
 kiosk -> app; tcs -> app; app -> db [dir=both];
 app -> gateway [dir=both]; gateway -> hw [dir=both];
}
hodb -> kiosk [style=invis];
hodb -> db [dir=both, style=dashed, color="#A13E34", label="Sinkronisasi dua arah\nprereg + registrasi HO / fakta operasional"];
portal -> sap [dir=both, style=dashed, label="Dokumen / master"];
app -> sap [dir=both, style=dashed, label="Posting / rekonsiliasi"];
''',
    "journey": r'''
rankdir=TB;
ho [label="Customer Pre-Registration (opsional)\natau data supir / petugas HO", fillcolor="#F7E9E7", color="#A13E34"];
reg [label="Kiosk registrasi\nScan QR atau isi data → ambil kartu → tap"];
wi [label="WB IN\n2 tap + AI/OCR"];
stage [label="Stasiun sesuai flow\nHasil petugas TCS"];
wo [label="WB OUT\n2 tap + AI/OCR"];
exit [label="Kiosk registrasi keluar\nTiket + penutupan journey", fillcolor="#F7E9E7", color="#A13E34"];
ho -> reg -> wi -> stage -> wo -> exit;
{rank=same; wi; stage; wo;}
reject [label="Reject material\nLewati proses tersisa", color="#A13E34", fillcolor="#F7E9E7"];
stage -> reject [label="bila reject"]; reject -> wo;
''',
    "fallback": r'''
rankdir=TB;
scan [label="Scan QR dan verifikasi\nID prereg + site + approval", fillcolor="#F7E9E7", color="#A13E34"];
local [label="Data lokal ada?", shape=diamond, fillcolor="white"];
normal [label="Registrasi normal\nAmbil kartu + tap / binding"];
lookup [label="Lookup HO bila online\nData belum tersedia / offline"];
form [label="Supir isi fallback\nField terverifikasi terkunci"];
auth [label="Otorisasi / master\nterverifikasi?", shape=diamond, fillcolor="white"];
pending [label="Draft / exception\nBelum boleh binding", color="#A13E34"];
commit [label="Satu journey provisional\nBinding + outbox atomik", fillcolor="#F7E9E7", color="#A13E34"];
sync [label="Saat online: sinkronkan fakta site\nCocokkan prereg global yang sama"];
result [label="Matched: journey tetap sama\nConflict / orphan: resolusi berjejak"];
scan -> local;
local -> normal [label="ya"];
local -> lookup [label="tidak"];
lookup -> normal [label="data didapat"];
lookup -> form [label="belum ada"];
form -> auth;
auth -> pending [label="tidak"];
auth -> commit [label="ya"];
commit -> sync -> result;
{rank=same; normal; lookup;}
{rank=same; pending; commit;}
''',
    "registration": r'''
rankdir=TB;
arrive [label="Truk tiba di kiosk registrasi"];
hasqr [label="Membawa QR Customer\nPre-Registration?", shape=diamond, fillcolor="white"];
qr [label="Scan QR + verifikasi\nprereg_qr"];
local [label="Data prereg tersedia\ndi pabrik?", shape=diamond, fillcolor="white"];
fallback [label="Fallback data QR\nSupir isi dari surat jalan\nqr_fallback"];
hodata [label="Data sudah diisi\npetugas HO?", shape=diamond, fillcolor="white"];
hoentry [label="Cari + konfirmasi data HO\nho_staff_entry"];
driver [label="Supir isi data registrasi\ndriver_entry"];
check [label="Lolos verifikasi / pemeriksaan\nsesuai jalur (O-02 / O-12)?", shape=diamond, fillcolor="white"];
bind [label="Ambil kartu dari tempat biasa\nTap di kiosk yang sama → binding", fillcolor="#F7E9E7", color="#A13E34"];
help [label="Draft / exception\nBelum boleh binding", color="#A13E34"];
arrive -> hasqr;
hasqr -> qr [label="ya"];
hasqr -> hodata [label="tidak"];
qr -> local;
local -> check [label="ya"];
local -> fallback [label="tidak"];
fallback -> check;
hodata -> hoentry [label="ya"];
hodata -> driver [label="tidak / belum tiba"];
hoentry -> check; driver -> check;
check -> bind [label="ya"];
check -> help [label="tidak"];
{rank=same; qr; hodata;}
{rank=same; fallback; hoentry; driver;}
{rank=same; bind; help;}
''',
    "wb-two-tap": r'''
rankdir=TB;
enter [label="Lane kosong\nLampu / petunjuk mengizinkan masuk"];
position [label="Truk berhenti di platform\nAI memeriksa posisi / perimeter"];
walk [label="Supir turun ke kiosk\ndi dalam area timbangan"];
tap1 [label="Tap 1: tampilkan data journey\nhasil OCR pelat + status AI\nBelum merekam berat", fillcolor="#F7E9E7", color="#A13E34"];
ok [label="Data sesuai dan\nkebijakan AI/OCR (O-13) terpenuhi?", shape=diamond, fillcolor="white"];
tap2 [label="Tap 2: kartu dan sesi yang sama\nAmbil berat stabil dari indikator", fillcolor="#F7E9E7", color="#A13E34"];
commit [label="Commit berat + bukti\nSatu capture per tahap"];
release [label="Supir kembali ke truk\nLampu / barrier keluar → tahap berikutnya"];
warn [label="Peringatan / tahan\nPetunjuk dan bantuan sesuai kebijakan", color="#A13E34"];
enter -> position -> walk -> tap1 -> ok;
ok -> tap2 [label="ya"];
ok -> warn [label="tidak"];
warn -> tap1 [style=dashed, label="setelah ditangani"];
tap2 -> commit -> release;
{rank=same; tap2; warn;}
''',
    "flow-bel": r'''
rankdir=TB;
start [label="Reg IN + binding RFID\ndengan / tanpa Customer Pre-Registration", fillcolor="#F7E9E7", color="#A13E34"];
wi [label="WB IN\n2 tap + AI/OCR"];
sampling [label="Sampling\nTap + hasil/foto petugas"];
lab [label="Lab / keputusan mutu"];
unload [label="Unloading\nTap + started/completed"];
wo [label="WB OUT\n2 tap + AI/OCR"];
exit [label="Reg OUT + tiket\ncompleted / rejected", fillcolor="#F7E9E7", color="#A13E34"];
hold [label="Hold stay / keputusan OutSpec", fillcolor="white"];
reject [label="Reject material", color="#A13E34"];
start -> wi -> sampling -> lab -> unload -> wo -> exit;
lab -> hold [label="hold"]; hold -> lab [style=dashed, label="keputusan"];
unload -> sampling [style=dashed, label="resample bila diizinkan"];
lab -> reject [label="reject"]; unload -> reject [label="reject"];
reject -> wo;
''',
    "flow-jul": r'''
rankdir=TB;
start [label="Reg IN + binding RFID\ndengan / tanpa Customer Pre-Registration", fillcolor="#F7E9E7", color="#A13E34"];
wi [label="WB IN\n2 tap + AI/OCR"];
inspection [label="Inspection + tap awal kelompok"];
subgraph cluster_parallel {
label="KELOMPOK PARALEL qc_phase"; color="#BDB6B0"; style="rounded";
loading [label="Loading\nstarted/completed"];
sampling [label="Sampling"];
lab [label="Lab"];
{rank=same; loading; sampling; lab;}
sampling -> lab [style=dashed, label="identitas sampel"];
}
join [label="Semua tahap wajib selesai?", shape=diamond, fillcolor="white"];
wo [label="WB OUT\n2 tap + AI/OCR"];
exit [label="Reg OUT + tiket", fillcolor="#F7E9E7", color="#A13E34"];
reject [label="Reject → lewati proses tersisa", color="#A13E34"];
start -> wi -> inspection;
inspection -> loading; inspection -> sampling; inspection -> lab;
loading -> join; sampling -> join; lab -> join;
join -> wo [label="ya"]; wo -> exit;
lab -> reject [constraint=false]; loading -> reject [constraint=false]; reject -> wo;
''',
    "flow-lsk": r'''
rankdir=TB;
start [label="Reg IN + binding RFID\ndengan / tanpa Customer Pre-Registration", fillcolor="#F7E9E7", color="#A13E34"];
wi [label="WB IN\n2 tap + AI/OCR"];
inspection [label="Inspection + tap\nKeputusan run_qc"];
subgraph cluster_parallel {
label="KELOMPOK PARALEL"; color="#BDB6B0"; style="rounded";
loading [label="Loading wajib"];
qc [label="Sampling + Lab\nJika run_qc = true"];
skip [label="QC skipped tercatat\nJika run_qc = false", fillcolor="white"];
{rank=same; loading; qc; skip;}
}
join [label="Loading dan anggota wajib selesai?", shape=diamond, fillcolor="white"];
wo [label="WB OUT\n2 tap + AI/OCR"];
exit [label="Reg OUT + tiket", fillcolor="#F7E9E7", color="#A13E34"];
reject [label="Reject → WB OUT", color="#A13E34"];
start -> wi -> inspection;
inspection -> loading; inspection -> qc [label="QC ya"]; inspection -> skip [label="QC tidak"];
loading -> join; qc -> join; skip -> join;
join -> wo -> exit;
qc -> reject [constraint=false]; loading -> reject [constraint=false]; reject -> wo;
''',
    "flow-lsm": r'''
rankdir=TB;
start [label="Reg IN + binding RFID\ndengan / tanpa Customer Pre-Registration", fillcolor="#F7E9E7", color="#A13E34"];
wi [label="WB IN\n2 tap + AI/OCR"];
inspection [label="Inspection\nKeputusan run_qc"];
qc [label="Sampling + Lab\nJika run_qc = true"];
skip [label="QC skipped tercatat\nJika run_qc = false", fillcolor="white"];
unload [label="Unloading wajib\nTap + started/completed"];
wo [label="WB OUT\n2 tap + AI/OCR"];
exit [label="Reg OUT + tiket", fillcolor="#F7E9E7", color="#A13E34"];
reject [label="Reject → WB OUT", color="#A13E34"];
start -> wi -> inspection;
inspection -> qc [label="QC ya"]; inspection -> skip [label="QC tidak"];
qc -> unload; skip -> unload;
unload -> wo -> exit;
qc -> reject; unload -> reject [constraint=false]; reject -> wo;
{rank=same; qc; skip;}
''',
}


def render_all(directory: Path):
    directory.mkdir(parents=True, exist_ok=True)
    for name, body in SPECS.items():
        dot_path = directory / f"{name}.dot"
        dot_path.write_text(PREFIX + body + "\n}\n", encoding="utf-8")
        for extension in ("svg", "png"):
            subprocess.run(
                ["dot", f"-T{extension}", str(dot_path), "-o", str(directory / f"{name}.{extension}")],
                check=True, capture_output=True, text=True,
            )
