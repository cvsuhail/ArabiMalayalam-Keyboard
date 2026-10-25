#!/usr/bin/env python3
"""Builds the cvsuhail-* ARML fonts from open-licence Arabic fonts.

    scripts/fonts/.venv/bin/python scripts/fonts/build.py [--only cvsuhail-vahid] [--publish]

For every glyph in replica/arml/glyph-table.json the script shapes the Unicode
letter in its source font with HarfBuzz (so positional forms, dots and composed
letters come out exactly as the source font draws them), copies the outline to
the ARML code point, and writes a plain TrueType font whose only cmap entries
are the ARML byte values. Letters the source lacks come from the fallback fonts.
Marks are zero-advance glyphs attached with GPOS mark-to-base anchors.

Outputs go to scripts/fonts/out/ (ttf + woff2). With --publish the woff2 files,
a manifest and the licence texts are copied to public/fonts/arml/.
"""

from __future__ import annotations

import argparse
import io
import json
import shutil
import statistics
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path

import uharfbuzz as hb
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SOURCES = HERE / "sources"
OUT = HERE / "out"
TABLE = ROOT / "replica" / "arml" / "glyph-table.json"
PUBLIC = ROOT / "public" / "fonts" / "arml"

ZWJ = "‍"
REFERENCE_BASE = "ب"  # beh: marks are measured sitting on it
LITERALS = ' !"\'(),-./0123456789:;?'
MARK_FORMS = {"mark"}


@dataclass
class Source:
    """A source font loaded twice: for shaping (HarfBuzz) and for outlines (fontTools)."""

    name: str
    tt: TTFont
    hbfont: hb.Font
    upm: int

    @property
    def glyphset(self):
        return self.tt.getGlyphSet()


def load_source(path: Path, location: dict | None = None) -> Source:
    font = TTFont(path)
    if "fvar" in font:
        axes = {a.axisTag for a in font["fvar"].axes}
        pinned = {tag: value for tag, value in (location or {}).items() if tag in axes}
        font = instancer.instantiateVariableFont(font, pinned, inplace=False)
    buffer = io.BytesIO()
    font.save(buffer)
    data = buffer.getvalue()
    tt = TTFont(io.BytesIO(data))
    face = hb.Face(hb.Blob(data))
    return Source(path.name, tt, hb.Font(face), tt["head"].unitsPerEm)


@dataclass
class Entry:
    glyph: str
    pen_before: int
    x_offset: int
    y_offset: int
    x_advance: int
    cluster: int


def shape(source: Source, text: str) -> list[Entry]:
    buf = hb.Buffer()
    buf.add_str(text)
    buf.direction = "rtl"
    buf.script = "Arab"
    buf.language = "ar"
    hb.shape(source.hbfont, buf, {})
    entries: list[Entry] = []
    pen = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = source.tt.getGlyphName(info.codepoint)
        entries.append(Entry(name, pen, pos.x_offset, pos.y_offset, pos.x_advance, info.cluster))
        pen += pos.x_advance
    return entries


def is_missing(source: Source, entries: list[Entry]) -> bool:
    return not entries or any(e.glyph == ".notdef" for e in entries)


def draw(source: Source, entries: list[Entry], origin_pen: int, scale: float, dx=0.0, dy=0.0):
    """Compose entries into one TrueType glyph, translated by (dx, dy) font units."""
    pen = TTGlyphPen(None)
    cu = Cu2QuPen(pen, max_err=1.0, reverse_direction=False)
    glyphset = source.glyphset
    for e in entries:
        recording = DecomposingRecordingPen(glyphset)
        glyphset[e.glyph].draw(recording)
        x = (e.pen_before + e.x_offset - origin_pen) * scale + dx
        y = e.y_offset * scale + dy
        recording.replay(TransformPen(cu, (scale, 0, 0, scale, x, y)))
    return pen.glyph()


def glyph_bounds(glyph):
    if glyph.numberOfContours == 0:
        return None
    glyph.recalcBounds(None)
    return glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax


def context_for(form: str, letter: str) -> tuple[str, int]:
    """Text to shape and the index of the letter, so HarfBuzz picks the wanted positional form."""
    if form == "init":
        return letter + ZWJ, 0
    if form == "medi":
        return ZWJ + letter + ZWJ, 1
    if form == "fina":
        return ZWJ + letter, 1
    return letter, 0


class Builder:
    def __init__(self, config: dict, spec: dict, table: list[dict]):
        self.table = table
        self.upm = None
        self.primary = load_source(SOURCES / spec["source"], spec.get("location"))
        self.sources = [self.primary] + [
            load_source(SOURCES / f, {"wght": 400, "wdth": 100})
            for f in config["fallbacks"]
            if f != spec["source"]
        ]
        self.upm = self.primary.upm
        self.glyphs: dict = {}
        self.metrics: dict = {}
        self.cmap: dict = {}
        self.notes: list[str] = []
        self.bases: list[str] = []  # glyph names that take marks
        self.marks: dict[str, dict] = {}  # glyph name -> {"above": bool, "anchor": (x, y)}

    # -- letters, symbols, digits ------------------------------------------------

    def letter_glyph(self, unicode: str, form: str):
        text, index = context_for(form, unicode) if form in {"isol", "init", "medi", "fina"} else (unicode, 0)
        for source in self.sources:
            entries = shape(source, text)
            group = [e for e in entries if e.cluster == index]
            if is_missing(source, group):
                continue
            scale = self.upm / source.upm
            origin = min(e.pen_before for e in group)
            glyph = draw(source, group, origin, scale)
            advance = round(sum(e.x_advance for e in group) * scale)
            if source is not self.primary:
                self.notes.append(f"{unicode}.{form} borrowed from {source.name}")
            return glyph, advance
        self.notes.append(f"MISSING {unicode}.{form}")
        return TTGlyphPen(None).glyph(), round(self.upm * 0.4)

    # -- marks ---------------------------------------------------------------------

    def reference(self, source: Source):
        """Where the source draws its base letter, to measure marks against."""
        entries = shape(source, REFERENCE_BASE)
        scale = self.upm / source.upm
        glyph = draw(source, entries, min(e.pen_before for e in entries), scale)
        bounds = glyph_bounds(glyph)
        return entries[-1].glyph, bounds, scale

    def mark_glyph(self, unicode: str):
        for source in self.sources:
            base_name, ref_bounds, scale = self.reference(source)
            entries = shape(source, REFERENCE_BASE + unicode)
            base = next((e for e in entries if e.glyph == base_name), None)
            others = [e for e in entries if e is not base]
            if base is None or not others or any(e.glyph == ".notdef" for e in others):
                continue
            glyph = draw(source, others, base.pen_before, scale)
            bounds = glyph_bounds(glyph)
            if bounds is None:
                continue
            if source is not self.primary:
                self.notes.append(f"mark {unicode} borrowed from {source.name}")
            return glyph, bounds, ref_bounds
        self.notes.append(f"MISSING mark {unicode}")
        return None

    def build_marks(self):
        placed = []
        for g in self.table:
            if g["form"] not in MARK_FORMS:
                continue
            unicode = "".join(chr(int(c[2:], 16)) for c in g["unicode"])
            found = self.mark_glyph(unicode)
            if not found:
                self.glyphs[g["name"]] = TTGlyphPen(None).glyph()
                self.metrics[g["name"]] = 0
                continue
            glyph, (x0, y0, x1, y1), (_, ry0, _, ry1) = found
            centre = (x0 + x1) / 2
            glyph = self.shift(glyph, -centre, 0)
            above = (y0 + y1) / 2 > 0
            gap = (y0 - ry1) if above else (y1 - ry0)
            self.glyphs[g["name"]] = glyph
            self.metrics[g["name"]] = 0
            self.marks[g["name"]] = {
                "above": above,
                "anchor": (0, round(y0 if above else y1)),
                "gap": gap,
            }
            placed.append(g["name"])
        above_gaps = [m["gap"] for m in self.marks.values() if m["above"]]
        below_gaps = [m["gap"] for m in self.marks.values() if not m["above"]]
        self.gap_above = round(statistics.median(above_gaps)) if above_gaps else 0
        self.gap_below = round(statistics.median(below_gaps)) if below_gaps else 0

    @staticmethod
    def shift(glyph, dx, dy):
        pen = TTGlyphPen(None)
        # Replay the contours through a translation.
        from fontTools.pens.recordingPen import RecordingPen

        recording = RecordingPen()
        glyph.draw(recording, None)
        recording.replay(TransformPen(pen, (1, 0, 0, 1, dx, dy)))
        return pen.glyph()

    # -- assembly --------------------------------------------------------------------

    def build_literals(self):
        for char in LITERALS:
            name = f"uni{ord(char):04X}"
            for source in self.sources:
                entries = shape(source, char)
                if is_missing(source, entries):
                    continue
                scale = self.upm / source.upm
                origin = min(e.pen_before for e in entries)
                self.glyphs[name] = draw(source, entries, origin, scale)
                self.metrics[name] = round(sum(e.x_advance for e in entries) * scale)
                self.cmap[ord(char)] = name
                break

    def build(self):
        for g in self.table:
            if g["form"] in MARK_FORMS:
                continue
            unicode = "".join(chr(int(c[2:], 16)) for c in g["unicode"])
            glyph, advance = self.letter_glyph(unicode, g["form"])
            self.glyphs[g["name"]] = glyph
            self.metrics[g["name"]] = advance
            if g["form"] in {"isol", "init", "medi", "fina"}:
                self.bases.append(g["name"])
        self.build_marks()
        self.build_literals()
        for g in self.table:
            self.cmap[ord(self.char_for(g["code"]))] = g["name"]

    @staticmethod
    def char_for(code: int) -> str:
        return bytes([code]).decode("cp1252")

    def feature_text(self) -> str:
        """GPOS mark-to-base anchors and the GDEF classes that make renderers use them."""
        lines = []
        above = [n for n, m in self.marks.items() if m["above"]]
        below = [n for n, m in self.marks.items() if not m["above"]]
        for cls, names in (("ABOVE", above), ("BELOW", below)):
            for name in names:
                x, y = self.marks[name]["anchor"]
                lines.append(f"markClass {name} <anchor {x} {y}> @MARK_{cls};")
        lines.append("feature mark {")
        for cls, gap in (("ABOVE", self.gap_above), ("BELOW", self.gap_below)):
            if not (above if cls == "ABOVE" else below):
                continue
            lines.append(f"  lookup mark_{cls.lower()} {{")
            for name in self.bases:
                bounds = self.bounds.get(name)
                if bounds is None:
                    continue
                x0, y0, x1, y1 = bounds
                cx = round((x0 + x1) / 2)
                y = round(y1 + gap) if cls == "ABOVE" else round(y0 + gap)
                lines.append(f"    pos base {name} <anchor {cx} {y}> mark @MARK_{cls};")
            lines.append(f"  }} mark_{cls.lower()};")
        lines.append("} mark;")
        marks = " ".join(self.marks)
        bases = " ".join(self.bases)
        lines.append(
            f"table GDEF {{ GlyphClassDef [{bases}], , [{marks}], ; }} GDEF;"
        )
        return "\n".join(lines)

    def write(self, spec: dict, licences: dict):
        self.bounds = {}
        order = [".notdef"] + [g["name"] for g in self.table] + [
            n for n in self.glyphs if n.startswith("uni") and n not in {g["name"] for g in self.table}
        ]
        self.glyphs[".notdef"] = TTGlyphPen(None).glyph()
        self.metrics[".notdef"] = round(self.upm * 0.5)
        for name, glyph in self.glyphs.items():
            self.bounds[name] = glyph_bounds(glyph)

        fb = FontBuilder(self.upm, isTTF=True)
        fb.setupGlyphOrder(order)
        fb.setupCharacterMap(self.cmap)
        fb.setupGlyf({n: self.glyphs[n] for n in order})
        hmtx = {}
        for name in order:
            bounds = self.bounds.get(name)
            hmtx[name] = (self.metrics[name], bounds[0] if bounds else 0)
        fb.setupHorizontalMetrics(hmtx)
        hhea = self.primary.tt["hhea"]
        fb.setupHorizontalHeader(ascent=hhea.ascent, descent=hhea.descent, lineGap=hhea.lineGap)
        os2 = self.primary.tt["OS/2"]
        original = self.primary.tt["name"].getDebugName(0) or ""
        family = spec["id"]
        fb.setupNameTable(
            {
                "familyName": family,
                "styleName": "Regular",
                "uniqueFontIdentifier": f"{family};ARML-1.0",
                "fullName": family,
                "psName": family,
                "version": "Version 1.000; ARML 1.0",
                "copyright": f"{original} Derived by cvsuhail as an ARML legacy-encoded font.",
                "licenseDescription": licences["description"],
                "licenseInfoURL": "https://openfontlicense.org",
            }
        )
        fb.setupOS2(
            sTypoAscender=os2.sTypoAscender,
            sTypoDescender=os2.sTypoDescender,
            sTypoLineGap=os2.sTypoLineGap,
            usWinAscent=os2.usWinAscent,
            usWinDescent=os2.usWinDescent,
            fsType=0,
        )
        fb.setupPost()
        fb.addOpenTypeFeatures(self.feature_text())  # type: ignore[arg-type]
        OUT.mkdir(parents=True, exist_ok=True)
        ttf = OUT / f"{family}.ttf"
        fb.save(ttf)
        woff = TTFont(ttf)
        woff.flavor = "woff2"
        woff.save(OUT / f"{family}.woff2")
        return ttf


README = """{label} ({id}) - ARML font

{id} draws ARML text: the pre-shaped, visual-order legacy encoding for Arabi-Malayalam.
Type or convert text at https://arabi-malayalam.cvsuhail.online/ and use "Copy as ARML",
then paste it where this font is applied. The encoding is described in ARML-SPEC.md,
included in this archive.

Notes
- Latin letters share codes with ARML glyphs, so give Latin text a Latin font.
- Vowel marks use GPOS mark-to-base positioning. Programs that ignore it draw them off-centre.
- Keep one line per text box: lines are stored in drawing order and must not be re-wrapped.

Licence
This font is a modified version of {base}, renamed as the SIL Open Font License 1.1
requires. It is free to use, study, copy, modify and redistribute under that licence.
It must not be sold by itself. The licence text of the original font is in
{licence_file}. Please keep it with the font.
"""


def publish(built: list[dict]) -> None:
    """Copy web fonts, full TTFs, licence texts and download zips to public/fonts/arml/."""
    download = PUBLIC / "download"
    (PUBLIC / "licenses").mkdir(parents=True, exist_ok=True)
    download.mkdir(parents=True, exist_ok=True)
    manifest = []
    spec_text = (ROOT / "replica" / "arml" / "SPEC.md").read_text()
    shutil.copy(ROOT / "replica" / "arml" / "SPEC.md", PUBLIC / "ARML-SPEC.md")
    everything = zipfile.ZipFile(download / "cvsuhail-arml-fonts.zip", "w", zipfile.ZIP_DEFLATED)
    for spec in built:
        font_id = spec["id"]
        licence_name = f"{spec['licence']}-OFL.txt"
        licence_text = (SOURCES / "licenses" / licence_name).read_text()
        shutil.copy(OUT / f"{font_id}.woff2", PUBLIC / f"{font_id}.woff2")
        shutil.copy(OUT / f"{font_id}.ttf", download / f"{font_id}.ttf")
        shutil.copy(SOURCES / "licenses" / licence_name, PUBLIC / "licenses" / licence_name)
        readme = README.format(
            label=spec["label"],
            id=font_id,
            base=spec["source"].split("[")[0].replace("-Regular.ttf", "").replace(".ttf", ""),
            licence_file=f"OFL-{spec['licence']}.txt",
        )
        for archive_path, folder in ((download / f"{font_id}.zip", ""), (None, f"{font_id}/")):
            files = {
                f"{folder}ARML-SPEC.md": spec_text.encode(),
                f"{folder}{font_id}.ttf": (OUT / f"{font_id}.ttf").read_bytes(),
                f"{folder}OFL-{spec['licence']}.txt": licence_text.encode(),
                f"{folder}README.txt": readme.encode(),
            }
            archive = everything if archive_path is None else zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED)
            for name, data in files.items():
                archive.writestr(name, data)
            if archive_path is not None:
                archive.close()
        manifest.append(
            {
                "id": font_id,
                "label": spec["label"],
                "style": spec["style"],
                "base": spec["source"],
                "licence": f"licenses/{licence_name}",
                "file": f"{font_id}.woff2",
                "ttf": f"download/{font_id}.ttf",
                "zip": f"download/{font_id}.zip",
            }
        )
    everything.close()
    (PUBLIC / "fonts.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"published {len(manifest)} fonts to {PUBLIC.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", help="build just this font id")
    parser.add_argument("--publish", action="store_true", help="copy woff2 + licences to public/")
    args = parser.parse_args()

    config = json.loads((HERE / "fonts.json").read_text())
    table = json.loads(TABLE.read_text())
    built = []
    for spec in config["fonts"]:
        if args.only and spec["id"] not in args.only:
            continue
        print(f"building {spec['id']} from {spec['source']} ...", flush=True)
        builder = Builder(config, spec, table)
        builder.build()
        licences = {
            "description": "This Font Software is licensed under the SIL Open Font License, Version 1.1. "
            "It is a modified version of the original font, renamed as required by the licence."
        }
        ttf = builder.write(spec, licences)
        borrowed = [n for n in builder.notes if "borrowed" in n]
        missing = [n for n in builder.notes if n.startswith("MISSING")]
        print(f"  {len(table)} glyphs, {len(borrowed)} borrowed, {len(missing)} missing -> {ttf.name}")
        for note in missing:
            print("  !", note)
        built.append(spec)

    if args.publish:
        publish(built)
    return 0


if __name__ == "__main__":
    sys.exit(main())
