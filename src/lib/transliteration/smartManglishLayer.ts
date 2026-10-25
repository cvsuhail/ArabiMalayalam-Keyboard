/**
 * smartManglishLayer.ts
 *
 * The keyboard's ranking layer: Manglish -> ranked Malayalam -> Arabi-Malayalam.
 *
 *   Roman input
 *     -> Malayalam candidates from user learning, curated overrides, registered
 *        Roman/Malayalam pairs, an optional model provider and the phonetic
 *        generator (scored against the word-frequency lexicon)
 *     -> whole-word completions from the lexicon
 *     -> Arabi-Malayalam rendering (Arabic loanword spelling or the rule engine)
 *
 * Ranking happens on Malayalam words, never on Arabic strings: there are far
 * fewer Malayalam spellings to learn, and every Arabic form is then rendered
 * by one consistent engine.
 */

import {
  arabicInputCandidates,
  convertMalayalamToArabiMalayalam,
  MANGLISH_TO_MALAYALAM_MAP,
  openMalayalamPrefixes,
  PHONETIC_COST_WEIGHT,
  phoneticMalayalamCandidates,
  transliterateToArabic,
} from "./enhancedTransliterator.ts";
import {
  lexiconBoost,
  lexiconCompletions,
  loadLexicon as loadBundledLexicon,
  registerLexiconEntries,
  spellingPlausibility,
} from "./malayalamLexicon.ts";
import { arabicLoanwordForRoman, arabicSpellingForMalayalam } from "./arabicLoanwords.ts";

export type CandidateSource =
  "user" | "override" | "lexicon" | "model" | "phonetic" | "completion" | "typed";

export interface SmartCandidate {
  text: string; // final Arabi-Malayalam text
  malayalam?: string; // intermediate Malayalam candidate
  score: number;
  source: CandidateSource;
}

export interface MalayalamCandidate {
  text: string;
  score?: number;
}

export interface BulkLexiconEntry {
  roman: string;
  malayalam: string;
  frequency?: number;
}

export interface MalayalamContextEntry {
  previousMalayalam: string;
  malayalam: string;
  frequency: number;
}

export interface SmartContext {
  previousMalayalam?: string;
}

export type MalayalamProvider = (
  roman: string,
  limit: number,
  context?: SmartContext,
) => Promise<MalayalamCandidate[]>;

/* -------------------------------------------------------------------------- */
/*                                RUNTIME DATA                                */
/* -------------------------------------------------------------------------- */

const ROMAN_TO_MALAYALAM = new Map<string, Map<string, number>>();
const MALAYALAM_CONTEXT_FREQUENCY = new Map<string, Map<string, number>>();
const USER_PREFERENCES = new Map<string, Map<string, number>>();
const ARABI_PREFERENCES = new Map<string, string>();
const MODEL_CACHE = new Map<string, MalayalamCandidate[]>();

/** Preferred mark for Malayalam o/ō: inverted damma ٗ (default) or plain damma ُ. */
let oStyle: "inverted" | "plain" = "inverted";

let externalMalayalamProvider: MalayalamProvider | null = null;

const MAX_ROMAN_VARIANTS = 12;
/**
 * Many Manglish spellings fit several words (padam: പടം, പാടം, പാഠം, പദം), so
 * the list is long enough to hold the word the user meant, not just our best guess.
 */
const DEFAULT_LIMIT = 10;
const MAX_COMPLETIONS = 3;
/** Phonetic spellings scored per word; the lexicon decides which surface. */
const PHONETIC_POOL = 20;
/**
 * Spellings the word list doesn't know can still be real words (പാടം, വാള,
 * നടു are missing from the subtitle corpus), so a few always stay in the list.
 */
const MAX_UNLISTED_WITH_KNOWN = 3;
const MAX_UNLISTED_ALONE = 6;
/**
 * An unknown spelling is shown only as a direct reading of what was typed
 * (ല/ള, ന/ണ, ര/റ choices). Stretching a short vowel (vala -> വലാ) must land
 * on a known word to be worth a slot.
 */
const MAX_UNLISTED_COST = 1;
const INTERACTIVE_PROVIDER_TIMEOUT_MS = 180;

export function setMalayalamProvider(provider: MalayalamProvider | null): void {
  externalMalayalamProvider = provider;
  MODEL_CACHE.clear();
}

/** Fetch the bundled Malayalam word-frequency list (browser only). */
export function loadLexicon(): Promise<void> {
  return loadBundledLexicon();
}

/**
 * Register Roman/Malayalam pairs in chunks, e.g. a frequent subset of a
 * transliteration corpus. Very large datasets belong behind a model provider.
 */
export function registerManglishLexicon(entries: BulkLexiconEntry[]): void {
  const frequencies: Array<{ malayalam: string; frequency: number }> = [];

  for (const entry of entries) {
    const roman = normalizeRoman(entry.roman);
    const ml = normalizeMalayalam(entry.malayalam);
    if (!roman || !ml) continue;

    const frequency = Math.max(1, entry.frequency ?? 1);

    let bucket = ROMAN_TO_MALAYALAM.get(roman);
    if (!bucket) {
      bucket = new Map<string, number>();
      ROMAN_TO_MALAYALAM.set(roman, bucket);
    }
    bucket.set(ml, Math.max(bucket.get(ml) ?? 0, frequency));
    frequencies.push({ malayalam: ml, frequency });
  }

  registerLexiconEntries(frequencies);
}

/** Malayalam-only word frequencies, used to rank outputs from every source. */
export function registerMalayalamFrequencies(
  entries: Array<{ malayalam: string; frequency: number }>,
): void {
  registerLexiconEntries(entries);
}

/** Register Malayalam bigram counts for previous-word context ranking. */
export function registerMalayalamContext(entries: MalayalamContextEntry[]): void {
  for (const entry of entries) {
    const previous = normalizeMalayalam(entry.previousMalayalam);
    const current = normalizeMalayalam(entry.malayalam);
    if (!previous || !current) continue;

    let bucket = MALAYALAM_CONTEXT_FREQUENCY.get(previous);
    if (!bucket) {
      bucket = new Map<string, number>();
      MALAYALAM_CONTEXT_FREQUENCY.set(previous, bucket);
    }
    bucket.set(current, Math.max(bucket.get(current) ?? 0, Math.max(1, entry.frequency)));
  }
}

/* -------------------------------------------------------------------------- */
/*                              USER LEARNING                                 */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "arabi-malayalam:user-preferences:v1";
const ARABI_STORAGE_KEY = "arabi-malayalam:arabi-preferences:v1";
const O_STYLE_STORAGE_KEY = "arabi-malayalam:o-style:v1";

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadUserPreferences(): void {
  const store = storage();
  if (!store) return;

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Record<string, number>>;
      USER_PREFERENCES.clear();
      for (const [roman, values] of Object.entries(parsed)) {
        const bucket = new Map<string, number>();
        for (const [ml, count] of Object.entries(values)) {
          bucket.set(ml, Number(count) || 1);
        }
        USER_PREFERENCES.set(roman, bucket);
      }
    }

    const rawArabi = store.getItem(ARABI_STORAGE_KEY);
    if (rawArabi) {
      ARABI_PREFERENCES.clear();
      for (const [ml, arabi] of Object.entries(JSON.parse(rawArabi) as Record<string, string>)) {
        ARABI_PREFERENCES.set(ml, arabi);
      }
    }

    oStyle = store.getItem(O_STYLE_STORAGE_KEY) === "plain" ? "plain" : "inverted";
  } catch {
    // Ignore corrupt/blocked localStorage.
  }
}

function persistUserPreferences(): void {
  const store = storage();
  if (!store) return;

  try {
    const output: Record<string, Record<string, number>> = {};
    for (const [roman, bucket] of USER_PREFERENCES) {
      output[roman] = Object.fromEntries(bucket);
    }
    store.setItem(STORAGE_KEY, JSON.stringify(output));
    store.setItem(ARABI_STORAGE_KEY, JSON.stringify(Object.fromEntries(ARABI_PREFERENCES)));
    store.setItem(O_STYLE_STORAGE_KEY, oStyle);
  } catch {
    // Ignore quota/privacy-mode errors.
  }
}

/**
 * Call this when the user picks a suggestion. The chosen Malayalam word ranks
 * higher for that Roman spelling next time. Picking a word in the other
 * o-mark style switches the style for every word; picking any other
 * non-default spelling (e.g. the phonetic form instead of an Arabic loanword
 * spelling) makes it that word's first form.
 */
export function learnSelection(romanInput: string, malayalam: string, arabi?: string): void {
  const roman = normalizeRoman(romanInput);
  const ml = normalizeMalayalam(malayalam);
  if (!ml) return;

  if (roman) {
    let bucket = USER_PREFERENCES.get(roman);
    if (!bucket) {
      bucket = new Map<string, number>();
      USER_PREFERENCES.set(roman, bucket);
    }
    bucket.set(ml, (bucket.get(ml) ?? 0) + 1);
  }
  if (arabi) {
    const chosen = arabi.normalize("NFC");
    const [inverted, plain] = convertMalayalamToArabiMalayalam(ml).map((t) => t.normalize("NFC"));
    if (plain && chosen === plain) oStyle = "plain";
    else if (plain && chosen === inverted) oStyle = "inverted";

    const isEngineForm = chosen === inverted || chosen === plain;
    const defaultFirst =
      arabicSpellingForMalayalam(ml)?.normalize("NFC") ?? (isEngineForm ? chosen : "");
    if (chosen === defaultFirst) ARABI_PREFERENCES.delete(ml);
    else ARABI_PREFERENCES.set(ml, chosen);
  }
  persistUserPreferences();
}

/* -------------------------------------------------------------------------- */
/*                              NORMALIZATION                                  */
/* -------------------------------------------------------------------------- */

export function normalizeRoman(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[^a-z']/g, "");
}

function normalizeMalayalam(input: string): string {
  return input.normalize("NFC").trim();
}

const MALAYALAM_RE = /[ഀ-ൿ]/u;
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿ]/u;

/**
 * Generate common typing variations for registered Roman/Malayalam pairs
 * without exploding the search space (njaan -> njan, cheyyunnu -> cheyunnu).
 */
export function generateRomanVariants(input: string): string[] {
  const base = normalizeRoman(input);
  if (!base) return [];

  const out = new Set<string>([base]);
  const add = (v: string) => {
    if (v && out.size < MAX_ROMAN_VARIANTS) out.add(v);
  };

  add(base.replace(/aa/g, "a"));
  add(base.replace(/ee/g, "i"));
  add(base.replace(/ii/g, "i"));
  add(base.replace(/oo/g, "u"));
  add(base.replace(/uu/g, "u"));
  if (base.includes("i")) add(base.replace(/i/g, "ee"));
  if (base.includes("u")) add(base.replace(/u/g, "oo"));
  add(base.replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, "$1"));
  add(base.replace(/nj/g, "gn"));
  add(base.replace(/gn/g, "nj"));
  add(base.replace(/zh/g, "z"));
  add(base.replace(/yy/g, "y"));

  return [...out].slice(0, MAX_ROMAN_VARIANTS);
}

/* -------------------------------------------------------------------------- */
/*                                  SCORING                                    */
/* -------------------------------------------------------------------------- */

/**
 * Base scores per source. Every Malayalam candidate also receives the lexicon
 * frequency boost (0, or roughly 160-310 for attested words), so the bases are
 * spaced to keep user choices first and curated overrides above guesses.
 */
const SOURCE_BASE: Record<CandidateSource, number> = {
  user: 1500,
  override: 1080,
  lexicon: 760,
  model: 700,
  phonetic: 560,
  completion: 400,
  typed: 0,
};

/** Per-letter log-probability between real words (≈ -2.4) and junk (≈ -3.4). */
const PLAUSIBLE_SPELLING = -2.9;
const SHAPE_WEIGHT = 60;

/** Ranking nudge for a spelling the lexicon lacks: up if it looks like Malayalam. */
function unlistedShapeBonus(ml: string): number {
  const plausibility = spellingPlausibility(ml);
  if (!plausibility) return 0;
  return Math.max(-90, Math.min(90, (plausibility - PLAUSIBLE_SPELLING) * SHAPE_WEIGHT));
}

function contextBoost(previousMalayalam: string | undefined, ml: string): number {
  if (!previousMalayalam) return 0;
  const previous = normalizeMalayalam(previousMalayalam);
  const frequency = MALAYALAM_CONTEXT_FREQUENCY.get(previous)?.get(ml) ?? 0;
  return frequency ? Math.min(110, Math.log10(frequency + 1) * 24) : 0;
}

interface RankedMalayalam {
  text: string;
  score: number;
  source: CandidateSource;
}

async function fetchModelCandidates(
  normalized: string,
  context: SmartContext,
): Promise<MalayalamCandidate[]> {
  if (!externalMalayalamProvider) return [];

  try {
    const cacheKey = `${normalized}:8:${context.previousMalayalam ?? ""}`;
    const cached = MODEL_CACHE.get(cacheKey);
    if (cached) return cached;

    const request = externalMalayalamProvider(normalized, 8, context)
      .then((outputs) => {
        MODEL_CACHE.set(cacheKey, outputs);
        return outputs;
      })
      .catch(() => []);
    const outputs = await Promise.race([
      request,
      new Promise<undefined>((resolve) =>
        setTimeout(() => resolve(undefined), INTERACTIVE_PROVIDER_TIMEOUT_MS),
      ),
    ]);
    return outputs ?? [];
  } catch {
    // Network/model errors must never break keyboard typing.
    return [];
  }
}

/** Rank Malayalam candidates for a Roman word. Completions are flagged by source. */
function rankMalayalam(
  input: string,
  context: SmartContext,
  modelOutputs: MalayalamCandidate[],
): RankedMalayalam[] {
  const normalized = normalizeRoman(input);
  const ranked = new Map<string, RankedMalayalam>();

  const add = (ml: string, score: number, source: CandidateSource) => {
    const text = normalizeMalayalam(ml);
    if (!text || /[A-Za-z]/.test(text)) return;
    const finalScore =
      SOURCE_BASE[source] +
      score +
      lexiconBoost(text) +
      contextBoost(context.previousMalayalam, text);
    const previous = ranked.get(text);
    if (!previous || finalScore > previous.score) {
      ranked.set(text, { text, score: finalScore, source });
    }
  };

  /* 1. User selections */
  for (const [ml, count] of USER_PREFERENCES.get(normalized) ?? []) {
    add(ml, Math.min(100, count * 12), "user");
  }

  /* 2. Curated overrides */
  (MANGLISH_TO_MALAYALAM_MAP[normalized] ?? []).forEach((ml, index) => {
    add(ml, -index * 8, "override");
  });

  /* 3. Registered Roman/Malayalam pairs */
  generateRomanVariants(input).forEach((variant, variantIndex) => {
    const bucket = ROMAN_TO_MALAYALAM.get(variant);
    if (!bucket) return;
    [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .forEach(([ml, frequency], rank) => {
        const corpusBoost = Math.min(75, Math.log10(frequency + 1) * 15);
        add(ml, corpusBoost - variantIndex * 9 - rank * 5, "lexicon");
      });
  });

  /* 4. Optional model provider */
  modelOutputs.forEach((candidate, index) => {
    add(candidate.text, (candidate.score ?? 0) - index * 12, "model");
  });

  /* 5. Phonetic generator (add() applies the lexicon boost). Spellings the
        lexicon doesn't know are ordered by how Malayalam-like they look. */
  for (const candidate of phoneticMalayalamCandidates(input, PHONETIC_POOL)) {
    const known = lexiconBoost(candidate.text) > 0;
    if (!known && candidate.cost >= MAX_UNLISTED_COST) continue;
    const shape = known ? 0 : unlistedShapeBonus(candidate.text);
    add(candidate.text, -candidate.cost * PHONETIC_COST_WEIGHT + shape, "phonetic");
  }

  /* 6. Whole-word completions for an unfinished word */
  if (normalized.length >= 3) {
    const seen = new Set<string>();
    for (const prefix of openMalayalamPrefixes(input, 3)) {
      for (const completion of lexiconCompletions(prefix, MAX_COMPLETIONS)) {
        if (ranked.has(completion.text) || seen.has(completion.text)) continue;
        seen.add(completion.text);
        const extraLength = Array.from(completion.text).length - Array.from(prefix).length;
        add(completion.text, -extraLength * 6, "completion");
      }
    }
  }

  // Spellings the lexicon doesn't know rank below known words; keep only the
  // cheapest few so the list isn't filled with near-identical guesses.
  const sorted = [...ranked.values()].sort((a, b) => b.score - a.score);
  const isGuess = (candidate: RankedMalayalam) =>
    candidate.source === "phonetic" && lexiconBoost(candidate.text) === 0;
  const maxGuesses = sorted.some((candidate) => !isGuess(candidate))
    ? MAX_UNLISTED_WITH_KNOWN
    : MAX_UNLISTED_ALONE;
  let guesses = 0;
  return sorted.filter((candidate) => !isGuess(candidate) || guesses++ < maxGuesses);
}

/**
 * Ranked Malayalam candidates for a Roman word (user learning, overrides,
 * registered pairs, model provider, phonetic rules). Completions excluded.
 */
export async function getMalayalamCandidates(
  input: string,
  limit = 10,
  context: SmartContext = {},
): Promise<Array<{ text: string; score: number; source: CandidateSource }>> {
  const normalized = normalizeRoman(input);
  if (!normalized) return [];
  const modelOutputs = await fetchModelCandidates(normalized, context);
  return rankMalayalam(input, context, modelOutputs)
    .filter((candidate) => candidate.source !== "completion")
    .slice(0, Math.max(1, limit));
}

/* -------------------------------------------------------------------------- */
/*                     MALAYALAM -> ARABI-MALAYALAM                           */
/* -------------------------------------------------------------------------- */

/**
 * Arabi-Malayalam forms of one Malayalam word with their score offsets, plus
 * the same spelling in the other o-mark style (ٗ vs ُ), if it differs.
 */
function getArabiForms(ml: string): {
  forms: Array<{ text: string; offset: number }>;
  alternateStyle?: string;
} {
  const forms: Array<{ text: string; offset: number }> = [];
  const add = (text: string, offset: number) => {
    const normalized = text.normalize("NFC");
    if (normalized && !forms.some((form) => form.text === normalized)) {
      forms.push({ text: normalized, offset });
    }
  };

  const preferred = ARABI_PREFERENCES.get(ml);
  if (preferred) add(preferred, 30);

  const loanword = arabicSpellingForMalayalam(ml);
  if (loanword) add(loanword, 20);

  let alternateStyle: string | undefined;
  try {
    const [inverted, plain] = convertMalayalamToArabiMalayalam(ml);
    const [first, second] = oStyle === "plain" && plain ? [plain, inverted] : [inverted, plain];
    if (first) add(first, 0);
    if (second && !forms.some((form) => form.text === second.normalize("NFC"))) {
      alternateStyle = second.normalize("NFC");
    }
  } catch {
    // Ignore converter failure for one candidate.
  }
  return alternateStyle ? { forms, alternateStyle } : { forms };
}

/**
 * Assemble the final list: best literal candidate first (Space commits it),
 * at most MAX_COMPLETIONS completions, the top word in the other o-mark style
 * (so either style is one tap away), and the typed text last.
 */
function finalize(
  candidates: SmartCandidate[],
  typed: string,
  limit: number,
  alternateStyle?: SmartCandidate,
): SmartCandidate[] {
  const best = new Map<string, SmartCandidate>();
  for (const candidate of candidates) {
    const previous = best.get(candidate.text);
    if (!previous || candidate.score > previous.score) best.set(candidate.text, candidate);
  }

  let ranked = [...best.values()].sort((a, b) => b.score - a.score);
  const firstLiteral = ranked.findIndex((candidate) => candidate.source !== "completion");
  if (firstLiteral > 0) {
    ranked = [ranked[firstLiteral]!, ...ranked.filter((_, index) => index !== firstLiteral)];
  }

  let completions = 0;
  ranked = ranked.filter((candidate) => {
    if (candidate.text === typed) return false;
    if (candidate.source !== "completion") return true;
    completions += 1;
    return completions <= MAX_COMPLETIONS;
  });

  if (limit <= 1) return ranked.slice(0, Math.max(1, limit));

  const typedCandidate: SmartCandidate = { text: typed, score: 0, source: "typed" };
  if (alternateStyle && limit > 2 && !ranked.some((c) => c.text === alternateStyle.text)) {
    return [...ranked.slice(0, limit - 2), alternateStyle, typedCandidate];
  }
  return [...ranked.slice(0, limit - 1), typedCandidate];
}

function renderMalayalamCandidates(ranked: RankedMalayalam[]): {
  candidates: SmartCandidate[];
  alternateStyle?: SmartCandidate;
} {
  // The alternate o-style belongs to the word Space would commit: the best
  // non-completion candidate (finalize() moves it to the front).
  const topLiteral = ranked.find((candidate) => candidate.source !== "completion");
  let alternateStyle: SmartCandidate | undefined;
  const candidates = ranked.flatMap((candidate) => {
    const { forms, alternateStyle: alternate } = getArabiForms(candidate.text);
    if (candidate === topLiteral && alternate) {
      alternateStyle = {
        text: alternate,
        malayalam: candidate.text,
        score: 1,
        source: candidate.source,
      };
    }
    return forms.map(({ text, offset }) => ({
      text,
      malayalam: candidate.text,
      score: candidate.score + offset,
      source: candidate.source,
    }));
  });
  return alternateStyle ? { candidates, alternateStyle } : { candidates };
}

/**
 * Main keyboard function: ranked Arabi-Malayalam candidates for one word of
 * Manglish, Malayalam or Arabic input. The last candidate is the typed text.
 */
export async function getSmartTransliterationCandidates(
  input: string,
  limit = DEFAULT_LIMIT,
  context: SmartContext = {},
): Promise<SmartCandidate[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (MALAYALAM_RE.test(trimmed)) {
    const word = normalizeMalayalam(trimmed);
    const ranked: RankedMalayalam[] = [
      { text: word, score: SOURCE_BASE.override + lexiconBoost(word), source: "override" },
      ...lexiconCompletions(word, MAX_COMPLETIONS, 2).map((completion) => ({
        text: completion.text,
        score: SOURCE_BASE.completion + lexiconBoost(completion.text),
        source: "completion" as const,
      })),
    ];
    const { candidates, alternateStyle } = renderMalayalamCandidates(ranked);
    return finalize(candidates, trimmed, limit, alternateStyle);
  }

  if (ARABIC_RE.test(trimmed)) {
    const options = arabicInputCandidates(trimmed).filter((text) => text !== trimmed);
    return finalize(
      options.map((text, index) => ({ text, score: 1000 - index * 5, source: "override" })),
      trimmed,
      limit,
    );
  }

  // Digits or symbols inside a word: nothing sensible to transliterate.
  if (/[^A-Za-z'’]/.test(trimmed) || !normalizeRoman(trimmed)) {
    return finalize([], trimmed, limit);
  }

  const normalized = normalizeRoman(trimmed);
  const modelOutputs = await fetchModelCandidates(normalized, context);
  const { candidates, alternateStyle } = renderMalayalamCandidates(
    rankMalayalam(trimmed, context, modelOutputs),
  );

  /* Arabic loanwords typed in Manglish (salam, swalath) */
  const loanword = arabicLoanwordForRoman(normalized);
  if (loanword) {
    candidates.push({
      text: loanword.arabic,
      malayalam: loanword.malayalam,
      score: SOURCE_BASE.override + 350,
      source: "override",
    });
  }

  return finalize(candidates, trimmed, limit, alternateStyle);
}

/* -------------------------------------------------------------------------- */
/*                          WHOLE-TEXT TRANSLITERATION                         */
/* -------------------------------------------------------------------------- */

const TOKEN_PATTERN =
  /https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const MALAYALAM_WORD = /[ഀ-ൿ‌‍]+/gu;

const isLinkOrEmail = (token: string) =>
  /^(?:https?:\/\/|www\.)/i.test(token) || token.includes("@");

/** Convert Malayalam text: Arabic loanwords keep their Arabic spelling. */
export function transliterateMalayalamText(input: string): string {
  const withLoanwords = input
    .normalize("NFC")
    .replace(MALAYALAM_WORD, (word) => arabicSpellingForMalayalam(word) ?? word);
  return transliterateToArabic(withLoanwords);
}

/**
 * Convert pasted (or dictated) text: Malayalam and Manglish words become
 * Arabi-Malayalam while URLs, e-mails, Arabic, punctuation and layout are kept.
 */
export async function transliterateSmartPastedText(input: string): Promise<string> {
  if (!input) return input;

  const source = transliterateMalayalamText(input);
  const matches = [...source.matchAll(TOKEN_PATTERN)];
  const conversions = new Map<string, Promise<string>>();

  for (const [token] of matches) {
    if (isLinkOrEmail(token)) continue;
    const key = normalizeRoman(token);
    if (!conversions.has(key)) {
      conversions.set(
        key,
        getSmartTransliterationCandidates(token, 1).then(
          (candidates) => candidates[0]?.text ?? token,
        ),
      );
    }
  }

  const resolved = new Map<string, string>();
  await Promise.all(
    [...conversions].map(async ([key, conversion]) => {
      resolved.set(key, await conversion);
    }),
  );

  let output = "";
  let lastIndex = 0;
  for (const match of matches) {
    const token = match[0];
    const index = match.index ?? 0;
    output += source.slice(lastIndex, index);
    output += isLinkOrEmail(token) ? token : (resolved.get(normalizeRoman(token)) ?? token);
    lastIndex = index + token.length;
  }
  return output + source.slice(lastIndex);
}

/* -------------------------------------------------------------------------- */
/*                     EXAMPLE EXTERNAL MODEL PROVIDER                         */
/* -------------------------------------------------------------------------- */

/**
 * Adapter for your own backend (e.g. IndicXlit), keeping large models and
 * datasets out of the browser. Expected response:
 *
 *   { "candidates": [{ "text": "ഞാൻ", "score": 1.0 }, { "text": "ജാൻ", "score": 0.73 }] }
 */
export function createHttpMalayalamProvider(endpoint: string): MalayalamProvider {
  return async (roman, limit, context) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: roman, language: "ml", limit, context }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Transliteration provider failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      candidates?: MalayalamCandidate[];
    };

    return Array.isArray(json.candidates) ? json.candidates.slice(0, limit) : [];
  };
}
