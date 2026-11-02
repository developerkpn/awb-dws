"""Extract and independently reconcile the supplied Karawang BoM.

The workbook is read only. Document content reads the saved snapshot so that
rebuilding the proposal does not require access to the user's Downloads folder.
"""
import csv
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import argparse
from openpyxl import load_workbook
from openpyxl.drawing.image import Image
from openpyxl.styles import Alignment, Font, PatternFill

ROOT = Path(__file__).resolve().parents[1]
SHEET = "2-Priscolin Karawang-7803"
GROUPS = [
    ("wb", "Perangkat Weighbridge dan TCS", 3, 12, 14),
    ("server", "Server dan Jaringan", 17, 38, 39),
    ("tools", "Tools dan Material Pendukung", 41, 45, 47),
    ("grounding", "Grounding", 49, 54, 56),
    ("additional", "Material Tambahan", 58, 63, 64),
]
SHORT_NAMES = {
    3: "Barrier gate BAISHENG BS-3306-3S, boom 4 m",
    4: "KIOS-Q Unmanned (transaksi timbang)",
    5: "KIOS-Q Registrasi 450 × 450 × 1700 mm",
    6: "Indikator digital Presica PSC-7803",
    7: "RFID pole gooseneck + sirene/lampu/tombol",
    8: "Traffic light JD3003-4215",
    9: "Sensor radar barrier gate VR10 Pro",
    10: "Controller board 2 Wiegand / TCP-IP",
    11: "Panel server 600 × 400 × 200 mm",
    12: "Panel registrasi/stasiun 400 × 300 × 200 mm",
    17: "Thinkstation PX / RTX PRO 4500 Blackwell 32 GB",
    18: "Switch UNIFI US 24 port PoE 250 W",
    19: "Routerboard CCR2004-16G-2S+",
    20: "POS AIO ES-R01II touchscreen 15,6 inci",
    21: "Synology DS923+",
    22: "SSD SATA 1 TB Synology / WD RED",
    23: "CCTV Hikvision DS-2CD2T43G2 4 MP",
    24: "Webcam Logitech C920 Pro",
    25: "Tablet Samsung Galaxy Tab A9 Lite EE",
    26: "Tas pelindung tablet A9 Lite EE",
    27: "Smart UPS APC SMC1500i-2uc",
    28: "Stabilizer Matsunaga 5000 W / 5 kVA",
    29: "NVR 16 channel",
    30: "Rack server IR6032G 19 inci / 32U",
    31: "UPS APC SRV3KI 3000 VA",
    32: "HDD Seagate Skyhawk 2 TB",
    33: "Scanner QR/barcode Taffware MP6300Y",
    34: "NFC/RFID reader ACR122U",
    35: "Converter USR RS232 ke LAN",
    36: "Switch UNIFI USW Lite 8 PoE",
    37: "Switch Ubiquiti USW-Pro-8-PoE",
    38: "RFID USB reader Mifare MF1 S50",
    41: "Kabel power NYYHY 3 × 1,5 mm",
    42: "Kabel Belden AWG-22, 2 pair",
    43: "Kabel UTP Cat-6 Belden",
    44: "Dynabolt M12 / 12 × 75 mm",
    45: "AC split 1 PK",
    49: "Kabel bare copper 50 mm",
    50: "Rod copper grounding 5/8 × 3000 mm",
    51: "Busbar copper 3 × 220 × 20 mm",
    52: "Clamp copper rod grounding 5/8 inci",
    53: "Scun kabel SC 16 mm",
    54: "Kabel NYA 6 mm 450/750 VAC",
    58: "Kartu PVC RFID Mifare 13,56 MHz",
    59: "Tongkat fleksibel e-toll 400 mm",
    60: "Scun kabel 1,5 mm² Y-type",
    61: "Scun kabel 1,5 mm I-type ferrule",
    62: "Scun kabel 0,75 mm I-type ferrule",
    63: "Pipa listrik conduit 20 mm",
}


def write_attachment(workbook, snapshot):
    """Export Karawang's cached values and original layout as a cost snapshot."""
    for name in list(workbook.sheetnames):
        if name != SHEET:
            del workbook[name]
    for name in list(workbook.defined_names):
        del workbook.defined_names[name]
    summary = workbook.create_sheet("Ringkasan", 0)
    summary.sheet_view.showGridLines = False
    summary.column_dimensions["A"].width = 58
    summary.column_dimensions["B"].width = 30
    summary.row_dimensions[1].height = 45
    logo_path = ROOT / "assets/kpn-corp.png"
    if logo_path.exists():
        logo = Image(str(logo_path))
        logo.width, logo.height = 220, 46
        summary.add_image(logo, "A1")
    summary.merge_cells("A4:B4")
    summary["A4"] = "BoM Priscolin Karawang — Usulan Pilot AWB Downstream"
    summary["A4"].font = Font(name="Noto Sans", size=13, bold=True, color="A13E34")
    summary["A5"] = "Cakupan"
    summary["B5"] = "2 WB digital PSC-7803"
    summary["A7"], summary["B7"] = "Kelompok kebutuhan", "Estimasi (Rp)"
    for cell in summary[7]:
        cell.fill = PatternFill("solid", fgColor="A13E34")
        cell.font = Font(name="Noto Sans", size=10, bold=True, color="FFFFFF")
    for row, group in enumerate(snapshot["groups"], 8):
        summary.cell(row, 1, group["title"])
        summary.cell(row, 2, group["total"])
    summary["A13"], summary["B13"] = "TOTAL ESTIMASI BoM", snapshot["grand_total"]
    for cell in summary[13]:
        cell.fill = PatternFill("solid", fgColor="F7E9E7")
        cell.font = Font(name="Noto Sans", size=10, bold=True, color="302F31")
    for row in range(8, 14):
        summary.cell(row, 2).number_format = '#,##0'
        summary.cell(row, 2).alignment = Alignment(horizontal="right")
    notes = [
        "Nilai ini adalah estimasi perangkat dan material, belum merupakan keseluruhan anggaran proyek.",
        "Belum termasuk pengerjaan civil/pondasi, pulling cable dan network termination.",
        "Pengembangan aplikasi, AWS/HO, persiapan pengguna dan dukungan operasional belum dirinci sebagai pos tersendiri; pajak dan biaya pengadaan lain perlu dikonfirmasi.",
        "Lokasi pilot masih diusulkan. Kuantitas dan catatan alokasi barrier gate, RFID pole serta controller perlu divalidasi terhadap layout sebelum pengadaan.",
        "Sheet rincian memuat 49 item Karawang dengan nilai tersimpan dan format dari workbook pengguna; formula sumber disajikan sebagai nilai snapshot.",
        "Workbook sumber: " + snapshot["source_file"],
    ]
    for row, text in enumerate(notes, 16):
        summary.merge_cells(start_row=row, start_column=1, end_row=row, end_column=2)
        cell = summary.cell(row, 1, text)
        cell.font = Font(name="Noto Sans", size=10, color="302F31")
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        summary.row_dimensions[row].height = 43 if row in (18, 19, 20) else 31
    for row in summary:
        for cell in row:
            if not cell.has_style:
                cell.font = Font(name="Noto Sans", size=10, color="302F31")
    summary.print_area = "A1:B21"
    summary.sheet_properties.pageSetUpPr.fitToPage = True
    summary.page_setup.orientation = "portrait"
    summary.page_setup.paperSize = summary.PAPERSIZE_A4
    summary.page_setup.fitToWidth = 1
    summary.page_setup.fitToHeight = 1
    workbook.active = 0
    workbook.properties.title = "BoM Priscolin Karawang — AWB Downstream"
    workbook.properties.description = "Snapshot Karawang untuk lampiran terpisah BRD; workbook sumber tidak diubah."
    output = ROOT / "supporting/BoM-Priscolin-Karawang.xlsx"
    workbook.save(output)
    return output


def extract(path):
    values = load_workbook(path, data_only=True)
    formulas = load_workbook(path, data_only=False)
    ws, wf = values[SHEET], formulas[SHEET]
    groups = []
    for key, title, first, last, total_row in GROUPS:
        items = []
        for row in range(first, last + 1):
            qty = Decimal(str(ws[f"D{row}"].value))
            price = Decimal(str(ws[f"G{row}"].value))
            total = Decimal(str(ws[f"H{row}"].value))
            assert qty * price == total, f"Line calculation mismatch at row {row}"
            items.append({
                "row": row, "source_number": ws[f"A{row}"].value,
                "material_code": str(ws[f"B{row}"].value).strip(),
                "description": str(ws[f"C{row}"].value).strip(),
                "display_name": SHORT_NAMES[row], "quantity": int(qty),
                "unit_price": int(price), "total": int(total),
                "vendor_note": ws[f"F{row}"].value,
                "purpose": ws[f"E{row}"].value,
                "allocation_note": ws[f"I{row}"].value,
                "quantity_formula": wf[f"D{row}"].value if wf[f"D{row}"].data_type == "f" else None,
                "cost_formula": wf[f"H{row}"].value,
            })
        calculated = sum(i["total"] for i in items)
        assert calculated == ws[f"H{total_row}"].value, f"Group mismatch: {title}"
        groups.append({"key": key, "title": title, "items": items,
                       "total": calculated, "subtotal_cell": f"H{total_row}"})
    grand_total = sum(g["total"] for g in groups)
    assert grand_total == ws["H65"].value == values["Summary"]["E5"].value
    assert values["Summary"]["B5"].value == "Priscolin Karawang"
    issues = [
        {"item_row": 3, "item": SHORT_NAMES[3], "order_quantity": ws["D3"].value,
         "allocation_note": ws["I3"].value,
         "observation": "Total Order 5; catatan alokasi menyebut 6 unit WB + 1 unit TCS."},
        {"item_row": 7, "item": SHORT_NAMES[7], "order_quantity": ws["D7"].value,
         "allocation_note": ws["I7"].value,
         "observation": "Total Order 8; catatan alokasi menyebut angka 6 untuk WB, 2 untuk TCS, dan 4 sampling/unloading."},
        {"item_row": 10, "item": SHORT_NAMES[10], "order_quantity": ws["D10"].value,
         "allocation_note": ws["I10"].value,
         "observation": "Total Order 7; catatan alokasi menyebut 7 untuk BG + 2 sampling/unloading."},
    ]
    snapshot = {
        "plant": "Priscolin Karawang", "pilot_status": "proposed, final location pending",
        "weighbridges": values["Summary"]["C5"].value,
        "indicator": values["Summary"]["D5"].value,
        "currency": "IDR", "source_file": path.name, "source_sheet": SHEET,
        "source_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "groups": groups, "grand_total": grand_total,
        "source_explicit_exclusions": values["Summary"]["A15"].value,
        "allocation_issues": issues,
        "checks": {"line_products_match": True, "group_totals_match": True,
                   "sheet_total_matches": True, "summary_total_matches": True,
                   "line_items": sum(len(g["items"]) for g in groups)},
    }
    (ROOT / "source/karawang-bom.json").write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "supporting/karawang-bom-validation.json").write_text(
        json.dumps({k: snapshot[k] for k in
                    ("source_file", "source_sheet", "source_sha256", "checks",
                     "source_explicit_exclusions", "allocation_issues", "grand_total")},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    with (ROOT / "supporting/karawang-bom.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["group", "source_row", "material_code", "description",
                         "quantity", "unit_price_idr", "line_total_idr", "allocation_note"])
        for group in groups:
            for i in group["items"]:
                writer.writerow([group["title"], i["row"], i["material_code"],
                                 i["description"], i["quantity"], i["unit_price"],
                                 i["total"], i["allocation_note"]])
    write_attachment(values, snapshot)
    print(json.dumps({"plant": snapshot["plant"], "weighbridges": snapshot["weighbridges"],
                      "group_totals": {g["title"]: g["total"] for g in groups},
                      "total": grand_total, "checks": snapshot["checks"],
                      "allocation_issues": len(issues)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    extract(parser.parse_args().workbook)
