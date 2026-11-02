"""Render BLUEPRINT.md into the KPN-styled PDF in docs/documents/ (npm run blueprint:pdf).
Sections whose heading contains <!-- pdf:skip --> are left out."""

import hashlib
import json
import re
from datetime import date, datetime
from pathlib import Path

from reportlab.pdfbase.pdfmetrics import stringWidth

from common import ROOT, TOP
from build_documents import WIDTH, font_setup, render_pdf

REPO = TOP.parent
SOURCE = REPO / "BLUEPRINT.md"
DIAGRAMS = ROOT / "assets/diagrams"
BUILD_INFO = ROOT / "supporting/blueprint-build.json"
CODE = "KPN-AWB-DWS-BP-001"
MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
          "Agustus", "September", "Oktober", "November", "Desember"]


def inline(text):
    """Strip inline Markdown: the PDF renderer escapes all text."""
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text.replace("**", "").replace("`", "").strip()


def table_widths(headers, rows):
    """Column fractions: every column fits its longest word; spare width goes where text is longest."""
    padding = 16  # cell left + right padding (7 + 7 pt) plus slack

    def width(text, bold=False):
        return stringWidth(text, "KPNBold" if bold else "KPNBody", 8.35)

    minimum, wanted = [], []
    for i, header in enumerate(headers):
        cells = [row[i] for row in rows if i < len(row)]
        words = [(w, True) for w in header.split()] + [(w, False) for c in cells for w in c.split()]
        minimum.append(max([width(w, bold) for w, bold in words] or [0]) + padding)
        longest = max([width(header, True)] + [width(c) for c in cells])
        wanted.append(max(minimum[-1], min(longest + padding, WIDTH * 0.55)))
    if sum(minimum) >= WIDTH:
        sizes = minimum
    elif sum(wanted) <= WIDTH:
        spare = WIDTH - sum(wanted)
        sizes = [w + spare * w / sum(wanted) for w in wanted]
    else:
        growth = [w - m for w, m in zip(wanted, minimum)]
        spare = WIDTH - sum(minimum)
        sizes = [m + spare * g / sum(growth) for m, g in zip(minimum, growth)]
    return [s / sum(sizes) for s in sizes]


def section_for(heading):
    numbered = re.match(r"(\d+)\.\s+(.*)", heading)
    if numbered:
        return {"label": f"{int(numbered.group(1)):02d}", "title": numbered.group(2), "blocks": []}
    appendix = re.match(r"Lampiran ([A-Z])\.\s+(.*)", heading)
    if appendix:
        return {"label": f"Lampiran {appendix.group(1)}", "title": appendix.group(2), "blocks": [],
                "appendix": True}
    return {"title": heading, "blocks": []}


def parse(markdown):
    sections, current, paragraph = [], None, []

    def flush():
        if current is not None and paragraph:
            current["blocks"].append({"type": "paragraph", "text": inline(" ".join(paragraph))})
        paragraph.clear()

    lines = markdown.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if line.startswith("## "):
            flush()
            heading = line[3:]
            skip = "<!-- pdf:skip -->" in heading
            current = None if skip else section_for(re.sub(r"<!--.*?-->", "", heading).strip())
            if current is not None:
                sections.append(current)
            i += 1
            continue
        if current is None or line.startswith("# ") or (stripped.startswith("<!--") and stripped.endswith("-->")):
            i += 1
            continue
        if not stripped:
            flush()
        elif line.startswith("### "):
            flush()
            current["blocks"].append({"type": "subheading", "text": inline(line[4:])})
        elif stripped.startswith("|"):
            flush()
            table = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = lines[i].strip()
                if not re.match(r"^\|\s*:?-", row):
                    table.append([inline(c) for c in row[1:-1].split("|")])
                i += 1
            headers, rows = table[0], table[1:]
            current["blocks"].append({"type": "table", "headers": headers, "rows": rows,
                                      "widths": table_widths(headers, rows)})
            continue
        elif re.match(r"^(- |\d+\. )", stripped):
            flush()
            items = []
            while i < len(lines) and re.match(r"^(- |\d+\. )", lines[i].strip()):
                items.append(inline(re.sub(r"^(- |\d+\. )", "", lines[i].strip())))
                i += 1
            current["blocks"].append({"type": "bullets", "items": items})
            continue
        elif stripped.startswith(">"):
            flush()
            text = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                text.append(lines[i].strip().lstrip(">").strip())
                i += 1
            current["blocks"].append({"type": "note", "title": "Catatan", "text": inline(" ".join(text))})
            continue
        elif re.match(r"^!\[[^\]]*\]\([^)]+\)$", stripped):
            flush()
            caption, path = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped).groups()
            name = Path(path).stem
            if not (DIAGRAMS / f"{name}.png").exists():
                raise SystemExit(f"Gambar {path} tidak ditemukan di {DIAGRAMS.relative_to(REPO)}")
            current["blocks"].append({"type": "figure", "name": name, "caption": inline(caption),
                                      "height_mm": 125})
        else:
            paragraph.append(stripped)
        i += 1
    flush()

    # Main sections flow on; the first section and the first appendix start a new page.
    first_appendix = next((s for s in sections if s.get("appendix")), None)
    for index, section in enumerate(sections):
        section["page_break"] = index == 0 or section is first_appendix
    return sections


def latest_history_date(sections):
    dates = []
    for section in sections:
        if section["title"].startswith("Riwayat perubahan"):
            for block in section["blocks"]:
                if block["type"] == "table":
                    dates += [row[1] for row in block["rows"] if re.match(r"\d{4}-\d{2}-\d{2}$", row[1])]
    return date.fromisoformat(max(dates)) if dates else date.today()


def main():
    font_setup()  # registers the fonts that table_widths() measures with
    markdown = SOURCE.read_text(encoding="utf-8")
    sections = parse(markdown)
    as_of = latest_history_date(sections)
    version = as_of.strftime("%Y.%m.%d")
    shown = f"{as_of.day} {MONTHS[as_of.month - 1]} {as_of.year}"
    data = {
        "kind": "Blueprint", "title": "Blueprint Sistem", "subtitle": "Autonomous Weighbridge Downstream",
        "code": CODE, "version": version, "date": shown, "status": "DOKUMEN HIDUP",
        "purpose": "Ringkasan AWB-DWS untuk manajemen: komponen sistem, progres, keputusan penting, hal yang perlu "
                   "diputuskan dan riwayat perubahan sejak awal pengembangan.",
        "cover_overline": "AWB-DWS / BLUEPRINT SISTEM",
        "opening_title": "Blueprint Sistem\nAWB Downstream",
        "opening_subtitle": f"Kondisi per {shown}",
        "show_cover_controls": True,
        "cover_details": [
            ["Kode", CODE],
            ["Versi / tanggal", f"{version}  /  {shown}"],
            ["Sumber", "BLUEPRINT.md di repositori awb-dws"],
            ["Sifat dokumen", "Dokumen hidup: menunjukkan kondisi terkini; riwayat perubahan tidak pernah ditimpa"],
        ],
        "cover_note_title": "CARA MEMBACA STATUS",
        "cover_note": "Belum mulai: belum dikerjakan  ·  Persiapan: struktur dasar sudah disiapkan  ·  "
                      "Dikerjakan: sedang dibangun  ·  Selesai: sudah berfungsi dan diuji.",
        "show_toc": True,
        "toc_note": "Rincian teknis untuk tim pengembang ada di dokumen terpisah (TECHNICAL.md).",
        "header_label": "AWB-DWS / BLUEPRINT SISTEM",
        "footer_label": "KPN CORP  |  INTERNAL",
        "sections": sections,
    }
    result = render_pdf(data)
    output = TOP / result["path"]
    for old in output.parent.glob("Blueprint-AWB-DWS-v*.pdf"):
        if old != output:
            old.unlink()
    BUILD_INFO.write_text(json.dumps({
        "source": "BLUEPRINT.md",
        "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "pdf": str(output.relative_to(REPO)),
        "pages": result["pages"],
        "version": version,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✔ {output.relative_to(REPO)} ({result['pages']} halaman, kondisi per {shown})")


if __name__ == "__main__":
    main()
