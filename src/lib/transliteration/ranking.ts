import type { Candidate, DictionaryEntry, LearnedWord } from "./types";

/**
 * Candidate ranking. Considers exact dictionary match, dictionary frequency,
 * phonetic construction order, previous user selections (local learning) and
 * candidate compactness.
 */

export interface RankInput {
  /** Raw word the user typed. */
  input: string;
  /** Dictionary hits for the normalized key. */
  dictionaryHits: DictionaryEntry[];
  /** Phonetically generated spellings, best-constructed first. */
  phonetic: string[];
  learned: LearnedWord[];
  limit: number;
}

export function rankCandidates({
  input,
  dictionaryHits,
  phonetic,
  learned,
  limit,
}: RankInput): Candidate[] {
  const scores = new Map<string, Candidate>();

  const push = (candidate: Candidate) => {
    const existing = scores.get(candidate.text);
    if (!existing || existing.score < candidate.score) {
      scores.set(candidate.text, candidate);
    }
  };

  for (const entry of dictionaryHits) {
    push({ text: entry.target, score: 0.9 + entry.frequency * 0.1, origin: "dictionary" });
    entry.alternatives.forEach((alternative, index) =>
      push({
        text: alternative,
        score: 0.82 + entry.frequency * 0.06 - index * 0.02,
        origin: "dictionary",
      }),
    );
  }

  phonetic.forEach((text, index) => {
    push({ text, score: 0.7 - index * 0.03, origin: "phonetic" });
  });

  const lowerInput = input.toLowerCase();
  for (const word of learned) {
    if (word.input.toLowerCase() !== lowerInput) continue;
    const boost = Math.min(0.35, 0.08 * word.selectionCount);
    const existing = scores.get(word.target);
    push({
      text: word.target,
      score: (existing?.score ?? 0.6) + boost,
      origin: "learned",
    });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length)
    .slice(0, limit)
    .map((candidate) => ({
      ...candidate,
      score: Math.round(Math.min(candidate.score, 0.99) * 100) / 100,
    }));
}
