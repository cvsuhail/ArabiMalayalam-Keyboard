import { visualOrder, type Unit } from "./bidi.ts";
import {
  DUAL_JOINING,
  LITERAL_ASCII,
  NON_JOINING,
  RIGHT_JOINING,
  SHADDA,
  SHADDA_STACKING,
  glyphFor,
  glyphForChar,
  type GlyphForm,
} from "./glyphs.ts";

const ZWNJ = "‌";
const ZWJ = "‍";
const COMBINING = /^\p{M}$/u;
const ASCII_LETTER = /^[A-Za-z]$/;

export interface ArmlResult {
  /** The ARML text: pre-shaped, visual order, ready for an ARML font. */
  text: string;
  /** Latin letters kept as typed. They share codes with ARML glyphs, so they need a Latin font. */
  latinLetters: number;
  /** Characters ARML has no glyph for; they are left out. */
  unmapped: string[];
}

type Item =
  | { type: "letter"; letter: string; marks: string[] }
  | { type: "zwnj" }
  | { type: "zwj" }
  | { type: "other"; char: string };

const isLetter = (char: string) =>
  DUAL_JOINING.includes(char) || RIGHT_JOINING.includes(char) || NON_JOINING.includes(char);

function parseItems(line: string): Item[] {
  const chars = [...line];
  const items: Item[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    if (isLetter(char)) {
      const marks: string[] = [];
      while (i + 1 < chars.length && COMBINING.test(chars[i + 1]!)) marks.push(chars[++i]!);
      items.push({ type: "letter", letter: char, marks });
    } else if (char === ZWNJ) items.push({ type: "zwnj" });
    else if (char === ZWJ) items.push({ type: "zwj" });
    else items.push({ type: "other", char });
  }
  return items;
}

/** Shadda plus a stacking vowel is one glyph; every other mark is its own. */
function markKeys(marks: string[]): string[] {
  const stacked = marks.includes(SHADDA)
    ? marks.find((m) => SHADDA_STACKING.includes(m))
    : undefined;
  if (!stacked) return marks;
  const rest = marks.filter((m) => m !== SHADDA && m !== stacked);
  return [SHADDA + stacked, ...rest];
}

/** Does this item hand a join to the letter after it? */
const joinsForward = (item: Item | undefined) =>
  item?.type === "zwj" || (item?.type === "letter" && DUAL_JOINING.includes(item.letter));
/** Does this item accept a join from the letter before it? */
const joinsBackward = (item: Item | undefined) =>
  item?.type === "zwj" ||
  (item?.type === "letter" &&
    (DUAL_JOINING.includes(item.letter) || RIGHT_JOINING.includes(item.letter)));

function encodeLine(line: string, result: ArmlResult): string {
  const items = parseItems(line);
  const units: Unit[] = [];

  items.forEach((item, index) => {
    if (item.type === "letter") {
      const connectsPrev = joinsForward(items[index - 1]);
      const connectsNext = joinsBackward(items[index + 1]);
      let form: GlyphForm = "isol";
      if (DUAL_JOINING.includes(item.letter)) {
        form = connectsPrev ? (connectsNext ? "medi" : "fina") : connectsNext ? "init" : "isol";
      } else if (RIGHT_JOINING.includes(item.letter) && connectsPrev) {
        form = "fina";
      }
      const glyph = glyphFor(item.letter, form) ?? glyphFor(item.letter, "isol");
      let text = glyph!.char;
      for (const key of markKeys(item.marks)) {
        const mark = glyphFor(key, "mark");
        if (mark) text += mark.char;
        else result.unmapped.push(key);
      }
      units.push({ direction: "rtl", text });
    } else if (item.type === "other") {
      const { char } = item;
      const glyph = glyphFor(char, "symbol") ?? glyphFor(char, "digit");
      if (glyph) {
        units.push({ direction: glyph.direction, text: glyph.char });
      } else if (char === "\t" || LITERAL_ASCII.has(char)) {
        const direction = /[0-9]/.test(char) ? "ltr" : "neutral";
        units.push({ direction, text: char });
      } else if (ASCII_LETTER.test(char)) {
        result.latinLetters++;
        units.push({ direction: "ltr", text: char });
      } else {
        result.unmapped.push(char);
      }
    }
    // ZWNJ and ZWJ only steer joining above; they have no glyph.
  });

  return visualOrder(units);
}

/** Convert Unicode Arabi-Malayalam text to ARML, reporting what could not be carried over. */
export function toArmlDetailed(text: string): ArmlResult {
  const result: ArmlResult = { text: "", latinLetters: 0, unmapped: [] };
  result.text = text
    .normalize("NFC")
    .split(/\r\n|\n|\r/)
    .map((line) => encodeLine(line, result))
    .join("\n");
  result.unmapped = [...new Set(result.unmapped)];
  return result;
}

export function toArml(text: string): string {
  return toArmlDetailed(text).text;
}

function decodeLine(line: string): string {
  const units: Unit[] = [];
  for (const char of line) {
    const glyph = glyphForChar(char);
    if (!glyph) {
      units.push({ direction: /[0-9]/.test(char) ? "ltr" : "neutral", text: char });
    } else if (glyph.form === "mark" && units.at(-1)?.direction === "rtl") {
      units.at(-1)!.text += glyph.unicode;
    } else {
      units.push({ direction: glyph.direction, text: glyph.unicode });
    }
  }
  return visualOrder(units);
}

/**
 * Best-effort ARML to Unicode, for checking and importing. Positional shapes
 * fold back to one letter, so joiners are not restored; the result reads the
 * same and shapes the same, which is what matters.
 */
export function fromArml(armlText: string): string {
  return armlText
    .split(/\r\n|\n|\r/)
    .map(decodeLine)
    .join("\n")
    .normalize("NFC");
}
