"""Build the local AWB-DWS document package from one structured source.

Usage: python AWB-DWS/source/build_documents.py
Requires Graphviz and the fonts specified below (paths may be overridden).
"""

import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import re
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Mm, Pt, RGBColor
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader

from common import ROOT, TOP, PROJECT, SOURCES, DECISIONS, OPEN_ITEMS, BR, DATE, VERSION
from brd_content import BRD, OBJECTIVE_BY_BR
from prd_content import PRD
from requirements import FR, UAT
from diagrams import render_all

BRAND = "A13E34"
INK = "302F31"
GRAY = "6A625D"
LIGHT = "F7F5F2"
PALE = "F7E9E7"
FONT = "Noto Sans"
FONT_DIR = Path(os.environ.get("AWB_DOC_FONT_DIR", "/usr/share/fonts/google-noto"))
LOGO = ROOT / "assets/kpn-corp.png"
PAGE_W, PAGE_H = A4
WIDTH = PAGE_W - 36 * mm


def cover_rows(data):
    return data.get("cover_details", [
        ["Kode", data["code"]],
        ["Versi / tanggal", f'{data["version"]}  /  {data["date"]}'],
        ["Cakupan", "BEL  ·  JUL  ·  LSK  ·  LSM"],
        ["Arsitektur", "AWS / HO + satu database operasional per pabrik"],
    ])


def export_business_revision():
    """Update business wording without resetting editable UAT/menu registers."""
    csv_write("business-requirements.csv",
              ["br_id", "title", "business_need", "basis", "priority"], BR)
    trace_path = ROOT / "supporting/requirement-traceability.csv"
    prior = {}
    if trace_path.exists():
        with trace_path.open(encoding="utf-8-sig", newline="") as f:
            prior = {(r["br_id"], r["fr_id"]): r for r in csv.DictReader(f)}
    csv_write("requirement-traceability.csv",
              ["br_id", "business_requirement", "fr_id", "functional_requirement",
               "priority", "basis", "uat_ids", "validation_status"],
              [[br_id, next(b[1] for b in BR if b[0] == br_id), r["id"], r["title"],
                r["priority"], r["basis"],
                "; ".join(u["id"] for u in UAT if r["id"] in u["refs"]),
                prior.get((br_id, r["id"]), {}).get("validation_status", "Draft untuk review")]
               for r in FR for br_id in r["br"]])
    csv_write(f'business-objective-map-v{BRD["version"]}.csv',
              ["business_requirement_id", "title", "business_objective_id", "priority"],
              [[r[0], r[1], OBJECTIVE_BY_BR[r[0]], r[4]] for r in BR])
    csv_write("decision-register.csv",
              ["decision_id", "topic", "decision", "status", "basis"], DECISIONS)
    csv_write("open-decisions.csv",
              ["open_id", "topic", "owner", "needed_decision_or_evidence", "due_gate"], OPEN_ITEMS)
    source_rows = []
    for sid, title, location, use, primary in SOURCES:
        path = PROJECT / primary if primary else None
        digest = hashlib.sha256(path.read_bytes()).hexdigest() if path and path.is_file() else ""
        source_rows.append([sid, title, location, use, digest, BRD["date"]])
    csv_write("source-register.csv",
              ["source_id", "title", "location", "used_for", "primary_file_sha256", "review_date"],
              source_rows)
    (ROOT / "source/content-snapshot.json").write_text(
        json.dumps({"brd": BRD, "prd": PRD, "fr": FR, "uat": UAT},
                   ensure_ascii=False, indent=2), encoding="utf-8")


def read_register(name, key):
    path = ROOT / "supporting" / name
    if not path.exists():
        return {}
    with path.open(encoding="utf-8-sig", newline="") as f:
        return {r[key]: r for r in csv.DictReader(f)}


def export_product_registers():
    """Regenerate FR/UAT registers from the catalog without losing recorded UAT or parity work."""
    csv_write("functional-requirements.csv",
              ["fr_id", "title", "priority", "br_ids", "basis", "requirement", "acceptance_criteria"],
              [[r["id"], r["title"], r["priority"], "; ".join(r["br"]), r["basis"],
                r["description"], "\n".join(f"{i+1}. {c}" for i, c in enumerate(r["criteria"]))]
               for r in FR])
    prior_uat = read_register("uat-scenarios.csv", "uat_id")
    csv_write("uat-scenarios.csv",
              ["uat_id", "scenario", "priority", "fr_ids", "preconditions", "steps",
               "expected_result", "execution_status", "evidence", "actual_result"],
              [[u["id"], u["title"], u["priority"], "; ".join(u["refs"]), u["setup"],
                u["steps"], u["expected"],
                prior_uat.get(u["id"], {}).get("execution_status") or "Belum dijalankan",
                prior_uat.get(u["id"], {}).get("evidence", ""),
                prior_uat.get(u["id"], {}).get("actual_result", "")] for u in UAT])
    parity = read_register("wbnet-menu-parity.csv", "parity_id")
    if parity:
        ids = {g[0]: g[2] for g in PARITY_GROUPS}
        rows = list(parity.values())
        for row in rows:
            row["candidate_requirement_ids"] = ids.get(row["parity_id"], row["candidate_requirement_ids"])
        csv_write("wbnet-menu-parity.csv", list(rows[0].keys()), [list(r.values()) for r in rows])


def csv_write(name, headers, rows):
    with (ROOT / "supporting" / name).open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


PARITY_GROUPS = [
    ("PAR-01", "Master dan konfigurasi", "FR-038", "Master customer/vendor, kendaraan, supir, material dan perangkat: cakupan/nama asli perlu bukti."),
    ("PAR-02", "Referensi dokumen", "FR-001; FR-004; FR-037", "PO/SO/DO/STO/LN, adopsi dan status dokumen per transaksi perlu walkthrough."),
    ("PAR-03", "Registrasi IN", "FR-005; FR-006; FR-008; FR-045; FR-046; FR-047", "Data registrasi, gatepass, kartu, foto dan validasi awal."),
    ("PAR-04", "WB IN", "FR-011; FR-012; FR-016; FR-048; FR-049; FR-050", "Akuisisi berat pertama, parameter, dokumen dan error flow."),
    ("PAR-05", "WB OUT / perhitungan", "FR-017; FR-018", "Bruto/tara/netto, unit, pembulatan, toleransi/deduction dan deviasi."),
    ("PAR-06", "QC / hasil stasiun", "FR-020; FR-025; FR-026", "Fungsi pada WB.NET lama vs TCS perlu dipetakan agar tidak duplikatif."),
    ("PAR-07", "Loading / unloading", "FR-021; FR-022; FR-023; FR-024", "Lokasi, quantity, hasil, status dan korelasi dokumen."),
    ("PAR-08", "Reg OUT / tiket / reprint", "FR-027; FR-028; FR-029", "Output, syarat keluar, format tiket dan aturan salinan."),
    ("PAR-09", "Koreksi / cancel / approval", "FR-009; FR-018; FR-030", "Hak, status, nilai sebelum-sesudah dan aturan koreksi/posting balik."),
    ("PAR-10", "Dashboard / laporan / export", "FR-039; FR-043", "Nama laporan, kolom, filter, total, jadwal dan hak akses asli."),
    ("PAR-11", "Integrasi SAP / sinkronisasi", "FR-031; FR-032; FR-037", "Job background, staging, interface, referensi dan pemulihan error."),
    ("PAR-12", "User / role / audit", "FR-038; FR-043", "Menu administrasi, permission, log perubahan dan approval."),
    ("PAR-13", "Tolling / multi-DO", "D-02", "Ditunda secara eksplisit; screenshot boleh dicatat, implementasi baru tidak masuk fase ini."),
]


def export_registers():
    csv_write("decision-register.csv",
              ["decision_id", "topic", "decision", "status", "basis"], DECISIONS)
    csv_write("open-decisions.csv",
              ["open_id", "topic", "owner", "needed_decision_or_evidence", "due_gate"], OPEN_ITEMS)
    csv_write("business-requirements.csv",
              ["br_id", "title", "business_need", "basis", "priority"], BR)
    csv_write("requirement-traceability.csv",
              ["br_id", "business_requirement", "fr_id", "functional_requirement",
               "priority", "basis", "uat_ids", "validation_status"],
              [[br_id, next(b[1] for b in BR if b[0] == br_id), r["id"], r["title"],
                r["priority"], r["basis"],
                "; ".join(u["id"] for u in UAT if r["id"] in u["refs"]), "Draft untuk review"]
               for r in FR for br_id in r["br"]])
    candidate_groups = PARITY_GROUPS
    csv_write("wbnet-menu-parity.csv",
              ["parity_id", "candidate_group_not_verified_menu", "actual_legacy_menu_name",
               "legacy_role", "legacy_fields_rules_outputs", "evidence_file_or_walkthrough",
               "candidate_requirement_ids", "inventory_note", "scope",
               "status", "owner", "parity_uat_result", "approved_deviation"],
              [[r[0], r[1], "", "", "", "", r[2], r[3],
                "LATER" if r[0] == "PAR-13" else "Perlu inventarisasi",
                "Ditunda" if r[0] == "PAR-13" else "Menunggu screenshot / walkthrough",
                "Pemilik proses WB — TBD", "Belum dijalankan", ""]
               for r in candidate_groups])
    source_rows = []
    for sid, title, location, use, primary in SOURCES:
        digest = ""
        if primary and (PROJECT / primary).is_file():
            digest = hashlib.sha256((PROJECT / primary).read_bytes()).hexdigest()
        elif sid == "SRC-12":
            digest = hashlib.sha256((ROOT / "references/flow-BEL-user.png").read_bytes()).hexdigest()
        source_rows.append([sid, title, location, use, digest, DATE,
                            "Pembacaan statis / referensi; bukan verifikasi produksi"])
    csv_write("source-register.csv",
              ["source_id", "title", "location", "used_for", "primary_file_sha256",
               "review_date", "scope_note"], source_rows)
    (ROOT / "source" / "content-snapshot.json").write_text(
        json.dumps({"brd": BRD, "prd": PRD, "fr": FR, "uat": UAT}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def plain(value):
    # The installed Noto Sans face lacks arrows and comparison symbols.
    text = str(value)
    safe = "".join(
        f'<font name="KPNSymbol">{escape(c)}</font>' if c in "→↔≤≥" else escape(c)
        for c in text
    )
    return safe.replace("\n", "<br/>")


def font_setup():
    for style, filename in [
        ("Body", "NotoSans-Regular.ttf"),
        ("Bold", "NotoSans-Bold.ttf"),
        ("Italic", "NotoSans-Italic.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(f"KPN{style}", str(FONT_DIR / filename)))
    pdfmetrics.registerFontFamily(
        "KPNBody", normal="KPNBody", bold="KPNBold", italic="KPNItalic", boldItalic="KPNBold"
    )
    symbol_path = os.environ.get(
        "AWB_DOC_SYMBOL_FONT", "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf")
    pdfmetrics.registerFont(TTFont("KPNSymbol", symbol_path))


def pdf_styles():
    return {
        "body": ParagraphStyle("Body", fontName="KPNBody", fontSize=9.2, leading=13.2,
                               textColor=colors.HexColor("#" + INK), spaceAfter=6),
        "small": ParagraphStyle("Small", fontName="KPNBody", fontSize=8.0, leading=11.0,
                                textColor=colors.HexColor("#" + GRAY), spaceAfter=5),
        "chapter": ParagraphStyle("Chapter", fontName="KPNBold", fontSize=19, leading=25,
                                  textColor=colors.HexColor("#" + BRAND), spaceAfter=12, keepWithNext=True),
        "sub": ParagraphStyle("Sub", fontName="KPNBold", fontSize=11.3, leading=15.2,
                              textColor=colors.HexColor("#" + BRAND), spaceBefore=7,
                              spaceAfter=5, keepWithNext=True),
        "sub_table": ParagraphStyle("SubTable", fontName="KPNBold", fontSize=11.3, leading=15.2,
                                   textColor=colors.HexColor("#" + BRAND), spaceBefore=7,
                                   spaceAfter=5, keepWithNext=False),
        "req": ParagraphStyle("Requirement", fontName="KPNBold", fontSize=11, leading=15,
                              textColor=colors.HexColor("#" + INK), spaceBefore=9,
                              spaceAfter=4, keepWithNext=True),
        "cell": ParagraphStyle("Cell", fontName="KPNBody", fontSize=8.35, leading=11.6,
                               textColor=colors.HexColor("#" + INK)),
        "cell_num": ParagraphStyle("CellNum", fontName="KPNBody", fontSize=8.35, leading=11.6,
                                   alignment=TA_RIGHT, textColor=colors.HexColor("#" + INK)),
        "th": ParagraphStyle("TableHeader", fontName="KPNBold", fontSize=8.3, leading=11.5,
                             textColor=colors.white),
        "th_num": ParagraphStyle("TableHeaderNum", fontName="KPNBold", fontSize=8.3, leading=11.5,
                                 alignment=TA_RIGHT, textColor=colors.white),
        "metric": ParagraphStyle("Metric", fontName="KPNBold", fontSize=20, leading=27,
                                 textColor=colors.HexColor("#" + BRAND), spaceAfter=4),
        "caption": ParagraphStyle("Caption", fontName="KPNItalic", fontSize=8.0, leading=11,
                                  textColor=colors.HexColor("#" + GRAY), spaceAfter=10),
        "bullet": ParagraphStyle("Bullet", fontName="KPNBody", fontSize=9.2, leading=13.0,
                                 leftIndent=11, firstLineIndent=-9, spaceAfter=4,
                                 textColor=colors.HexColor("#" + INK)),
        "toc": ParagraphStyle("TOC1", fontName="KPNBody", fontSize=10, leading=16,
                              textColor=colors.HexColor("#" + INK), leftIndent=0,
                              firstLineIndent=0, spaceBefore=5, rightIndent=20),
        "overline": ParagraphStyle("Overline", fontName="KPNBold", fontSize=11.0, leading=16,
                                   textColor=colors.HexColor("#" + BRAND), spaceAfter=10),
        "cover_title": ParagraphStyle("CoverTitle", fontName="KPNBold", fontSize=31, leading=38,
                                      textColor=colors.HexColor("#" + INK), spaceAfter=14),
        "cover_sub": ParagraphStyle("CoverSub", fontName="KPNBody", fontSize=16, leading=22,
                                    textColor=colors.HexColor("#" + GRAY), spaceAfter=12),
    }


class KPNDoc(BaseDocTemplate):
    def __init__(self, path, data, styles):
        super().__init__(
            str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
            topMargin=25 * mm, bottomMargin=19 * mm,
            title=f'{data["kind"]} | AWB-DWS | v{data["version"]}',
            author="KPN CORP — AWB-DWS",
            subject=data["purpose"], lang="id-ID",
        )
        self.data = data
        self.styles = styles
        self.chapter_pages = {}
        self.addPageTemplates(PageTemplate(
            id="normal", frames=[Frame(
                self.leftMargin, self.bottomMargin, self.width, self.height,
                leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            )], onPage=self.draw_page,
        ))

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#" + BRAND))
        if doc.page == 1:
            canvas.setFillColor(colors.HexColor("#" + BRAND))
            canvas.rect(0, PAGE_H - 7 * mm, PAGE_W, 7 * mm, stroke=0, fill=1)
            canvas.rect(0, 0, 5 * mm, PAGE_H, stroke=0, fill=1)
        else:
            canvas.drawImage(str(LOGO), 18 * mm, PAGE_H - 18 * mm,
                             width=40 * mm, height=40 * mm * 3282 / 15748, mask="auto")
            canvas.setFont("KPNBody", 7.3)
            canvas.setFillColor(colors.HexColor("#" + GRAY))
            canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 15 * mm,
                                   self.data.get("header_label",
                                   f'{self.data["code"]}  |  v{self.data["version"]}'))
            canvas.setLineWidth(0.6)
            canvas.line(18 * mm, PAGE_H - 21 * mm, PAGE_W - 18 * mm, PAGE_H - 21 * mm)
        canvas.setStrokeColor(colors.HexColor("#DDD6D1"))
        canvas.setLineWidth(0.35)
        canvas.line(18 * mm, 15.5 * mm, PAGE_W - 18 * mm, 15.5 * mm)
        canvas.setFont("KPNBody", 7)
        canvas.setFillColor(colors.HexColor("#" + GRAY))
        canvas.drawString(18 * mm, 10.5 * mm, self.data.get("footer_label",
                          "KPN CORP  |  INTERNAL  |  DRAFT UNTUK REVIEW"))
        canvas.drawRightString(PAGE_W - 18 * mm, 10.5 * mm, f"{doc.page:02d}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, "_chapter_key"):
            text = flowable.getPlainText()
            key = flowable._chapter_key
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0, closed=False)
            self.notify("TOCEntry", (0, text, self.page, key))
            self.chapter_pages[key] = self.page


def pdf_table(headers, rows, widths, styles):
    widths = widths or [1 / len(headers)] * len(headers)
    numeric = {i for i, head in enumerate(headers) if "(Rp)" in head or head == "Qty"}
    data = [[Paragraph(plain(c), styles["th_num" if i in numeric else "th"])
             for i, c in enumerate(headers)]]
    data += [[Paragraph(plain(c), styles["cell_num" if i in numeric else "cell"])
              for i, c in enumerate(row)] for row in rows]
    t = Table(data, colWidths=[WIDTH * w for w in widths], repeatRows=1, hAlign="LEFT",
              splitByRow=1, splitInRow=0)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#" + BRAND)),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#" + LIGHT)]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#" + BRAND)),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, colors.HexColor("#E4DEDA")),
    ]))
    for index, row in enumerate(rows, 1):
        if str(row[0]).upper().startswith(("SUBTOTAL", "TOTAL ESTIMASI")):
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, index), (-1, index), colors.HexColor("#" + PALE)),
                ("LINEABOVE", (0, index), (-1, index), 0.5, colors.HexColor("#D9B5AF")),
            ]))
    return t


def pdf_metrics(items, styles):
    data = [[
        [Paragraph(plain(value), styles["metric"]), Paragraph(plain(label), styles["small"])]
        for value, label in items
    ]]
    t = Table(data, colWidths=[WIDTH / len(items)] * len(items), hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#" + PALE)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [t, Spacer(1, 10)]


def pdf_note(title, text, styles):
    inner = [
        Paragraph(plain(title), styles["sub"]),
        Paragraph(plain(text), styles["body"]),
    ]
    t = Table([[inner]], colWidths=[WIDTH], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#" + PALE)),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9B5AF")),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [t, Spacer(1, 9)]


def image_size(path, max_w, max_h):
    with PILImage.open(path) as im:
        width, height = im.size
    ratio = min(max_w / width, max_h / height)
    return width * ratio, height * ratio


def render_pdf(data):
    styles = pdf_styles()
    path = TOP / "documents" / f'{data["kind"]}-AWB-DWS-v{data["version"]}.pdf'
    doc = KPNDoc(path, data, styles)
    compact = data.get("compact_opening", False)
    story = [Spacer(1, (2 if compact else 13) * mm)]
    w, height = image_size(LOGO, (73 if compact else 108) * mm, 25 * mm)
    story += [Image(str(LOGO), width=w, height=height, hAlign="LEFT"),
              Spacer(1, (10 if compact else 19) * mm),
              Paragraph(plain(data.get("cover_overline",
                        "AWB-DWS / " + data.get("pilot_label", "USULAN PILOT"))), styles["overline"])]
    cover_title = plain(data.get("opening_title", data["title"])).replace(" Document", "<br/>Document")
    story += [Paragraph(cover_title, styles["cover_title"]),
              Paragraph(plain(data.get("opening_subtitle", data["subtitle"])),
                        styles["body"] if compact else styles["cover_sub"]),
              Paragraph(plain(data["purpose"]), styles["body"]),
              Spacer(1, (2 if compact else 12) * mm)]
    if data.get("show_cover_controls", True):
        story.append(pdf_table(["KONTROL DOKUMEN", "BASELINE"],
                               cover_rows(data), [0.32, 0.68], styles))
    elif data.get("cover_highlights"):
        story.append(pdf_table(["PILOT", "CAKUPAN"],
                               data["cover_highlights"], [0.32, 0.68], styles))
    if not compact:
        story += [Spacer(1, 10 * mm)]
        story += pdf_note(data.get("cover_note_title", "DRAFT UNTUK REVIEW"),
        data.get("cover_note", "Disusun dari keputusan proyek dan sumber lokal. "
                 "Menu WB.NET lama menunggu screenshot; rincian terbuka belum "
                 "merupakan persetujuan implementasi."), styles)
    if data.get("show_toc", True):
        story += [PageBreak(), Paragraph("Daftar isi", styles["chapter"])]
        toc = TableOfContents()
        toc.levelStyles = [styles["toc"]]
        toc.dotsMinLevel = 0
        story += [toc, Spacer(1, 10),
                  Paragraph(plain(data.get("toc_note",
                            "Nomor bab dan referensi BR/FR/UAT konsisten dengan register pendukung. "
                            "Status dokumen: draft untuk review.")), styles["small"])]
    for index, sec in enumerate(data["sections"], start=1):
        if (not compact or index > 1) and sec.get("page_break", True):
            story.append(PageBreak())
        elif index > 1:
            story += [CondPageBreak(115), Spacer(1, 10)]
        label = sec.get("label", f"{index:02d}")
        chapter = Paragraph(f'{label}  {plain(sec["title"])}', styles["chapter"])
        chapter._chapter_key = f'chapter-{index}'
        story.append(chapter)
        pending_figure_heading = None
        for block_index, block in enumerate(sec["blocks"]):
            kind = block["type"]
            if kind == "requirement" and block["id"] in {"FR-005", "FR-008", "FR-014", "FR-017"}:
                story.append(PageBreak())
            if kind == "paragraph":
                story.append(Paragraph(plain(block["text"]), styles["body"]))
            elif kind == "subheading":
                next_block = sec["blocks"][block_index + 1] if block_index + 1 < len(sec["blocks"]) else None
                if next_block and next_block["type"] == "figure":
                    pending_figure_heading = Paragraph(plain(block["text"]), styles["sub"])
                elif next_block and next_block["type"] == "table":
                    story.append(CondPageBreak(85))
                    story.append(Paragraph(plain(block["text"]), styles["sub_table"]))
                else:
                    story.append(Paragraph(plain(block["text"]), styles["sub"]))
            elif kind == "bullets":
                for item in block["items"]:
                    story.append(Paragraph("•  " + plain(item), styles["bullet"]))
                story.append(Spacer(1, 4))
            elif kind == "table":
                story += [pdf_table(block["headers"], block["rows"], block.get("widths"), styles),
                          Spacer(1, 10)]
            elif kind == "metrics":
                story += pdf_metrics(block["items"], styles)
            elif kind == "note":
                story += pdf_note(block["title"], block["text"], styles)
            elif kind == "figure":
                img_path = ROOT / "assets/diagrams" / f'{block["name"]}.png'
                w, height = image_size(img_path, WIDTH, block.get("height_mm", 145) * mm)
                figure_group = ([pending_figure_heading] if pending_figure_heading else []) + [
                    Image(str(img_path), width=w, height=height),
                    Spacer(1, 5),
                    Paragraph(plain(block["caption"]), styles["caption"]),
                ]
                story.append(KeepTogether(figure_group))
                pending_figure_heading = None
            elif kind == "requirement":
                heading = Paragraph(f'{block["id"]}  {plain(block["title"])}', styles["req"])
                meta = Paragraph(
                    plain(f'{block["priority"]}  |  {" / ".join(block["br"])}  |  Dasar: {block["basis"]}'),
                    styles["small"],
                )
                group = [heading, meta, Paragraph(plain(block["description"]), styles["body"])]
                for i, criterion in enumerate(block["criteria"], 1):
                    group.append(Paragraph(f'{i}.  {plain(criterion)}', styles["bullet"]))
                story.append(KeepTogether(group))
    doc.multiBuild(story)
    return {"path": str(path.relative_to(TOP)), "pages": len(PdfReader(path).pages),
            "chapter_pages": doc.chapter_pages}


def set_cell_background(cell, color):
    pr = cell._tc.get_or_add_tcPr()
    shade = OxmlElement("w:shd")
    shade.set(qn("w:fill"), color)
    pr.append(shade)


def docx_field(paragraph, instruction, cached=""):
    r = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    text = OxmlElement("w:instrText")
    text.set(qn("xml:space"), "preserve")
    text.text = instruction
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    value = OxmlElement("w:t")
    value.text = cached
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for el in (begin, text, separate, value, end):
        r._r.append(el)
    return r


def bookmark(paragraph, name, bookmark_id):
    begin = OxmlElement("w:bookmarkStart")
    begin.set(qn("w:id"), str(bookmark_id))
    begin.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(bookmark_id))
    paragraph._p.insert(0, begin)
    paragraph._p.append(end)


def toc_link(paragraph, name, label):
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("w:anchor"), name)
    run = OxmlElement("w:r")
    pr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), INK)
    pr.append(color)
    run.append(pr)
    value = OxmlElement("w:t")
    value.text = label
    run.append(value)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def set_table_no_split(row):
    trpr = row._tr.get_or_add_trPr()
    trpr.append(OxmlElement("w:cantSplit"))


def word_table(doc, headers, rows, widths=None):
    widths = widths or [1 / len(headers)] * len(headers)
    numeric = {i for i, head in enumerate(headers) if "(Rp)" in head or head == "Qty"}
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for i, width in enumerate(widths):
        t.columns[i].width = Mm(174 * width)
    for i, text in enumerate(headers):
        t.rows[0].cells[i].text = str(text)
        set_cell_background(t.rows[0].cells[i], BRAND)
    trpr = t.rows[0]._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    trpr.append(repeat)
    for row_index, row in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value)
            if row_index % 2:
                set_cell_background(cells[i], LIGHT)
    for ridx, row in enumerate(t.rows):
        set_table_no_split(row)
        for cidx, cell in enumerate(row.cells):
            cell.width = Mm(174 * widths[cidx])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            pr = cell._tc.get_or_add_tcPr()
            margins = OxmlElement("w:tcMar")
            for side, value in [("top", "85"), ("bottom", "85"), ("left", "90"), ("right", "90")]:
                item = OxmlElement(f"w:{side}")
                item.set(qn("w:w"), value)
                item.set(qn("w:type"), "dxa")
                margins.append(item)
            pr.append(margins)
            for paragraph in cell.paragraphs:
                if cidx in numeric:
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                paragraph.paragraph_format.space_after = Pt(2)
                paragraph.paragraph_format.line_spacing = 1.08
                for run in paragraph.runs:
                    run.font.name = FONT
                    run.font.size = Pt(8.5)
                    if ridx == 0:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor.from_string("FFFFFF")
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return t


def word_metrics(doc, items):
    t = doc.add_table(rows=1, cols=len(items))
    t.autofit = False
    for i, (value, label) in enumerate(items):
        cell = t.cell(0, i)
        cell.width = Mm(174 / len(items))
        set_cell_background(cell, PALE)
        para = cell.paragraphs[0]
        para.paragraph_format.space_before = Pt(7)
        para.paragraph_format.keep_with_next = True
        run = para.add_run(value)
        run.bold = True
        run.font.size = Pt(20)
        run.font.color.rgb = RGBColor.from_string(BRAND)
        para = cell.add_paragraph(label)
        for run in para.runs:
            run.font.size = Pt(8.5)
    set_table_no_split(t.rows[0])
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def word_note(doc, title, text):
    t = doc.add_table(rows=1, cols=1)
    t.autofit = False
    t.columns[0].width = Mm(174)
    cell = t.cell(0, 0)
    set_cell_background(cell, PALE)
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(title)
    run.bold = True
    run.font.color.rgb = RGBColor.from_string(BRAND)
    paragraph.paragraph_format.space_before = Pt(6)
    cell.add_paragraph(text)
    set_table_no_split(t.rows[0])
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def setup_docx(doc, data):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.top_margin, sec.bottom_margin = Mm(25), Mm(19)
    sec.left_margin = sec.right_margin = Mm(18)
    sec.header_distance = Mm(9)
    sec.footer_distance = Mm(8)
    sec.different_first_page_header_footer = True
    for sty in ("Normal", "Body Text", "List Bullet", "List Number"):
        style = doc.styles[sty]
        style.font.name = FONT
        style.font.size = Pt(9.5)
        style.font.color.rgb = RGBColor.from_string(INK)
        style.paragraph_format.line_spacing = 1.14
        style.paragraph_format.space_after = Pt(6)
        style.paragraph_format.widow_control = True
    for name, size in [("Heading 1", 19), ("Heading 2", 11.5), ("Heading 3", 11)]:
        style = doc.styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(BRAND)
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(9)
        style.paragraph_format.space_after = Pt(8)
    doc.styles["Caption"].font.name = FONT
    doc.styles["Caption"].font.size = Pt(8)
    doc.styles["Caption"].font.italic = True
    doc.styles["Caption"].font.color.rgb = RGBColor.from_string(GRAY)
    lang = OxmlElement("w:lang")
    lang.set(qn("w:val"), "id-ID")
    doc.styles["Normal"].element.get_or_add_rPr().append(lang)
    update = OxmlElement("w:updateFields")
    update.set(qn("w:val"), "true")
    doc.settings.element.append(update)
    doc.core_properties.title = f'{data["kind"]} | AWB-DWS | v{data["version"]}'
    doc.core_properties.subject = data["purpose"]
    doc.core_properties.author = "KPN CORP — AWB-DWS"
    doc.core_properties.keywords = "AWB-DWS, BRD, PRD, Downstream, KPN, Priscolin Karawang"
    header = sec.header.paragraphs[0]
    header.paragraph_format.tab_stops.add_tab_stop(Mm(90))
    header.add_run().add_picture(str(LOGO), width=Mm(37))
    run = header.add_run("\t" + data.get("header_label",
                        f'{data["code"]}  |  v{data["version"]}'))
    run.font.size = Pt(7)
    run.font.color.rgb = RGBColor.from_string(GRAY)
    for footer in (sec.footer, sec.first_page_footer):
        paragraph = footer.paragraphs[0]
        paragraph.paragraph_format.tab_stops.add_tab_stop(Mm(153))
        run = paragraph.add_run(data.get("footer_label",
                                "KPN CORP  |  INTERNAL  |  DRAFT UNTUK REVIEW") + "\t")
        run.font.size = Pt(7)
        run.font.color.rgb = RGBColor.from_string(GRAY)
        docx_field(paragraph, "PAGE", "1")


def word_contents(doc, data):
    doc.add_page_break()
    toc_heading = doc.add_paragraph("Daftar isi", "TOC Heading")
    for run in toc_heading.runs:
        run.font.name = FONT
        run.font.size = Pt(19)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string(BRAND)
    # Native TOC field with a readable, clickable cached result before Word updates it.
    start_paragraph = doc.add_paragraph()
    start_run = start_paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = ' TOC \\o "1-1" \\h \\z \\u '
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    for el in (begin, instruction, separate):
        start_run._r.append(el)
    for i, sec in enumerate(data["sections"], 1):
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.space_after = Pt(5)
        label = sec.get("label", f"{i:02d}")
        toc_link(paragraph, f"chapter_{i}", f'{label}  {sec["title"]}')
    end_paragraph = doc.add_paragraph()
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    end_paragraph.add_run()._r.append(end)
    paragraph = doc.add_paragraph("Daftar isi memakai tautan bab dan dapat diperbarui otomatis di Word. "
                                  "PDF menyediakan daftar isi dengan nomor halaman hasil cetak.")
    for run in paragraph.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor.from_string(GRAY)


def render_docx(data):
    doc = Document()
    setup_docx(doc, data)
    compact = data.get("compact_opening", False)
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(3 if compact else 27)
    paragraph.add_run().add_picture(str(LOGO), width=Mm(73 if compact else 108))
    paragraph = doc.add_paragraph(data.get("cover_overline",
                                  "AWB-DWS / " + data.get("pilot_label", "USULAN PILOT")))
    paragraph.paragraph_format.space_before = Pt(17 if compact else 40)
    paragraph.paragraph_format.space_after = Pt(10)
    for run in paragraph.runs:
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor.from_string(BRAND)
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(10 if compact else 13)
    run = paragraph.add_run(data.get("opening_title", data["title"]).replace(" Document", "\nDocument"))
    run.bold = True
    run.font.size = Pt(27 if compact else 29)
    paragraph = doc.add_paragraph(data.get("opening_subtitle", data["subtitle"]))
    for run in paragraph.runs:
        run.font.size = Pt(10 if compact else 16)
        run.font.color.rgb = RGBColor.from_string(GRAY)
    doc.add_paragraph(data["purpose"])
    if data.get("show_cover_controls", True):
        word_table(doc, ["KONTROL DOKUMEN", "BASELINE"], cover_rows(data), [0.32, 0.68])
    elif data.get("cover_highlights"):
        word_table(doc, ["PILOT", "CAKUPAN"], data["cover_highlights"], [0.32, 0.68])
    if not compact:
        word_note(doc, data.get("cover_note_title", "DRAFT UNTUK REVIEW"),
                  data.get("cover_note", "Disusun dari keputusan proyek dan sumber lokal. "
                           "Menu WB.NET lama menunggu screenshot; rincian terbuka belum "
                           "merupakan persetujuan implementasi."))
    if data.get("show_toc", True):
        word_contents(doc, data)
    for i, sec in enumerate(data["sections"], 1):
        if (not compact or i > 1) and sec.get("page_break", True):
            doc.add_page_break()
        label = sec.get("label", f"{i:02d}")
        paragraph = doc.add_heading(f'{label}  {sec["title"]}', 1)
        bookmark(paragraph, f"chapter_{i}", i)
        for block in sec["blocks"]:
            kind = block["type"]
            if kind == "requirement" and block["id"] in {"FR-005", "FR-008", "FR-014", "FR-017"}:
                doc.add_page_break()
            if kind == "paragraph":
                doc.add_paragraph(block["text"])
            elif kind == "subheading":
                doc.add_heading(block["text"], 2)
            elif kind == "bullets":
                for item in block["items"]:
                    doc.add_paragraph(item, "List Bullet")
            elif kind == "table":
                word_table(doc, block["headers"], block["rows"], block.get("widths"))
            elif kind == "metrics":
                word_metrics(doc, block["items"])
            elif kind == "note":
                word_note(doc, block["title"], block["text"])
            elif kind == "figure":
                path = ROOT / "assets/diagrams" / f'{block["name"]}.png'
                w, height = image_size(path, 174 * mm, block.get("height_mm", 145) * mm)
                paragraph = doc.add_paragraph()
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                paragraph.paragraph_format.keep_with_next = True
                paragraph.add_run().add_picture(str(path), width=Pt(w), height=Pt(height))
                doc.add_paragraph(block["caption"], "Caption")
            elif kind == "requirement":
                doc.add_heading(f'{block["id"]}  {block["title"]}', 2)
                paragraph = doc.add_paragraph(
                    f'{block["priority"]} | {" / ".join(block["br"])} | Dasar: {block["basis"]}')
                paragraph.paragraph_format.keep_with_next = True
                for run in paragraph.runs:
                    run.font.size = Pt(8)
                    run.font.color.rgb = RGBColor.from_string(GRAY)
                doc.add_paragraph(block["description"])
                doc.paragraphs[-1].paragraph_format.keep_with_next = True
                for number, criterion in enumerate(block["criteria"], 1):
                    paragraph = doc.add_paragraph(f"{number}. {criterion}")
                    paragraph.paragraph_format.left_indent = Mm(3.5)
                    paragraph.paragraph_format.first_line_indent = Mm(-3.5)
                    paragraph.paragraph_format.keep_with_next = number < len(block["criteria"])
    path = TOP / "documents" / f'{data["kind"]}-AWB-DWS-v{data["version"]}.docx'
    doc.save(path)
    return {"path": str(path.relative_to(TOP)), "chapters": len(data["sections"])}


def validate_links():
    fr_ids = {r["id"] for r in FR}
    br_ids = {r[0] for r in BR}
    assert len(fr_ids) == len(FR), "Duplicate FR"
    assert len(br_ids) == len(BR), "Duplicate BR"
    assert all(set(r["br"]) <= br_ids for r in FR), "Unknown BR reference"
    assert all(set(u["refs"]) <= fr_ids for u in UAT), "Unknown FR in UAT"
    covered = {ref for u in UAT for ref in u["refs"]}
    assert covered == fr_ids, f"FR missing UAT: {fr_ids - covered}"
    assert {ref for r in FR for ref in r["br"]} == br_ids, "Unmapped BR"
    return {"business_requirements": len(BR), "functional_requirements": len(FR),
            "uat_scenarios": len(UAT), "all_fr_have_uat": True, "all_br_have_fr": True}


def readme(results):
    text = f"""AWB-DWS — Autonomous Weighbridge / Downstream
BRD v{BRD["version"]} — {BRD["date"]}
PRD v{PRD["version"]} — {PRD["date"]}
Status: DRAFT UNTUK REVIEW

DOKUMEN UTAMA
  documents/BRD-AWB-DWS-v{BRD["version"]}.docx / .pdf
  documents/PRD-AWB-DWS-v{PRD["version"]}.docx / .pdf
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
  PRD v{PRD["version"]} diselaraskan dengan BRD v{PRD["brd_baseline"]}: Customer Pre-Registration
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
  project-files/supporting/business-objective-map-v{BRD["version"]}.csv
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

Pemeriksaan build: {results['coverage']['business_requirements']} BR,
{results['coverage']['functional_requirements']} FR dan
{results['coverage']['uat_scenarios']} skenario UAT tertaut.
"""
    (TOP / "README.txt").write_text(text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--document", choices=["BRD", "PRD", "all"], default="all")
    args = parser.parse_args()
    (TOP / "documents").mkdir(parents=True, exist_ok=True)
    for dirname in ("assets/diagrams", "supporting", "previews"):
        (ROOT / dirname).mkdir(parents=True, exist_ok=True)
    coverage = validate_links()
    documents = [d for d in (BRD, PRD)
                 if args.document == "all" or d["kind"] == args.document]
    if any(b["type"] == "figure" for d in documents
           for sec in d["sections"] for b in sec["blocks"]):
        render_all(ROOT / "assets/diagrams")
    if not (ROOT / "supporting/functional-requirements.csv").exists():
        export_registers()
    export_product_registers()
    export_business_revision()
    font_setup()
    report_path = ROOT / "supporting/build-report.json"
    previous = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    records = {r["kind"]: r for r in previous.get("documents", [])}
    for data in documents:
        records[data["kind"]] = {
            "kind": data["kind"], "version": data["version"],
            "pdf": render_pdf(data), "docx": render_docx(data),
        }
    results = {
        "versions": {"BRD": BRD["version"], "PRD": PRD["version"]},
        "date": BRD["date"], "status": "Draft untuk review", "coverage": coverage,
        "documents": [records[k] for k in ("BRD", "PRD") if k in records],
        "prd_alignment": {
            "status": f'PRD v{PRD["version"]} diselaraskan dengan BRD v{PRD["brd_baseline"]}',
            "aligned": [
                "Customer Pre-Registration opsional; registrasi tanpa layanan ini oleh supir atau petugas HO (FR-045 s.d. FR-047)",
                "Dua tap pada kiosk WB IN dan WB OUT (FR-048; FR-015 s.d. FR-017)",
                "AI posisi/perimeter/orang dan OCR pelat nomor (FR-019; FR-049; FR-050)",
                "Kesiapan fasilitas: posisi kiosk, jalur supir dan kamera AI/OCR (FR-041; NFR-15)",
            ],
            "still_open": [
                "O-12 field/dokumen dan pemeriksaan registrasi tanpa Customer Pre-Registration",
                "O-13 aturan hasil AI/OCR dan area deteksi",
            ],
            "coverage_note": "Jumlah BR/FR/UAT adalah pemeriksaan tautan, bukan bukti seluruh perubahan baru telah tercakup.",
        },
    }
    for record in results["documents"]:
        for form in ("pdf", "docx"):
            path = TOP / record[form]["path"]
            record[form]["bytes"] = path.stat().st_size
            record[form]["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    (ROOT / "supporting/build-report.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    readme(results)
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
