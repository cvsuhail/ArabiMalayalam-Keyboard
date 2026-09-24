import { manglishToPhonemes, phonemesToKey } from "./phonemes";
import type { DictionaryEntry } from "./types";

/**
 * Demo Arabi Malayalam dictionary.
 *
 * DEVELOPMENT DATA ONLY. Every `target` below must be reviewed and replaced /
 * expanded with a verified Arabi Malayalam linguistic dataset before this app
 * is used for real publishing work. The lookup API below is intentionally the
 * only way the rest of the app reads dictionary data, so the dataset can be
 * swapped for a remote or bundled corpus without touching UI code.
 */

interface SeedEntry {
  source: string;
  target: string;
  alternatives?: string[];
  frequency: number;
  tags?: string[];
}

const SEED: SeedEntry[] = [
  { source: "enikku", target: "اِنِكُّ", alternatives: ["يِنِكُّ"], frequency: 0.95, tags: ["pronoun"] },
  { source: "njan", target: "ݧان", alternatives: ["نجان"], frequency: 0.96, tags: ["pronoun"] },
  { source: "ningal", target: "نِڹڰَڶ", frequency: 0.9, tags: ["pronoun"] },
  { source: "sukhamanu", target: "سُكھَمَاڹ", alternatives: ["سُكَمَاڹُ"], frequency: 0.85 },
  { source: "vellam", target: "وَيڶَّم", alternatives: ["وِڶَّم"], frequency: 0.8, tags: ["noun"] },
  { source: "veedu", target: "وِيڈ", alternatives: ["وِيڈُ"], frequency: 0.82, tags: ["noun"] },
  { source: "nanni", target: "نَنِّي", frequency: 0.88, tags: ["phrase"] },
  { source: "salam", target: "سَلَام", alternatives: ["السَّلَام"], frequency: 0.93, tags: ["arabic-origin"] },
  { source: "allah", target: "اللّٰه", frequency: 0.99, tags: ["arabic-origin"] },
  { source: "kithab", target: "كِتَاب", frequency: 0.87, tags: ["arabic-origin"] },
  { source: "madrasa", target: "مَدْرَسَة", frequency: 0.86, tags: ["arabic-origin"] },
  { source: "paatam", target: "پَاٹَم", frequency: 0.7, tags: ["noun"] },
  { source: "amma", target: "اَمَّا", alternatives: ["اُمَّا"], frequency: 0.9, tags: ["noun"] },
  { source: "uppa", target: "اُپَّا", frequency: 0.9, tags: ["noun"] },
  { source: "nalla", target: "نَلَّ", frequency: 0.84, tags: ["adjective"] },
  { source: "onnu", target: "اُونُّ", frequency: 0.75, tags: ["number"] },
  { source: "randu", target: "رَنْڈ", frequency: 0.75, tags: ["number"] },
  { source: "ippol", target: "اِپَّوڶ", frequency: 0.7 },
  { source: "vannu", target: "وَنُّ", frequency: 0.72, tags: ["verb"] },
  { source: "poyi", target: "پَويِ", frequency: 0.72, tags: ["verb"] },
  { source: "cheyyunnu", target: "چَييُّنُّ", frequency: 0.68, tags: ["verb"] },
  { source: "pusthakam", target: "پُسْتَكَم", frequency: 0.7, tags: ["noun"] },
  { source: "kutty", target: "كُٹِّي", frequency: 0.74, tags: ["noun"] },
  { source: "malayalam", target: "مَلَيَاڶَم", frequency: 0.8, tags: ["noun"] },
  { source: "keralam", target: "كِيرَڶَم", frequency: 0.78, tags: ["place"] },
  { source: "sthalam", target: "سْتَڶَم", frequency: 0.6, tags: ["noun"] },
  { source: "samayam", target: "سَمَيَم", frequency: 0.66, tags: ["noun"] },
  { source: "ariyaam", target: "اَرِيَام", frequency: 0.6, tags: ["verb"] },
  { source: "vaayikkuka", target: "وَايِكُّكَ", frequency: 0.58, tags: ["verb"] },
  { source: "ezhuthuka", target: "اَژُتُكَ", frequency: 0.58, tags: ["verb"] },
];

const entries: DictionaryEntry[] = SEED.map((seed, index) => ({
  id: `seed-${index}`,
  source: seed.source,
  normalized: phonemesToKey(manglishToPhonemes(seed.source)),
  target: seed.target,
  alternatives: seed.alternatives ?? [],
  frequency: seed.frequency,
  tags: seed.tags ?? [],
}));

const byNormalized = new Map<string, DictionaryEntry[]>();
for (const entry of entries) {
  const bucket = byNormalized.get(entry.normalized) ?? [];
  bucket.push(entry);
  byNormalized.set(entry.normalized, bucket);
}

export interface Dictionary {
  lookup(normalized: string): DictionaryEntry[];
  all(): DictionaryEntry[];
  size(): number;
}

/** Swap this implementation to move to a remote or larger local corpus. */
export const demoDictionary: Dictionary = {
  lookup: (normalized) => byNormalized.get(normalized) ?? [],
  all: () => entries,
  size: () => entries.length,
};
