import type { Phoneme, PhonemeKind } from "./types";

/**
 * Phoneme inventory and source-script rules.
 *
 * NOTE: these tables model Malayalam sound groups (vowels, long vowels,
 * consonants, aspirated consonants, retroflex, nasals, gemination, chillus).
 * They are intentionally data-driven so they can be reviewed and expanded by
 * a linguist without touching application logic.
 */

export const VOWELS = [
  "a",
  "aa",
  "i",
  "ii",
  "u",
  "uu",
  "e",
  "ee",
  "ai",
  "o",
  "oo",
  "au",
  "ru",
] as const;

export type VowelId = (typeof VOWELS)[number];

/** Manglish (romanized) digraph/trigraph rules, matched longest-first. */
const MANGLISH_CONSONANTS: Array<[string, string]> = [
  ["ksh", "ksha"],
  ["zhh", "zha"],
  ["chh", "chha"],
  ["ngh", "nga"],
  ["ng", "nga"],
  ["nj", "nja"],
  ["kh", "kha"],
  ["gh", "gha"],
  ["ch", "cha"],
  ["jh", "jha"],
  ["sh", "sha"],
  ["zh", "zha"],
  ["th", "tha"],
  ["dh", "dha"],
  ["ph", "pha"],
  ["bh", "bha"],
  ["tt", "Tta"],
  ["dd", "Dda"],
  ["nn", "nna"],
  ["ll", "lla"],
  ["rr", "rra"],
  ["k", "ka"],
  ["g", "ga"],
  ["c", "cha"],
  ["j", "ja"],
  ["t", "Ta"],
  ["d", "Da"],
  ["n", "na"],
  ["p", "pa"],
  ["f", "pha"],
  ["b", "ba"],
  ["m", "ma"],
  ["y", "ya"],
  ["r", "ra"],
  ["l", "la"],
  ["v", "va"],
  ["w", "va"],
  ["s", "sa"],
  ["h", "ha"],
  ["q", "ka"],
  ["x", "ksha"],
  ["z", "za"],
];

const MANGLISH_VOWELS: Array<[string, VowelId]> = [
  ["aa", "aa"],
  ["ee", "ii"],
  ["ii", "ii"],
  ["oo", "oo"],
  ["uu", "uu"],
  ["ai", "ai"],
  ["au", "au"],
  ["ou", "au"],
  ["ea", "ii"],
  ["a", "a"],
  ["i", "i"],
  ["u", "u"],
  ["e", "e"],
  ["o", "o"],
];

const cons = (id: string, vowel?: string, source?: string): Phoneme => ({
  id,
  kind: "consonant",
  vowel,
  source,
});

const vow = (id: string, source?: string): Phoneme => ({
  id,
  kind: "vowel",
  source,
});

export function makePhoneme(
  id: string,
  kind: PhonemeKind,
  vowel?: string,
): Phoneme {
  return { id, kind, vowel };
}

/** Tokenize a manglish word into phonemes (consonant + inherent vowel). */
export function manglishToPhonemes(word: string): Phoneme[] {
  const text = word.toLowerCase();
  const out: Phoneme[] = [];
  let i = 0;

  while (i < text.length) {
    const rest = text.slice(i);

    // Gemination: doubled consonant letters that are not in the digraph table.
    const consMatch = MANGLISH_CONSONANTS.find(([pattern]) =>
      rest.startsWith(pattern),
    );

    if (consMatch) {
      const [pattern, id] = consMatch;
      i += pattern.length;
      const after = text.slice(i);
      const vowelMatch = MANGLISH_VOWELS.find(([pattern2]) =>
        after.startsWith(pattern2),
      );
      if (vowelMatch) {
        i += vowelMatch[0].length;
        out.push(cons(id, vowelMatch[1], pattern + vowelMatch[0]));
      } else {
        out.push(cons(id, undefined, pattern));
      }
      continue;
    }

    const vowelMatch = MANGLISH_VOWELS.find(([pattern]) =>
      rest.startsWith(pattern),
    );
    if (vowelMatch) {
      i += vowelMatch[0].length;
      out.push(vow(vowelMatch[1], vowelMatch[0]));
      continue;
    }

    // Unknown character: keep as-is so mixed content survives.
    out.push({ id: rest[0]!, kind: "other", source: rest[0]! });
    i += 1;
  }

  return out;
}

/** Malayalam base consonants -> phoneme ids. */
const ML_CONSONANTS: Record<string, string> = {
  ക: "ka",
  ഖ: "kha",
  ഗ: "ga",
  ഘ: "gha",
  ങ: "nga",
  ച: "cha",
  ഛ: "chha",
  ജ: "ja",
  ഝ: "jha",
  ഞ: "nja",
  ട: "Tta",
  ഠ: "Ttha",
  ഡ: "Dda",
  ഢ: "Ddha",
  ണ: "Nna",
  ത: "tha",
  ഥ: "thha",
  ദ: "da",
  ധ: "dha",
  ന: "na",
  പ: "pa",
  ഫ: "pha",
  ബ: "ba",
  ഭ: "bha",
  മ: "ma",
  യ: "ya",
  ര: "ra",
  റ: "rra",
  ല: "la",
  ള: "lla",
  ഴ: "zha",
  വ: "va",
  ശ: "sha",
  ഷ: "ssa",
  സ: "sa",
  ഹ: "ha",
};

/** Malayalam vowel signs (matras) -> vowel ids. */
const ML_MATRAS: Record<string, VowelId> = {
  "\u0D3E": "aa",
  "\u0D3F": "i",
  "\u0D40": "ii",
  "\u0D41": "u",
  "\u0D42": "uu",
  "\u0D43": "ru",
  "\u0D46": "e",
  "\u0D47": "ee",
  "\u0D48": "ai",
  "\u0D4A": "o",
  "\u0D4B": "oo",
  "\u0D4C": "au",
};

/** Independent Malayalam vowels. */
const ML_VOWELS: Record<string, VowelId> = {
  അ: "a",
  ആ: "aa",
  ഇ: "i",
  ഈ: "ii",
  ഉ: "u",
  ഊ: "uu",
  ഋ: "ru",
  എ: "e",
  ഏ: "ee",
  ഐ: "ai",
  ഒ: "o",
  ഓ: "oo",
  ഔ: "au",
};

/** Chillu letters (pure consonants). */
const ML_CHILLUS: Record<string, string> = {
  ൺ: "Nna",
  ൻ: "na",
  ർ: "ra",
  ൽ: "la",
  ൾ: "lla",
  ൿ: "ka",
};

const VIRAMA = "\u0D4D";
const ANUSVARA = "\u0D02";

/** Tokenize Malayalam script into phonemes. */
export function malayalamToPhonemes(word: string): Phoneme[] {
  const out: Phoneme[] = [];
  const chars = Array.from(word);
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i]!;

    const consId = ML_CONSONANTS[ch];
    if (consId) {
      const id = consId;
      let vowel: string | undefined = "a"; // inherent vowel
      let consumed = 1;
      const next = chars[i + 1];
      const matra = next ? ML_MATRAS[next] : undefined;
      if (matra) {
        vowel = matra;
        consumed = 2;
      } else if (next === VIRAMA) {
        vowel = undefined;
        consumed = 2;
      }
      out.push(cons(id, vowel, ch));
      i += consumed;
      continue;
    }

    const chillu = ML_CHILLUS[ch];
    if (chillu) {
      out.push({ id: chillu, kind: "chillu", source: ch });
      i += 1;
      continue;
    }

    const mlVowel = ML_VOWELS[ch];
    if (mlVowel) {
      out.push(vow(mlVowel, ch));
      i += 1;
      continue;
    }

    if (ch === ANUSVARA) {
      out.push({ id: "ma", kind: "anusvara", source: ch });
      i += 1;
      continue;
    }

    out.push({ id: ch, kind: "other", source: ch });
    i += 1;
  }

  return out;
}

/** A script-independent key used for dictionary lookup and similarity. */
export function phonemesToKey(phonemes: Phoneme[]): string {
  return phonemes
    .map((p) => (p.kind === "consonant" ? `${p.id}${p.vowel ?? ""}` : p.id))
    .join("-");
}
