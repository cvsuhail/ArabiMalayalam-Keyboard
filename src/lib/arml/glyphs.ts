/**
 * The ARML glyph inventory: every shaped glyph an ARML font must draw, and the
 * single-byte code each one lives at.
 *
 * ARML is a legacy 8-bit encoding for Arabi-Malayalam, in the spirit of FML for
 * Malayalam. Text is pre-shaped (one code per positional form) and stored in
 * visual left-to-right order, so software that cannot shape or reorder Arabic
 * still draws it correctly when an ARML font is applied. The string a copy
 * produces is ordinary Windows-1252 text; only the font gives it meaning.
 *
 * THE ORDER OF GLYPH_SPECS IS A PUBLIC CONTRACT. Fonts bind to these codes, so
 * existing entries must never move or change: new glyphs are appended only.
 */

export type GlyphForm = "isol" | "init" | "medi" | "fina" | "mark" | "symbol" | "digit";
export type GlyphDirection = "rtl" | "ltr" | "neutral";

export interface Glyph {
  /** Stable name for font build scripts, e.g. "uni0628.init". */
  name: string;
  /** The Unicode letter, mark or symbol this glyph draws (two marks for stacked ones). */
  unicode: string;
  form: GlyphForm;
  /** Byte value in Windows-1252. */
  code: number;
  /** The character that byte decodes to; this is what ARML text contains. */
  char: string;
  direction: GlyphDirection;
}

/** Letters that join on both sides: isolated, initial, medial and final shapes. */
export const DUAL_JOINING = "بپتثجچحخسشصضطظعغفقكگلمنهھيئڿۼڹۻۺ";
/** Letters that join only to the letter before them: isolated and final shapes. */
export const RIGHT_JOINING = "اآأإؤةدذرزوڊڗڔژ";
/** Letters that never join. */
export const NON_JOINING = "ء";

export const SHADDA = "ّ";
/** Vowel marks that sit above the letter and stack with shadda in one glyph. */
export const SHADDA_STACKING = ["َ", "ُ", "٘", "ٗ"];
export const MARKS = [
  "َ", // fatha
  "ِ", // kasra
  "ُ", // damma
  "ْ", // sukun
  SHADDA,
  "٘", // Arabi-Malayalam e
  "ٗ", // Arabi-Malayalam o (inverted damma)
  "ً", // fathatan
  "ٌ", // dammatan
  "ٍ", // kasratan
  "ٰ", // dagger alef
];
const PUNCTUATION = ["،", "؛", "؟", "۔"]; // ، ؛ ؟ ۔
const SYMBOLS = ["ﷺ"]; // ﷺ
export const ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** ASCII that stays as it is: space, digits and the punctuation Arabic text shares with Latin. */
export const LITERAL_ASCII = new Set(` !"'(),-./0123456789:;?`);

const CP1252_HIGH: Record<number, string> = {
  0x80: "€",
  0x82: "‚",
  0x83: "ƒ",
  0x84: "„",
  0x85: "…",
  0x86: "†",
  0x87: "‡",
  0x88: "ˆ",
  0x89: "‰",
  0x8a: "Š",
  0x8b: "‹",
  0x8c: "Œ",
  0x8e: "Ž",
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
  0x98: "˜",
  0x99: "™",
  0x9a: "š",
  0x9b: "›",
  0x9c: "œ",
  0x9e: "ž",
  0x9f: "Ÿ",
};

/** Byte values glyphs may use, ascending: ASCII not kept as itself, printable cp1252, then Latin-1. */
function allowedCodes(): number[] {
  const codes: number[] = [];
  for (let code = 0x21; code <= 0x7e; code++) {
    if (!LITERAL_ASCII.has(String.fromCharCode(code))) codes.push(code);
  }
  for (let code = 0x80; code <= 0x9f; code++) if (CP1252_HIGH[code]) codes.push(code);
  for (let code = 0xa1; code <= 0xff; code++) if (code !== 0xad) codes.push(code); // 0xAD is a soft hyphen
  return codes;
}

function charForCode(code: number): string {
  return CP1252_HIGH[code] ?? String.fromCharCode(code);
}

const hex = (value: string) =>
  [...value].map((c) => c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")).join("_");

interface GlyphSpec {
  unicode: string;
  form: GlyphForm;
  direction: GlyphDirection;
}

function buildSpecs(): GlyphSpec[] {
  const specs: GlyphSpec[] = [];
  const add = (unicode: string, form: GlyphForm, direction: GlyphDirection = "rtl") =>
    specs.push({ unicode, form, direction });

  for (const letter of DUAL_JOINING) {
    for (const form of ["isol", "init", "medi", "fina"] as const) add(letter, form);
  }
  for (const letter of RIGHT_JOINING) {
    for (const form of ["isol", "fina"] as const) add(letter, form);
  }
  for (const letter of NON_JOINING) add(letter, "isol");
  for (const mark of MARKS) add(mark, "mark");
  for (const vowel of SHADDA_STACKING) add(SHADDA + vowel, "mark");
  for (const mark of PUNCTUATION) add(mark, "symbol", "neutral");
  for (const symbol of SYMBOLS) add(symbol, "symbol");
  for (const digit of ARABIC_INDIC_DIGITS) add(digit, "digit", "ltr");
  return specs;
}

const SPECS = buildSpecs();
const CODES = allowedCodes();
if (SPECS.length > CODES.length) {
  throw new Error(`ARML needs ${SPECS.length} codes but only ${CODES.length} are available`);
}

export const GLYPHS: readonly Glyph[] = SPECS.map((spec, index) => {
  const code = CODES[index]!;
  return {
    name: `uni${hex(spec.unicode)}${spec.form === "mark" || spec.form === "symbol" || spec.form === "digit" ? "" : `.${spec.form}`}`,
    unicode: spec.unicode,
    form: spec.form,
    code,
    char: charForCode(code),
    direction: spec.direction,
  };
});

/** Codes still free for future glyphs. */
export const SPARE_CODES = CODES.length - SPECS.length;

const byUnicodeForm = new Map(GLYPHS.map((g) => [`${g.unicode}|${g.form}`, g]));
const byChar = new Map(GLYPHS.map((g) => [g.char, g]));

export function glyphFor(unicode: string, form: GlyphForm): Glyph | undefined {
  return byUnicodeForm.get(`${unicode}|${form}`);
}

export function glyphForChar(char: string): Glyph | undefined {
  return byChar.get(char);
}
