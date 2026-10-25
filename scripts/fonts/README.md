# cvsuhail-* ARML fonts

Derived from open-licence (SIL OFL) Arabic fonts. See `replica/arml/SPEC.md` for the encoding.

```bash
python3 -m venv scripts/fonts/.venv
scripts/fonts/.venv/bin/pip install fonttools uharfbuzz brotli
scripts/fonts/fetch.sh                       # downloads the source fonts (about 3 MB)
node --experimental-strip-types scripts/export-arml-table.mjs   # refreshes the glyph table
scripts/fonts/.venv/bin/python scripts/fonts/build.py --publish  # builds out/ and public/fonts/arml/
```

- `fonts.json`: the family (ids, labels, sources). Rename or add entries freely.
- Each glyph is shaped with HarfBuzz from its source, so joining, dots and composed letters match
  the source font. Letters a source lacks are borrowed from the fallback fonts and listed in the output.
- Marks are zero-advance glyphs attached with GPOS mark-to-base anchors. Programs that ignore GPOS
  will draw them at the pen position, slightly off the letter.
- OFL: the fonts are renamed (no Reserved Font Names), and each source's OFL text is copied to
  `public/fonts/arml/licenses/`. The OFL does not allow selling a font file by itself.
