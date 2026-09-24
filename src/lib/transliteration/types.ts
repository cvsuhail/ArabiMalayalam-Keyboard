/**
 * Core types for the ArabiType transliteration pipeline.
 *
 * Pipeline: input text -> tokenization -> phonetic normalization ->
 * candidate generation -> Arabi Malayalam grapheme mapping ->
 * dictionary ranking -> suggestion list.
 */

export type InputMode = "manglish" | "malayalam" | "english";

export type PhonemeKind =
  | "vowel"
  | "consonant"
  | "chillu"
  | "anusvara"
  | "gemination"
  | "other";

/** A normalized phonetic unit, independent of any script. */
export interface Phoneme {
  /** Stable phoneme id, e.g. "ka", "aa", "nn". */
  id: string;
  kind: PhonemeKind;
  /** Inherent vowel attached to a consonant, if any. */
  vowel?: string | undefined;
  /** Source graphemes this phoneme came from (for diagnostics). */
  source?: string | undefined;
}

/** Grapheme options for a phoneme in the Arabi Malayalam script. */
export interface GraphemeMapping {
  primary: string;
  alternatives?: string[] | undefined;
}

export interface DictionaryEntry {
  id: string;
  /** Raw source spelling (manglish or malayalam). */
  source: string;
  /** Phonetically normalized key used for lookup. */
  normalized: string;
  /** Preferred Arabi Malayalam form. */
  target: string;
  alternatives: string[];
  /** Relative usage frequency, 0..1. */
  frequency: number;
  tags: string[];
}

export interface Candidate {
  text: string;
  score: number;
  /** Where the candidate came from, useful for debugging and UI hints. */
  origin: "dictionary" | "phonetic" | "learned" | "input";
}

export interface Suggestion {
  text: string;
  score: number;
  origin: Candidate["origin"];
}

export interface LearnedWord {
  input: string;
  target: string;
  selectionCount: number;
  updatedAt: number;
}

export interface SuggestOptions {
  mode: InputMode;
  limit?: number | undefined;
  /** Previous word, reserved for context-aware ranking. */
  previousWord?: string | undefined;
  learned?: LearnedWord[] | undefined;
}
