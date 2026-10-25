/**
 * Manglish -> Malayalam spelling generator.
 *
 * Roman input is split into consonant and vowel units. Each unit has weighted
 * Malayalam readings that depend on its neighbours: intervocalic `ch` is
 * usually ച്ച, `nd` is usually ണ്ട, a word-final `n` is usually the chillu ൻ,
 * a word-final `u` is often the half-u ് (samvruthokaram), and so on.
 *
 * A small beam search combines the readings into whole-word spellings, cheapest
 * first. The generator deliberately over-produces: the lexicon decides which
 * of the spellings are real words (see smartManglishLayer.ts).
 */

const VIRAMA = "്";
const BEAM_WIDTH = 48;
/** Extra beam slots reserved for spellings that are prefixes of known words. */
const ATTESTED_BEAM_WIDTH = 32;
const MAX_INPUT_LENGTH = 40;

type Position = "start" | "vowel" | "consonant" | "end";

interface Reading {
  ml: string;
  cost: number;
  /** Chillus and anusvara close the syllable: no vowel sign or virama follows. */
  terminal?: boolean;
}

interface Unit {
  key: string;
  vowel: boolean;
}

export interface PhoneticSpelling {
  text: string;
  /** Lower is more likely. 0 is the most typical reading of every unit. */
  cost: number;
}

export interface PhoneticOptions {
  limit?: number;
  /**
   * Render the input as an unfinished word (no closing virama or chillu), for
   * prefix completion: `sukham` -> സുഖമ, which prefixes സുഖമാണോ.
   */
  open?: boolean;
  /**
   * Lexicon guide: returns true when some known word starts with `text`.
   * Partial spellings that pass it are kept even when they are costly, so a
   * real word needing several unusual readings is not pruned from the beam.
   */
  isKnownPrefix?: (text: string) => boolean;
}

const S = (ml: string, cost = 0): Reading => ({ ml, cost });
const T = (ml: string, cost = 0): Reading => ({ ml, cost, terminal: true });

// Longest keys first. Capitals are explicit hints for retroflex/long sounds.
const VOWEL_KEYS = ["aa", "ae", "ai", "au", "ee", "ei", "ii", "oa", "oo", "ou", "uu"];
const SINGLE_VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);
const CONSONANT_KEYS = [
  "thth",
  "ksh",
  "nch",
  "ndh",
  "nth",
  "chh",
  "cch",
  "tth",
  "ddh",
  "kk",
  "ck",
  "kh",
  "gg",
  "gh",
  "ng",
  "nk",
  "nj",
  "ch",
  "cc",
  "jj",
  "jh",
  "tt",
  "TT",
  "th",
  "dd",
  "DD",
  "dh",
  "nd",
  "nt",
  "nn",
  "NN",
  "pp",
  "ph",
  "bb",
  "bh",
  "mm",
  "mb",
  "mp",
  "yy",
  "rr",
  "ll",
  "LL",
  "vv",
  "ww",
  "zh",
  "sh",
  "ss",
  "gn",
  "ff",
];

/** Readings that do not depend on the neighbouring units. */
const FIXED_READINGS: Record<string, Reading[]> = {
  kk: [S("ക്ക")],
  ck: [S("ക്ക")],
  kh: [S("ഖ"), S("ക", 1.5)],
  g: [S("ഗ")],
  gg: [S("ഗ്ഗ"), S("ക്ക", 1.5)],
  gh: [S("ഘ"), S("ഗ", 1.5)],
  nk: [S("ങ്ക"), S("ന്ക", 2)],
  nch: [S("ഞ്ച"), S("ന്ച", 2.5)],
  chh: [S("ച്ച"), S("ഛ", 1.5)],
  cch: [S("ച്ച")],
  cc: [S("ച്ച")],
  c: [S("ക"), S("ച", 1), S("സ", 1.5)],
  j: [S("ജ")],
  jj: [S("ജ്ജ")],
  jh: [S("ഝ"), S("ജ", 1)],
  T: [S("ട")],
  TT: [S("ട്ട")],
  tt: [S("ട്ട"), S("റ്റ", 0.7), S("ത്ത", 1.6)],
  thth: [S("ത്ത")],
  tth: [S("ത്ത"), S("ത്ഥ", 2)],
  D: [S("ഡ"), S("ട", 0.8)],
  dd: [S("ദ്ദ"), S("ഡ്ഡ", 0.5), S("ട്ട", 1.2)],
  DD: [S("ഡ്ഡ")],
  dh: [S("ദ"), S("ധ", 0.5), S("ഥ", 1)], // kadha -> കഥ
  ddh: [S("ദ്ധ")],
  nd: [S("ണ്ട"), S("ന്ദ", 0.6), S("ന്ത", 1.6)],
  ndh: [S("ന്ധ"), S("ന്ദ", 0.3)],
  nt: [S("ന്റ"), S("ണ്ട", 0.9), S("ന്ത", 1.2)],
  nth: [S("ന്ത"), S("ന്ദ", 1.6)],
  nn: [S("ന്ന"), S("ണ്ണ", 0.5)],
  NN: [S("ണ്ണ")],
  p: [S("പ")],
  pp: [S("പ്പ")],
  ph: [S("ഫ")],
  f: [S("ഫ")],
  ff: [S("ഫ്ഫ")],
  b: [S("ബ")],
  bb: [S("ബ്ബ")],
  bh: [S("ഭ")],
  mm: [S("മ്മ")],
  mb: [S("മ്പ"), S("മ്ബ", 2)],
  mp: [S("മ്പ")],
  y: [S("യ")],
  yy: [S("യ്യ")],
  rr: [S("റ"), S("റ്റ", 0.5)],
  ll: [S("ല്ല"), S("ള്ള", 0.5)],
  LL: [S("ള്ള")],
  v: [S("വ")],
  w: [S("വ")],
  vv: [S("വ്വ")],
  ww: [S("വ്വ")],
  zh: [S("ഴ")],
  z: [S("സ"), S("ഴ", 0.8)],
  s: [S("സ")],
  ss: [S("സ്സ")],
  h: [S("ഹ")],
  x: [S("ക്സ")],
  q: [S("ഖ"), S("ക", 0.5)],
  gn: [S("ഞ"), S("ജ്ഞ", 1), S("ഗ്ന", 1.5)],
  ksh: [S("ക്ഷ")],
};

function consonantReadings(
  key: string,
  previous: Position,
  next: Position,
  nextKey: string | undefined,
): Reading[] {
  const afterVowel = previous === "vowel";
  const betweenVowels = afterVowel && next === "vowel";

  switch (key) {
    case "k":
      if (next === "end") return [S("ക്ക"), S("ക", 0.5), T("ൿ", 3)];
      return betweenVowels ? [S("ക"), S("ക്ക", 1)] : [S("ക")];
    case "ng":
      if (previous === "start" || next === "consonant") return [S("ങ"), S("ങ്ങ", 1)];
      return [S("ങ്ങ"), S("ങ", 1.5), S("ന്ഗ", 2.5)];
    case "nj":
      return previous === "start" ? [S("ഞ"), S("ഞ്ഞ", 4)] : [S("ഞ്ഞ"), S("ഞ്ച", 0.6), S("ഞ", 1)];
    case "ch":
      return afterVowel && next !== "consonant" ? [S("ച്ച"), S("ച", 0.6)] : [S("ച"), S("ച്ച", 1.5)];
    case "t":
      return [S("ട"), S("ത", 1.2)];
    case "th":
      return afterVowel && next !== "consonant"
        ? [S("ത"), S("ത്ത", 0.8), S("ഥ", 2.2)]
        : [S("ത"), S("ഥ", 2)];
    case "d":
      if (previous === "start") return [S("ദ"), S("ഡ", 1.2)];
      if (afterVowel) return [S("ട"), S("ദ", 0.4), S("ഡ", 1.4), S("ഠ", 1.6)];
      return [S("ദ"), S("ഡ", 0.8)];
    case "n":
      if (next === "vowel") return [S("ന"), S("ണ", previous === "start" ? 1.5 : 0.7)];
      if (next === "end") return [T("ൻ"), S("ണ", 1), T("ൺ", 1.2), S("ന", 1.8)];
      return [S("ന"), T("ൻ", 0.6), S("ണ", 1.2)];
    case "N":
      if (next === "vowel") return [S("ണ")];
      if (next === "end") return [T("ൺ"), S("ണ", 0.5)];
      return [S("ണ"), T("ൺ", 0.5)];
    case "m":
      if (next === "vowel") return [S("മ")];
      if (next === "end") return [T("ം"), S("മ", 1.5)];
      return [S("മ"), T("ം", 0.5)];
    case "r":
      if (next === "vowel") return [S("ര"), S("റ", previous === "consonant" ? 1.5 : 0.6)];
      if (next === "end") return [T("ർ"), S("റ", 1), S("ര", 1.6)];
      return [T("ർ"), S("ര", 0.9)];
    case "R":
      return next === "vowel" ? [S("റ")] : [S("റ"), T("ർ", 0.5)];
    case "l":
      if (next === "vowel") return [S("ല"), S("ള", 0.6)];
      if (next === "end") return [T("ൽ"), T("ൾ", 0.4), S("ല", 2)];
      return [S("ല"), T("ൽ", 0.2), T("ൾ", 0.8), S("ള", 1.2)];
    case "L":
      if (next === "vowel") return [S("ള")];
      if (next === "end") return [T("ൾ"), S("ള", 1)];
      return [T("ൾ"), S("ള", 0.5)];
    case "sh":
      // ഷ before retroflex t (ഇഷ്ടം, കഷ്ടം); ശ otherwise (ശരി, ശബ്ദം).
      return nextKey?.[0] === "t" || nextKey?.[0] === "T"
        ? [S("ഷ"), S("ശ", 1.5)]
        : [S("ശ"), S("ഷ", 0.3)];
    default:
      return FIXED_READINGS[key] ?? [];
  }
}

interface VowelReadings {
  sign: Reading[];
  independent: Reading[];
}

function vowelReadings(key: string, final: boolean): VowelReadings {
  switch (key) {
    // Casual typing often drops vowel length (njan = ഞാൻ, entha = എന്താ), so
    // short vowels also offer their long form at a cost the lexicon can overcome.
    case "a":
      return { sign: [S(""), S("ാ", 1.3)], independent: [S("അ"), S("ആ", 1.3)] };
    case "aa":
    case "A":
      return { sign: [S("ാ")], independent: [S("ആ")] };
    case "i":
      return { sign: [S("ി"), S("ീ", 1.3)], independent: [S("ഇ"), S("ഈ", 1.3)] };
    case "ee":
      return { sign: [S("ീ"), S("േ", 1.2)], independent: [S("ഈ"), S("ഏ", 1.2)] };
    case "ii":
    case "I":
      return { sign: [S("ീ")], independent: [S("ഈ")] };
    case "u":
      // Final u is usually the half-u (ഒന്ന്, വീട്) but also a full u (വന്നു).
      return {
        sign: final ? [S(VIRAMA), S("ു", 0.15), S("ൂ", 1.5)] : [S("ു"), S("ൂ", 1.3)],
        independent: [S("ഉ"), S("ഊ", 1.3)],
      };
    case "oo":
      return { sign: [S("ൂ"), S("ോ", 1.2)], independent: [S("ഊ"), S("ഓ", 1.2)] };
    case "uu":
    case "U":
      return { sign: [S("ൂ")], independent: [S("ഊ")] };
    case "e":
      return { sign: [S("െ"), S("േ", 0.45)], independent: [S("എ"), S("ഏ", 0.7)] };
    case "ae":
    case "E":
      return { sign: [S("േ")], independent: [S("ഏ")] };
    case "o":
      // Final o is nearly always long: ഉണ്ടോ, വരുമോ, എപ്പോ.
      return {
        sign: final ? [S("ോ"), S("ൊ", 1)] : [S("ൊ"), S("ോ", 0.35)],
        independent: [S("ഒ"), S("ഓ", 0.5)],
      };
    case "oa":
    case "O":
      return { sign: [S("ോ")], independent: [S("ഓ")] };
    case "ai":
      return { sign: [S("ൈ")], independent: [S("ഐ")] };
    case "ei":
      return { sign: [S("േ"), S("ൈ", 0.5)], independent: [S("ഏ"), S("ഐ", 0.5)] };
    case "au":
    case "ou":
      return { sign: [S("ൗ")], independent: [S("ഔ")] };
    case "ru":
      return { sign: [S("്രു"), S("ൃ", 0.8)], independent: [S("രു")] };
    case "ri":
      return { sign: [S("്രി"), S("ൃ", 0.8)], independent: [S("രി")] };
    default:
      return { sign: [], independent: [] };
  }
}

/**
 * Lower-case ordinary letters but keep internal capitals that carry meaning
 * (T, D, N, L, R, long vowels). A fully upper-case word is treated as casing.
 */
export function normalizeManglish(input: string): string {
  let word = input
    .normalize("NFKC")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, MAX_INPUT_LENGTH);
  if (!word) return "";
  if (word === word.toUpperCase()) word = word.toLowerCase();
  word =
    word[0]!.toLowerCase() + word.slice(1).replace(/[BCFGHJKMPQSVWXYZ]/g, (c) => c.toLowerCase());
  // Stretched typing such as "sheriii" or "pooo" is still one long vowel.
  return word.replace(/([a-zA-Z])\1{2,}/g, "$1$1");
}

function tokenize(word: string): Unit[] {
  const units: Unit[] = [];
  let i = 0;

  while (i < word.length) {
    const rest = word.slice(i);
    const vowel = VOWEL_KEYS.find((key) => rest.startsWith(key));
    if (vowel) {
      units.push({ key: vowel, vowel: true });
      i += vowel.length;
      continue;
    }
    if (SINGLE_VOWELS.has(rest[0]!)) {
      units.push({ key: rest[0]!, vowel: true });
      i += 1;
      continue;
    }
    // Consonant + ru/ri may be the vocalic r: kri -> ക്രി or കൃ (കൃഷി, ഹൃദയം).
    if (/^r[ui](?![ui])/.test(rest) && units.length > 0 && !units.at(-1)!.vowel) {
      units.push({ key: rest.slice(0, 2), vowel: true });
      i += 2;
      continue;
    }
    // Word-final y after a consonant is a vowel: kutty -> കുട്ടി.
    if (rest === "y" && units.length > 0 && !units.at(-1)!.vowel) {
      units.push({ key: "i", vowel: true });
      i += 1;
      continue;
    }
    const consonant = CONSONANT_KEYS.find((key) => rest.startsWith(key)) ?? rest[0]!;
    units.push({ key: consonant, vowel: false });
    i += consonant.length;
  }

  return units;
}

interface BeamState {
  text: string;
  cost: number;
}

function extend(
  beam: BeamState[],
  pieces: Reading[],
  isKnownPrefix: ((text: string) => boolean) | undefined,
): BeamState[] {
  const best = new Map<string, number>();
  for (const state of beam) {
    for (const piece of pieces) {
      const text = state.text + piece.ml;
      const cost = state.cost + piece.cost;
      if (cost < (best.get(text) ?? Infinity)) best.set(text, cost);
    }
  }
  const states = [...best].map(([text, cost]) => ({ text, cost })).sort((a, b) => a.cost - b.cost);
  if (!isKnownPrefix) return states.slice(0, BEAM_WIDTH);

  const attested: BeamState[] = [];
  const other: BeamState[] = [];
  for (const state of states) {
    if (attested.length < ATTESTED_BEAM_WIDTH && isKnownPrefix(state.text.normalize("NFC"))) {
      attested.push(state);
    } else if (other.length < BEAM_WIDTH) {
      other.push(state);
    }
  }
  return [...attested, ...other].sort((a, b) => a.cost - b.cost);
}

/** Generate Malayalam spellings for one Manglish word, most typical first. */
export function generateMalayalamSpellings(
  input: string,
  { limit = 12, open = false, isKnownPrefix }: PhoneticOptions = {},
): PhoneticSpelling[] {
  const units = tokenize(normalizeManglish(input));
  if (units.length === 0) return [];

  let beam: BeamState[] = [{ text: "", cost: 0 }];

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!;
    const previous: Position = i === 0 ? "start" : units[i - 1]!.vowel ? "vowel" : "consonant";

    if (unit.vowel) {
      // Only reached for a vowel that does not follow a consonant.
      const final = !open && i === units.length - 1;
      beam = extend(beam, vowelReadings(unit.key, final).independent, isKnownPrefix);
      continue;
    }

    const nextUnit = units[i + 1];
    let next: Position = !nextUnit ? "end" : nextUnit.vowel ? "vowel" : "consonant";
    // An open (unfinished) word ends as if a vowel followed: just the bare consonant.
    const openEnding = open && next === "end";
    if (openEnding) next = "vowel";

    const readings = consonantReadings(unit.key, previous, next, nextUnit?.key);
    const pieces: Reading[] = [];

    for (const reading of readings) {
      if (reading.terminal) {
        if (next !== "vowel") pieces.push(reading);
      } else if (openEnding) {
        pieces.push(reading);
      } else if (next === "vowel") {
        const final = !open && i + 2 === units.length;
        for (const sign of vowelReadings(nextUnit!.key, final).sign) {
          pieces.push({ ml: reading.ml + sign.ml, cost: reading.cost + sign.cost });
        }
      } else {
        pieces.push({ ml: reading.ml + VIRAMA, cost: reading.cost });
      }
    }

    if (pieces.length === 0) {
      // Unknown letter: keep the beam intact rather than producing nothing.
      continue;
    }
    beam = extend(beam, pieces, isKnownPrefix);
    if (next === "vowel" && !openEnding) i += 1;
  }

  return beam
    .filter((state) => state.text.length > 0)
    .slice(0, Math.max(1, limit))
    .map(({ text, cost }) => ({ text: text.normalize("NFC"), cost: Math.round(cost * 100) / 100 }));
}
