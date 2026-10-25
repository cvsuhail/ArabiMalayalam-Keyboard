import type { GlyphDirection } from "./glyphs.ts";

/** A cluster that reorders as one piece: a letter with its marks, a digit, a space... */
export interface Unit {
  direction: GlyphDirection;
  text: string;
}

const MIRRORED: Record<string, string> = { "(": ")", ")": "(" };

/**
 * Lay one paragraph line out the way a left-to-right program would draw it:
 * the line is right-to-left, so runs of Arabic come out reversed, while runs of
 * numbers and Latin keep their own order. Spaces and punctuation between two
 * left-to-right runs belong to them, otherwise to the Arabic.
 *
 * The same pass undoes itself, so it serves both directions of the converter.
 */
export function visualOrder(units: readonly Unit[]): string {
  const resolved = units.map((unit) => unit.direction);

  for (let start = 0; start < units.length;) {
    if (resolved[start] !== "neutral") {
      start++;
      continue;
    }
    let end = start;
    while (end < units.length && resolved[end] === "neutral") end++;
    const before = start > 0 ? resolved[start - 1] : "rtl";
    const after = end < units.length ? resolved[end] : "rtl";
    const direction = before === "ltr" && after === "ltr" ? "ltr" : "rtl";
    for (let i = start; i < end; i++) resolved[i] = direction;
    start = end;
  }

  const runs: Array<{ direction: GlyphDirection; texts: string[] }> = [];
  units.forEach((unit, index) => {
    const direction = resolved[index]!;
    const text = direction === "rtl" ? (MIRRORED[unit.text] ?? unit.text) : unit.text;
    const last = runs.at(-1);
    if (last && last.direction === direction) last.texts.push(text);
    else runs.push({ direction, texts: [text] });
  });

  return runs
    .reverse()
    .map((run) => (run.direction === "rtl" ? run.texts.reverse() : run.texts).join(""))
    .join("");
}
