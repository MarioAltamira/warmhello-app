"""
Simpler PDF builder using Reportlab Platypus DIRECTLY (no html2pdf middleman).

Markdown parser -> Paragraphs/Tables/Preformatted (no xhtml2pdf).
Avoids css parse errors entirely.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    NextPageTemplate,
    HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import ImageReader

ROOT = os.path.dirname(os.path.abspath(__file__))
DOC_DIR = ROOT
OUTPUT = os.path.join(DOC_DIR, "Warm-Hello-IT-Operations-Documentation.pdf")

CHAPTER_FILES = [
    ("1", "Architecture & Infrastructure Map", os.path.join(DOC_DIR, "01-architecture-and-infrastructure.md")),
    ("2", "Deployment & CI/CD Pipeline", os.path.join(DOC_DIR, "02-deployment-and-cicd.md")),
    ("3", "Configuration & Environment Variables", os.path.join(DOC_DIR, "03-configuration-and-environment-variables.md")),
    ("4", "Database & Data Operations", os.path.join(DOC_DIR, "04-database-and-data-operations.md")),
    ("5", "Monitoring, Logging & Observability", os.path.join(DOC_DIR, "05-monitoring-logging-and-observability.md")),
    ("6", "Security, Access & Compliance", os.path.join(DOC_DIR, "06-security-access-and-compliance.md")),
    ("7", "Troubleshooting Runbooks", os.path.join(DOC_DIR, "07-troubleshooting-runbooks.md")),
    ("8", "Emergency Contacts & Escalation", os.path.join(DOC_DIR, "emergency-contacts.md")),
]

NAVY = colors.HexColor("#0b3d91")
NAVY_LIGHT = colors.HexColor("#1955a5")
GOLD = colors.HexColor("#d9a441")
LIGHT = colors.HexColor("#f5f7fa")
GRAY = colors.HexColor("#555555")
DARK = colors.HexColor("#1a1a1a")
NOTE_BG = colors.HexColor("#fff7e6")
NOTE_BORDER = colors.HexColor("#d9a441")
ROW_ALT = colors.HexColor("#f6f8fa")
BORDER = colors.HexColor("#d0d7de")


def utcnow_str(fmt: str) -> str:
    return datetime.now(timezone.utc).strftime(fmt)


# -------- Styles --------
def build_styles():
    sheet = getSampleStyleSheet()
    s = {}

    # Cover
    s["CoverTitle"] = ParagraphStyle(
        name="CoverTitle", parent=sheet["Title"],
        fontName="Helvetica-Bold", fontSize=40, leading=48, alignment=TA_CENTER,
        textColor=NAVY, spaceAfter=10,
    )
    s["CoverSubtitle"] = ParagraphStyle(
        name="CoverSubtitle", parent=sheet["Normal"],
        fontName="Helvetica", fontSize=20, leading=26, alignment=TA_CENTER,
        textColor=colors.HexColor("#2c3e50"), spaceAfter=12,
    )
    s["CoverSub2"] = ParagraphStyle(
        name="CoverSub2", parent=sheet["Normal"],
        fontName="Helvetica", fontSize=12, leading=16, alignment=TA_CENTER,
        textColor=colors.HexColor("#34495e"), spaceAfter=20,
    )
    s["CoverMeta"] = ParagraphStyle(
        name="CoverMeta", parent=sheet["Normal"],
        fontName="Helvetica", fontSize=11.5, leading=18, alignment=TA_CENTER,
        textColor=GRAY, spaceAfter=6,
    )

    # ToC
    s["ToCTitle"] = ParagraphStyle(
        name="ToCTitle", parent=sheet["Heading1"],
        fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=NAVY,
        spaceBefore=18, spaceAfter=14,
    )
    s["ToCLi"] = ParagraphStyle(
        name="ToCLi", parent=sheet["Normal"],
        fontName="Helvetica", fontSize=11, leading=16,
        leftIndent=0, spaceBefore=4, spaceAfter=0,
    )
    s["ToCSub"] = ParagraphStyle(
        name="ToCSub", parent=sheet["Normal"],
        fontName="Helvetica", fontSize=9.5, leading=12,
        leftIndent=56, spaceBefore=0, spaceAfter=1,
        textColor=colors.HexColor("#34495e"),
    )

    # Headings
    s["H1"] = ParagraphStyle(
        name="H1", parent=sheet["Heading1"],
        fontName="Helvetica-Bold", fontSize=20, leading=24,
        textColor=NAVY, spaceBefore=6, spaceAfter=10,
        borderPadding=(0, 0, 4, 0),
    )
    s["H2"] = ParagraphStyle(
        name="H2", parent=sheet["Heading2"],
        fontName="Helvetica-Bold", fontSize=14.5, leading=18,
        textColor=NAVY_LIGHT, spaceBefore=16, spaceAfter=7,
    )
    s["H3"] = ParagraphStyle(
        name="H3", parent=sheet["Heading3"],
        fontName="Helvetica-Bold", fontSize=12, leading=16,
        textColor=colors.HexColor("#2c3e50"),
        spaceBefore=11, spaceAfter=5,
    )
    s["H4"] = ParagraphStyle(
        name="H4", parent=sheet["Heading4"],
        fontName="Helvetica-BoldOblique", fontSize=10.5, leading=14,
        textColor=colors.HexColor("#34495e"),
        spaceBefore=9, spaceAfter=4,
    )

    # Body
    s["Body"] = ParagraphStyle(
        name="Body", parent=sheet["BodyText"],
        fontName="Helvetica", fontSize=10.5, leading=14.5,
        alignment=TA_JUSTIFY, textColor=DARK, spaceAfter=6,
    )
    s["BodyLeft"] = ParagraphStyle(
        name="BodyLeft", parent=s["Body"],
        alignment=TA_LEFT,
    )
    s["Bullet"] = ParagraphStyle(
        name="Bullet", parent=s["Body"],
        alignment=TA_LEFT,
        leftIndent=20, firstLineIndent=-10,
        bulletIndent=6, spaceAfter=2,
    )

    # Code
    s["CodeBlock"] = ParagraphStyle(
        name="CodeBlock", parent=sheet["Code"],
        fontName="Courier", fontSize=8.5, leading=11,
        backColor=LIGHT, borderColor=BORDER, borderWidth=0.5, borderPadding=6,
        leftIndent=6, rightIndent=6,
        spaceBefore=4, spaceAfter=8, textColor=DARK,
    )

    # Note blockquote
    s["Note"] = ParagraphStyle(
        name="Note", parent=s["Body"],
        fontName="Helvetica-Oblique", fontSize=10, leading=13.5,
        textColor=colors.HexColor("#5b3a00"),
        leftIndent=12, rightIndent=12,
        borderPadding=8, backColor=NOTE_BG,
        borderColor=NOTE_BORDER, borderWidth=0.8,
        spaceBefore=6, spaceAfter=8, alignment=TA_LEFT,
    )

    # Table cells
    s["TableHeader"] = ParagraphStyle(
        name="TableHeader", parent=s["Body"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        alignment=TA_LEFT, textColor=colors.white,
        spaceAfter=0,
    )
    s["TableBody"] = ParagraphStyle(
        name="TableBody", parent=s["Body"],
        fontName="Helvetica", fontSize=9, leading=12,
        alignment=TA_LEFT, spaceAfter=0,
    )
    return s


STYLES = build_styles()


# -------- Inline MD -> Reportlab para markup --------
def inline(md_text: str) -> str:
    """Convert inline MD (bold, italic, inline code, links) to reportlab <para> markup.

    Order matters:
      1. XML escape
      2. Inline code first (protect backtick content BEFORE bold/italic can eat asterisks inside)
      3. Bold **..** / __..__
      4. Italic *..* / _.._ (we simplify: treat standalone * / _ inside words as italic ONLY
         if the marker is a space-paired stand-alone asterisk; this avoids eating multi-asterisk.)
      5. Links [text](url)
    """
    # 1. Escape XML
    t = md_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # 2. Inline code — replace backticks with PLACEHOLDER_CODE_TOKEN_<i> to protect from
    #    subsequent bold/italic regexes that might touch *, _, etc. inside code.
    placeholders: list[str] = []

    def _code_save(m):
        inner = m.group(1)
        idx = len(placeholders)
        rendered = (
            f'<font name="Courier" size="9.5" color="#0b3d91">'
            f"{inner}</font>"
        )
        placeholders.append(rendered)
        return f"\x00CODE{idx}\x00"

    t = re.sub(r"`([^`]+)`", _code_save, t)

    # 3. Bold
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"__(.+?)__", r"<b>\1</b>", t)

    # 4. Italic: only outside of words (match bounded by whitespace/punctuation)
    #    Use pattern: (?<![A-Za-z0-9])\*...\*(?![A-Za-z0-9])
    def apply_italic(src, marker):
        marker_esc = re.escape(marker)
        pat = re.compile(
            rf"(?<![A-Za-z0-9]){marker_esc}(?!\s)(.+?)(?<!\s){marker_esc}(?![A-Za-z0-9])"
        )
        return pat.sub(lambda m: "<i>" + m.group(1) + "</i>", src)

    t = apply_italic(t, "*")
    t = apply_italic(t, "_")

    # 5. Links [text](url)
    def link_sub(m):
        txt = m.group(1)
        url = m.group(2)
        return f'<link href="{url}" color="#0b3d91"><u>{txt}</u></link>'

    t = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", link_sub, t)

    # Restore code placeholders
    def _restore_code(m):
        idx = int(m.group(1))
        return placeholders[idx]

    t = re.sub(r"\x00CODE(\d+)\x00", _restore_code, t)

    return t


# -------- MD -> Flowables parser --------
def h_level(line: str):
    m = re.match(r"^(#{1,6})\s+(.*)$", line)
    if not m:
        return None
    return len(m.group(1)), m.group(2).strip()


def table_row_cells(line: str) -> list[str]:
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def is_table_sep(line: str) -> bool:
    s = line.strip()
    if not s.startswith("|") or not s.endswith("|"):
        return False
    cells = table_row_cells(s)
    if not cells:
        return False
    return all(re.fullmatch(r":?-+:?", c.strip()) for c in cells)


def md_to_flowables(md_text: str, s=STYLES):
    lines = md_text.splitlines()
    result: list = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # Headings
        h = h_level(line)
        if h is not None:
            lvl, txt = h
            if lvl == 1:
                p = Paragraph(inline(txt), s["H1"])
                # Add gold underline via table cell trick: wrap in Paragraph (no built-in border bottom for Paragraph keep text +
                # We can't easily underline whole width here; apply gold underline via
                # Table with a bottom-border. Simpler: add a narrow gold Table of width=100% under the H1.
                result.append(p)
                underline = Table(
                    [[""]],
                    colWidths=[7.14 * inch], rowHeights=[2.5],
                )
                underline.setStyle(TableStyle([
                    ("LINEBELOW", (0, 0), (-1, -1), 2, GOLD),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]))
                result.append(underline)
                result.append(Spacer(1, 6))
            elif lvl == 2:
                result.append(Paragraph(inline(txt), s["H2"]))
            elif lvl == 3:
                result.append(Paragraph(inline(txt), s["H3"]))
            else:
                result.append(Paragraph(inline(txt), s["H4"]))
            i += 1
            continue

        # Fenced code block ```
        if line.lstrip().startswith("```"):
            buf = []
            i += 1
            while i < n and not lines[i].lstrip().startswith("```"):
                buf.append(lines[i])
                i += 1
            if i < n:
                i += 1  # close fence
            text = "\n".join(buf)
            esc = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            result.append(Preformatted(esc, s["CodeBlock"]))
            continue

        # GFM table
        if "|" in line and (i + 1) < n and is_table_sep(lines[i + 1]):
            header = table_row_cells(line)
            i += 2
            rows = []
            while i < n and lines[i].strip() and "|" in lines[i]:
                rows.append(table_row_cells(lines[i]))
                i += 1
            header_para = [Paragraph(inline(c), s["TableHeader"]) for c in header]
            body_para = [
                [Paragraph(inline(c), s["TableBody"]) for c in row]
                for row in rows
            ]
            data = [header_para] + body_para
            total_w = 7.14 * inch
            cols = len(header)
            # Compute weights
            max_chars = [max(6, len(h)) for h in header]
            for row in rows:
                for idx, cell in enumerate(row):
                    if idx >= len(max_chars):
                        continue
                    max_chars[idx] = max(max_chars[idx], min(140, len(cell)))
            tot_chars = sum(max_chars) + 0.001
            col_widths = [(w / tot_chars) * total_w for w in max_chars]
            t = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
            style_cmds = [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
            # Row alternating backgrounds
            for r in range(1, len(data)):
                if r % 2 == 1:
                    style_cmds.append(("BACKGROUND", (0, r), (-1, r), ROW_ALT))
            t.setStyle(TableStyle(style_cmds))
            result.append(t)
            result.append(Spacer(1, 6))
            continue

        # Blockquote
        if line.startswith("> "):
            buf = []
            while i < n and lines[i].startswith("> "):
                buf.append(lines[i][2:])
                i += 1
            text = " ".join(b.strip() for b in buf if b.strip())
            if text:
                result.append(Paragraph(inline(text), s["Note"]))
            continue

        # Unordered list: lines starting with - or * or +
        if re.match(r"^\s*[-*+]\s+", line):
            items = []
            while i < n and re.match(r"^\s*[-*+]\s+", lines[i]):
                body = re.sub(r"^\s*[-*+]\s+", "", lines[i])
                while (i + 1) < n and lines[i + 1].startswith("   ") and not re.match(r"^\s*[-*+]\s+", lines[i + 1]):
                    i += 1
                    body += " " + lines[i].strip()
                items.append(body)
                i += 1
            for body in items:
                result.append(Paragraph(f"• {inline(body)}", s["Bullet"]))
            continue

        # Ordered list: 1. lines
        if re.match(r"^\s*\d+\.\s+", line):
            start = 0
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                m = re.match(r"^\s*(\d+)\.\s+(.*)$", lines[i])
                num = int(m.group(1))
                body = m.group(2)
                while (i + 1) < n and lines[i + 1].startswith("   ") and not re.match(r"^\s*\d+\.\s+", lines[i + 1]):
                    i += 1
                    body += " " + lines[i].strip()
                result.append(Paragraph(f"{num}. {inline(body)}", s["Bullet"]))
                i += 1
            continue

        # Default: gather as body paragraph until blank / new block-start line
        buf = line.rstrip()
        while (i + 1) < n and lines[i + 1].strip():
            nxt = lines[i + 1]
            if (
                h_level(nxt) is not None
                or nxt.lstrip().startswith("```")
                or re.match(r"^\s*[-*+]\s+", nxt)
                or re.match(r"^\s*\d+\.\s+", nxt)
                or nxt.startswith("> ")
                or ("|" in nxt and (i + 2) < n and is_table_sep(lines[i + 2]))
            ):
                break
            buf += " " + nxt.strip()
            i += 1
        result.append(Paragraph(inline(buf), s["Body"]))
        i += 1
    return result


# -------- Page decorations --------
class GlobalState:
    current_chapter_num: str | int = ""
    current_chapter_title: str = ""


_state = GlobalState()


def _on_cover(canvas, doc):
    # Navy top band 1.6in
    w, h = LETTER
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 1.6 * inch, w, 1.6 * inch, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 1.7 * inch, w, 0.1 * inch, stroke=0, fill=1)
    # Navy bottom band
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, w, 0.9 * inch, stroke=0, fill=1)
    canvas.restoreState()


def _on_content(canvas, doc):
    w, h = LETTER
    canvas.saveState()
    # Header band: navy full width 0.38 in tall
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 0.42 * inch, w, 0.42 * inch, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(0.68 * inch, h - 0.28 * inch, "Warm-Hello — IT Operations Documentation")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 0.68 * inch, h - 0.28 * inch, "CONFIDENTIAL")

    # Footer band
    canvas.setFillColor(colors.HexColor("#f0f4f8"))
    canvas.rect(0, 0, w, 0.42 * inch, stroke=0, fill=1)
    canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.68 * inch, 0.17 * inch, f"Generated: {utcnow_str('%Y-%m-%d %H:%M UTC')}")
    ch = _state.current_chapter_title
    if ch:
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.setFillColor(NAVY)
        canvas.drawCentredString(w / 2.0, 0.17 * inch, f"Chapter {_state.current_chapter_num} — {ch}")
        canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 0.68 * inch, 0.17 * inch, f"Page {doc.page}")
    canvas.restoreState()


def _on_toc(canvas, doc):
    w, h = LETTER
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 0.42 * inch, w, 0.42 * inch, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(0.68 * inch, h - 0.28 * inch, "Warm-Hello — IT Operations Documentation")
    canvas.setFont("Helvetica", 8.5)
    canvas.drawRightString(w - 0.68 * inch, h - 0.28 * inch, "Table of Contents")
    canvas.setFillColor(colors.HexColor("#f0f4f8"))
    canvas.rect(0, 0, w, 0.42 * inch, stroke=0, fill=1)
    canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.68 * inch, 0.17 * inch, f"Generated: {utcnow_str('%Y-%m-%d %H:%M UTC')}")
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(NAVY)
    canvas.drawCentredString(w / 2.0, 0.17 * inch, "Table of Contents")
    canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 0.68 * inch, 0.17 * inch, f"Page {doc.page}")
    canvas.restoreState()


# Small "marker" flowable that sets global state before chapter renders
class ChapterMarker:
    def __init__(self, num: str | int, title: str):
        self.num = num
        self.title = title

    # Minimum flowable API reportlab requires before handling by doctemplate
    def getKeepWithNext(self):
        return 0

    def setKeepWithNext(self, v):
        pass

    def getSpaceAfter(self):
        return 0

    def getSpaceBefore(self):
        return 0

    def getWidth(self):
        return 0

    def getHeight(self):
        return 0

    def wrap(self, availWidth, availHeight):
        _state.current_chapter_num = self.num
        _state.current_chapter_title = self.title
        return (0, 0)

    def draw(self):
        pass

    def drawOn(self, canvas, x, y, _sW=0):
        self.draw()

    def split(self, availWidth, availHeight):
        return []

    def identity(self, maxLen=None):
        return f"<ChapterMarker num={self.num} title={self.title[:30]}>"


# -------- Orchestrator --------
def build():
    os.makedirs(DOC_DIR, exist_ok=True)

    s = STYLES
    story: list = []

    # Cover page
    story.append(NextPageTemplate("Cover"))
    story.append(Spacer(1, 2.15 * inch))
    story.append(Paragraph("Warm-Hello", s["CoverTitle"]))
    story.append(Paragraph("IT Operations Documentation", s["CoverSubtitle"]))
    story.append(Paragraph(
        "Architecture &middot; Deployment &middot; Configuration &middot; "
        "Database &middot; Monitoring &middot; Security &middot; "
        "Troubleshooting &middot; Escalation",
        s["CoverSub2"],
    ))
    story.append(Spacer(1, 0.15 * inch))
    # Gold rule
    story.append(HRFlowable(width="55%", thickness=0.8, color=GOLD, spaceAfter=18, spaceBefore=18))
    today_display = utcnow_str("%A, %d %B %Y, %H:%M UTC")
    story.append(Paragraph("<b>Version:</b> Initial 1.0 release", s["CoverMeta"]))
    story.append(Paragraph(f"<b>Generated:</b> {today_display}", s["CoverMeta"]))
    story.append(Paragraph("<b>Classification:</b> Internal — Authorized personnel only", s["CoverMeta"]))
    story.append(PageBreak())

    # Table of contents
    story.append(NextPageTemplate("Toc"))
    story.append(Paragraph("Table of Contents", s["ToCTitle"]))
    toc_entries = []
    for ch_num, ch_title, path in CHAPTER_FILES:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        h2s = re.findall(r"^##\s+(.+)$", text, flags=re.MULTILINE)
        toc_entries.append((ch_num, ch_title, h2s))

    for ch_num, ch_title, h2s in toc_entries:
        num_html = f'<font name="Helvetica-Bold" size="14" color="#0b3d91">{ch_num}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font>'
        title_html = f'<font name="Helvetica-Bold" size="11">{inline(ch_title)}</font>'
        story.append(Paragraph(f"{num_html}{title_html}", s["ToCLi"]))
        for h2 in h2s:
            story.append(Paragraph(f"·&nbsp;&nbsp;{inline(h2)}", s["ToCSub"]))
        story.append(Spacer(1, 2))
    story.append(PageBreak())

    # Chapters
    story.append(NextPageTemplate("Content"))
    for ch_num, ch_title, path in CHAPTER_FILES:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
        # Replace first H1 with branded "Chapter N — Title"
        md_text = re.sub(r"^#\s+(.+)$", f"# Chapter&nbsp;{ch_num}&nbsp;—&nbsp;{ch_title}", raw, count=1, flags=re.MULTILINE)
        story.append(ChapterMarker(ch_num, ch_title))
        # Add gold "Chapter N — Title" header rule already inside md_to_flowables from the H1, so no extra markup needed
        story.extend(md_to_flowables(md_text, s))
    # Build
    left = right = 0.68 * inch
    top = 0.72 * inch
    bottom = 0.72 * inch
    frame_w = LETTER[0] - left - right
    frame_h = LETTER[1] - top - bottom
    content_frame = Frame(left, bottom, frame_w, frame_h, id="content",
                          leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    cover_frame = Frame(0, 0.9 * inch, LETTER[0], LETTER[1] - 1.7 * inch - 0.9 * inch, id="cover")
    toc_frame = Frame(left, bottom, frame_w, frame_h, id="toc")

    doc = BaseDocTemplate(
        OUTPUT,
        pagesize=LETTER,
        title="Warm-Hello — IT Operations Documentation",
        author="Warm-Hello Operations",
        subject="Operational handoff for Warm-Hello platform",
        creator="Warm-Hello Platypus Builder",
        leftMargin=left, rightMargin=right, topMargin=top, bottomMargin=bottom,
        keywords="Warm-Hello operations runbook devops handoff architecture deployment configuration database monitoring security troubleshooting escalation compliance",
    )
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=_on_cover),
        PageTemplate(id="Toc", frames=[toc_frame], onPage=_on_toc),
        PageTemplate(id="Content", frames=[content_frame], onPage=_on_content),
    ])
    doc.build(story)

    size = os.path.getsize(OUTPUT)
    print(f"[OK] PDF written to: {OUTPUT}")
    print(f"[OK] Size: {size/1024:.1f} KB ({size} bytes)")


if __name__ == "__main__":
    build()
