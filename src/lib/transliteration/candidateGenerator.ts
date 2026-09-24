import {
  CONSONANT_GRAPHEMES,
  HARAKAT,
  INITIAL_VOWELS,
  VOWEL_MARKS,
} from "./arabiMalayalamMap";
import type { Phoneme } from "./types";

const MAX_BRANCHES = 12;

function options(mapping: { primary: string; alternatives?: string[] | undefined }) {
  return [mapping.primary, ...(mapping.alternatives ?? [])];
}

/**
 * Turn a phoneme sequence into a ranked-by-construction list of Arabi
 * Malayalam spellings. Branching is capped so typing stays instant.
 */
export function generateCandidates(phonemes: Phoneme[]): string[] {
  let branches: string[] = [""];

  phonemes.forEach((phoneme, index) => {
    const pieces = graphemeOptions(phoneme, index === 0);
    const next: string[] = [];
    for (const branch of branches) {
      for (const piece of pieces) {
        next.push(branch + piece);
      }
    }
    branches = dedupe(next).slice(0, MAX_BRANCHES);
  });

  return dedupe(branches).filter((value) => value.length > 0);
}

function graphemeOptions(phoneme: Phoneme, isFirst: boolean): string[] {
  if (phoneme.kind === "vowel") {
    const mapping = isFirst
      ? INITIAL_VOWELS[phoneme.id]
      : VOWEL_MARKS[phoneme.id];
    return mapping ? options(mapping) : [phoneme.id];
  }

  if (phoneme.kind === "other") {
    return [phoneme.id];
  }

  const consonant = CONSONANT_GRAPHEMES[phoneme.id];
  if (!consonant) return [phoneme.id];

  const letters = options(consonant);

  if (phoneme.kind === "chillu" || phoneme.kind === "anusvara") {
    return letters.map((letter) => letter + HARAKAT.sukun);
  }

  if (!phoneme.vowel) {
    // Bare consonant (cluster member): sukun, or silent for compactness.
    return dedupe(
      letters.flatMap((letter) => [letter + HARAKAT.sukun, letter]),
    );
  }

  const vowel = VOWEL_MARKS[phoneme.vowel];
  const marks = vowel ? options(vowel) : [""];

  const combos: string[] = [];
  for (const letter of letters) {
    for (const mark of marks) {
      combos.push(letter + mark);
      // Unvocalized spelling is extremely common in real Arabi Malayalam text.
      if (mark === HARAKAT.fatha) combos.push(letter);
    }
  }
  return dedupe(combos);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}
