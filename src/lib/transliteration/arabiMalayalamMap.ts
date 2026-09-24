import type { GraphemeMapping } from "./types";

/**
 * Arabi Malayalam grapheme mapping.
 *
 * IMPORTANT (linguistic review required):
 * These mappings are a working development dataset. Arabi Malayalam is an
 * Arabic-derived script with additional letters for Malayalam-only sounds;
 * regional and historical orthographies differ. Before production release
 * these tables MUST be reviewed and expanded with verified Arabi Malayalam
 * language data. All mapping lives here — no mapping is hardcoded elsewhere.
 */

/** Arabic diacritics used for short vowels. */
export const HARAKAT = {
  fatha: "\u064E",
  kasra: "\u0650",
  damma: "\u064F",
  sukun: "\u0652",
  shadda: "\u0651",
} as const;

/** Consonant phoneme -> Arabi Malayalam letter(s). */
export const CONSONANT_GRAPHEMES: Record<string, GraphemeMapping> = {
  ka: { primary: "ك" },
  kha: { primary: "كھ", alternatives: ["خ"] },
  ga: { primary: "ڰ", alternatives: ["گ"] },
  gha: { primary: "ڰھ", alternatives: ["غ"] },
  nga: { primary: "ڞ", alternatives: ["نڠ", "ن"] },
  cha: { primary: "چ" },
  chha: { primary: "چھ" },
  ja: { primary: "ج" },
  jha: { primary: "جھ" },
  nja: { primary: "ݧ", alternatives: ["نج"] },
  Tta: { primary: "ٹ", alternatives: ["ڊ"] },
  Ttha: { primary: "ٹھ" },
  Dda: { primary: "ڈ", alternatives: ["ڍ"] },
  Ddha: { primary: "ڈھ" },
  Nna: { primary: "ڹ", alternatives: ["ن"] },
  tha: { primary: "ت", alternatives: ["ث"] },
  thha: { primary: "تھ" },
  da: { primary: "د", alternatives: ["ذ"] },
  dha: { primary: "دھ" },
  na: { primary: "ن" },
  pa: { primary: "پ" },
  pha: { primary: "ف", alternatives: ["پھ"] },
  ba: { primary: "ب" },
  bha: { primary: "بھ" },
  ma: { primary: "م" },
  ya: { primary: "ي" },
  ra: { primary: "ر" },
  rra: { primary: "ڔ", alternatives: ["ر"] },
  la: { primary: "ل" },
  lla: { primary: "ڶ", alternatives: ["ل"] },
  zha: { primary: "ژ", alternatives: ["ز"] },
  va: { primary: "و" },
  sha: { primary: "ش" },
  ssa: { primary: "ښ", alternatives: ["ش"] },
  sa: { primary: "س", alternatives: ["ص"] },
  ha: { primary: "ه", alternatives: ["ح"] },
  za: { primary: "ز", alternatives: ["ذ"] },
  ksha: { primary: "كش", alternatives: ["كښ"] },
};

/** Vowel phoneme -> mark that follows a consonant. */
export const VOWEL_MARKS: Record<string, GraphemeMapping> = {
  a: { primary: HARAKAT.fatha },
  aa: { primary: `${HARAKAT.fatha}ا` },
  i: { primary: HARAKAT.kasra },
  ii: { primary: `${HARAKAT.kasra}ي` },
  u: { primary: HARAKAT.damma },
  uu: { primary: `${HARAKAT.damma}و` },
  e: { primary: `${HARAKAT.fatha}ي`, alternatives: [HARAKAT.kasra] },
  ee: { primary: `${HARAKAT.kasra}ي` },
  ai: { primary: `${HARAKAT.fatha}ي` },
  o: { primary: `${HARAKAT.fatha}و`, alternatives: [HARAKAT.damma] },
  oo: { primary: `${HARAKAT.damma}و` },
  au: { primary: `${HARAKAT.fatha}و` },
  ru: { primary: `${HARAKAT.kasra}ر` },
};

/** Vowel phoneme -> standalone (word-initial) form. */
export const INITIAL_VOWELS: Record<string, GraphemeMapping> = {
  a: { primary: `ا${HARAKAT.fatha}` },
  aa: { primary: "آ", alternatives: [`ا${HARAKAT.fatha}ا`] },
  i: { primary: `ا${HARAKAT.kasra}` },
  ii: { primary: `ا${HARAKAT.kasra}ي` },
  u: { primary: `ا${HARAKAT.damma}` },
  uu: { primary: `ا${HARAKAT.damma}و` },
  e: { primary: `ا${HARAKAT.fatha}ي`, alternatives: [`ا${HARAKAT.kasra}`] },
  ee: { primary: `ا${HARAKAT.kasra}ي` },
  ai: { primary: `ا${HARAKAT.fatha}ي` },
  o: { primary: `ا${HARAKAT.fatha}و` },
  oo: { primary: `ا${HARAKAT.damma}و` },
  au: { primary: `ا${HARAKAT.fatha}و` },
  ru: { primary: `ا${HARAKAT.kasra}ر` },
};

/** Characters commonly needed by the on-screen Arabi Malayalam palette. */
export const PALETTE_GROUPS: Array<{ label: string; chars: string[] }> = [
  {
    label: "Letters",
    chars: [
      "ا",
      "ب",
      "ت",
      "ث",
      "ج",
      "چ",
      "ح",
      "خ",
      "د",
      "ذ",
      "ر",
      "ڔ",
      "ز",
      "ژ",
      "س",
      "ش",
      "ښ",
      "ص",
      "ض",
      "ط",
      "ظ",
      "ع",
      "غ",
      "ف",
      "ق",
      "ك",
      "ڰ",
      "ل",
      "ڶ",
      "م",
      "ن",
      "ڹ",
      "ه",
      "و",
      "ي",
      "پ",
      "ٹ",
      "ڈ",
      "ݧ",
      "ڞ",
    ],
  },
  {
    label: "Marks",
    chars: [
      HARAKAT.fatha,
      HARAKAT.kasra,
      HARAKAT.damma,
      HARAKAT.sukun,
      HARAKAT.shadda,
      "\u0653",
      "\u0654",
      "ٱ",
      "آ",
      "ء",
    ],
  },
  { label: "Punctuation", chars: ["،", "؛", "؟", "۔", "٫", "«", "»"] },
];
