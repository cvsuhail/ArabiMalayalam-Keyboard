import assert from "node:assert/strict";
import test from "node:test";

import { transliterateMalayalamToArabic } from "../transliteration/malayalamToArabic.ts";
import { GLYPHS, SPARE_CODES, fromArml, glyphFor, toArml, toArmlDetailed } from "./index.ts";

const glyph = (unicode, form) => glyphFor(unicode, form).char;

test("every glyph has its own code and fits in one byte", () => {
  const codes = new Set(GLYPHS.map((g) => g.code));
  const chars = new Set(GLYPHS.map((g) => g.char));
  assert.equal(codes.size, GLYPHS.length);
  assert.equal(chars.size, GLYPHS.length);
  assert.ok(GLYPHS.every((g) => g.code >= 0x21 && g.code <= 0xff));
  assert.ok(SPARE_CODES >= 0);
});

test("glyph codes never use the ASCII that stays literal", () => {
  for (const g of GLYPHS) {
    assert.ok(!/[ 0-9!"'(),\-./:;?]/.test(g.char), `${g.name} sits on a literal`);
  }
});

test("the first glyph codes are frozen: fonts bind to them", () => {
  assert.deepEqual(
    GLYPHS.slice(0, 4).map((g) => [g.name, g.code]),
    [
      ["uni0628.isol", 0x23],
      ["uni0628.init", 0x24],
      ["uni0628.medi", 0x25],
      ["uni0628.fina", 0x26],
    ],
  );
});

test("a lone letter is isolated", () => {
  assert.equal(toArml("ب"), glyph("ب", "isol"));
});

test("joining letters take initial, medial and final shapes in visual order", () => {
  // بتب: beh+teh+beh is init, medi, fina logically; the line is drawn reversed.
  assert.equal(toArml("بتب"), glyph("ب", "fina") + glyph("ت", "medi") + glyph("ب", "init"));
});

test("a right-joining letter stops the join", () => {
  // دب: dal never joins forward, so beh after it starts a new word shape.
  assert.equal(toArml("دب"), glyph("ب", "isol") + glyph("د", "isol"));
  // بد: beh is initial, dal is final.
  assert.equal(toArml("بد"), glyph("د", "fina") + glyph("ب", "init"));
});

test("marks follow their letter in visual order", () => {
  const fatha = glyphFor("َ", "mark").char;
  assert.equal(toArml("بَت"), glyph("ت", "fina") + glyph("ب", "init") + fatha);
});

test("shadda with a stacking vowel becomes one glyph", () => {
  const combo = glyphFor("َّ", "mark").char;
  assert.equal(toArml("بّـَ".replace("ـ", "")), glyph("ب", "isol") + combo);
  assert.equal(toArml("بَّ"), glyph("ب", "isol") + combo);
});

test("ZWNJ breaks a join and ZWJ forces one", () => {
  assert.equal(toArml("ب‌ب"), glyph("ب", "isol") + glyph("ب", "isol"));
  assert.equal(toArml("ب‍"), glyph("ب", "init"));
});

test("numbers keep their order inside a right-to-left line", () => {
  const out = toArml("ب 123 ب");
  assert.equal(out, glyph("ب", "isol") + " 123 " + glyph("ب", "isol"));
});

test("Arabic-Indic digits keep their order too", () => {
  const out = toArml("ب ۱۲");
  assert.equal(
    out,
    glyphFor("۱", "digit").char + glyphFor("۲", "digit").char + " " + glyph("ب", "isol"),
  );
});

test("brackets are mirrored in right-to-left text", () => {
  assert.equal(toArml("(ب)"), "(" + glyph("ب", "isol") + ")");
});

test("each line is laid out on its own", () => {
  assert.equal(toArml("ب\nت"), glyph("ب", "isol") + "\n" + glyph("ت", "isol"));
});

test("reports Latin letters and characters with no glyph", () => {
  const result = toArmlDetailed("ب ab ക #");
  assert.equal(result.latinLetters, 2);
  assert.deepEqual(result.unmapped.sort(), ["#", "ക"].sort());
  assert.ok(result.text.includes("ab"));
});

test("ARML text is plain Windows-1252 characters", () => {
  const out = toArml("اَلسَّلَامُ عَلَيْكُمْ");
  assert.ok(/^[ -~\u0080-ÿŒœŠšŸŽžƒˆ˜–-•…‰‹›€™\n]*$/.test(out));
});

test("decoding gives back the original text", () => {
  const samples = [
    "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ",
    "اَلسَّلَامُ عَلَيْكُمْ",
    "ڿَانْ ا٘ۼَّن٘ ڔَۻَيۺَمْ",
    "كُوڊَيْ ڗَاۻِيٰ (ڹَتِ) ۱۲۳ 2024",
    "ا٘نْتَاڹْ وِش٘يۺَمْ؟",
  ];
  for (const sample of samples) {
    const normalised = sample.normalize("NFC");
    assert.equal(fromArml(toArml(normalised)), normalised, sample);
  }
});

test("round-trips real transliterator output", () => {
  const malayalam = [
    "ഞാൻ",
    "എവിടെ",
    "എങ്ങനെ",
    "നമസ്കാരം",
    "സ്വലാത്ത്",
    "കേരളം",
    "ഇന്നത്തെ വിശേഷം എന്താണ്",
    "മലയാളം",
    "ഖുർആൻ",
    "പത്ത് രൂപ 100",
  ];
  for (const word of malayalam) {
    const arabic = transliterateMalayalamToArabic(word);
    const result = toArmlDetailed(arabic);
    assert.deepEqual(result.unmapped, [], `${word} -> ${arabic}`);
    assert.equal(fromArml(result.text), arabic.normalize("NFC"), `${word} -> ${arabic}`);
  }
});
