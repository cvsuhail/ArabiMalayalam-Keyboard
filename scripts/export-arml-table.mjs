// Writes the ARML glyph table the font build reads: node --experimental-strip-types scripts/export-arml-table.mjs
import { mkdirSync, writeFileSync } from "node:fs";

import { GLYPHS } from "../src/lib/arml/glyphs.ts";

const table = GLYPHS.map(({ name, unicode, form, code, direction }) => ({
  name,
  unicode: [...unicode].map(
    (c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"),
  ),
  form,
  code,
  hex: "0x" + code.toString(16).toUpperCase(),
  direction,
}));

mkdirSync("replica/arml", { recursive: true });
writeFileSync("replica/arml/glyph-table.json", JSON.stringify(table, null, 2) + "\n");
console.log(`${table.length} glyphs written to replica/arml/glyph-table.json`);
