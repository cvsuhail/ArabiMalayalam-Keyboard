import { generateCandidates } from "./candidateGenerator";
import { demoDictionary } from "./dictionary";
import {
  malayalamToPhonemes,
  manglishToPhonemes,
  phonemesToKey,
} from "./phonemes";
import { rankCandidates } from "./ranking";
import type { InputMode, Phoneme, SuggestOptions, Suggestion } from "./types";

export const MALAYALAM_RE = /[\u0D00-\u0D7F]/;
export const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/** Detect which source script a chunk of text is written in. */
export function detectSourceMode(text: string): InputMode {
  if (MALAYALAM_RE.test(text)) return "malayalam";
  return "manglish";
}

export function toPhonemes(word: string, mode: InputMode): Phoneme[] {
  if (mode === "malayalam" || MALAYALAM_RE.test(word)) {
    return malayalamToPhonemes(word);
  }
  return manglishToPhonemes(word);
}

/** Suggestions for a single word. Runs fully locally and synchronously. */
export function suggestWord(
  word: string,
  { mode, limit = 6, learned = [] }: SuggestOptions,
): Suggestion[] {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const phonemes = toPhonemes(trimmed, mode);
  const key = phonemesToKey(phonemes);
  const dictionaryHits = demoDictionary.lookup(key);
  const phonetic = generateCandidates(phonemes);

  const ranked = rankCandidates({
    input: trimmed,
    dictionaryHits,
    phonetic,
    learned,
    limit: Math.max(1, limit - 1),
  });

  // Last row is always the untouched input, so nothing is ever forced.
  return [...ranked, { text: trimmed, score: 0, origin: "input" as const }];
}

/** Convert a full block of text word by word, taking the top candidate. */
export function convertText(
  text: string,
  mode: InputMode,
  learned: SuggestOptions["learned"] = [],
): string {
  return text.replace(/[\p{L}\p{M}']+/gu, (word) => {
    if (ARABIC_RE.test(word)) return word;
    const [best] = suggestWord(word, { mode, limit: 2, learned });
    return best?.text ?? word;
  });
}

export { demoDictionary } from "./dictionary";
export { phonemesToKey } from "./phonemes";
export type { InputMode, Suggestion, LearnedWord } from "./types";
