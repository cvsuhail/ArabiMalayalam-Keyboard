/**
 * smartManglishLayer.ts
 *
 * Drop-in "brain" layer for a Manglish -> Malayalam -> Arabi-Malayalam keyboard.
 *
 * It is designed to sit ABOVE your current:
 *   - manglishToMalayalam()
 *   - convertMalayalamToArabiMalayalam()
 *   - ARABI_MALAYALAM_VOCABULARY
 *   - MALAYALAM_TO_ARABI_VOCABULARY
 *
 * Main improvements:
 *   1. Ranked candidates instead of insertion order.
 *   2. Supports very large external Malayalam/Manglish lexicons.
 *   3. Supports an optional ML/model provider (IndicXlit, your own API, etc.).
 *   4. Learns the user's chosen spelling.
 *   5. Keeps your curated Arabi-Malayalam spellings as highest-quality output.
 *   6. Handles unknown words through your existing phonetic fallback.
 *   7. Normalizes common Manglish typing variation.
 *
 * IMPORTANT:
 * Do NOT bundle 4M+ word pairs directly into your web JS.
 * Keep a frequent subset locally and query the full model/index from a backend.
 */

import {
  manglishToMalayalam,
  convertMalayalamToArabiMalayalam,
  getTransliterationCandidates,
  ARABI_MALAYALAM_VOCABULARY,
  MANGLISH_TO_MALAYALAM_MAP,
  MALAYALAM_TO_ARABI_VOCABULARY,
} from "./enhancedTransliterator.ts";

export type CandidateSource = "user" | "override" | "lexicon" | "model" | "phonetic" | "typed";

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
const MALAYALAM_FREQUENCY = new Map<string, number>();
const MALAYALAM_CONTEXT_FREQUENCY = new Map<string, Map<string, number>>();
const USER_PREFERENCES = new Map<string, Map<string, number>>();
const MODEL_CACHE = new Map<string, MalayalamCandidate[]>();

let externalMalayalamProvider: MalayalamProvider | null = null;

const MAX_ROMAN_VARIANTS = 12;
const DEFAULT_LIMIT = 6;
const INTERACTIVE_PROVIDER_TIMEOUT_MS = 180;

export function setMalayalamProvider(provider: MalayalamProvider | null): void {
  externalMalayalamProvider = provider;
  MODEL_CACHE.clear();
}

/**
 * Register a corpus/lexicon in chunks.
 *
 * Suggested use:
 * - a small frequent-word JSON/SQLite/IndexedDB index in the browser;
 * - your complete Aksharantar/Dakshina index on the backend.
 */
export function registerManglishLexicon(entries: BulkLexiconEntry[]): void {
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

    const previous = bucket.get(ml) ?? 0;
    bucket.set(ml, Math.max(previous, frequency));

    const oldMlFrequency = MALAYALAM_FREQUENCY.get(ml) ?? 0;
    MALAYALAM_FREQUENCY.set(ml, oldMlFrequency + frequency);
  }
}

/**
 * Optional Malayalam-only frequency corpus.
 * Use this for ranking outputs even when a Roman pair is not frequency-tagged.
 */
export function registerMalayalamFrequencies(
  entries: Array<{ malayalam: string; frequency: number }>,
): void {
  for (const entry of entries) {
    const ml = normalizeMalayalam(entry.malayalam);
    if (!ml) continue;
    MALAYALAM_FREQUENCY.set(
      ml,
      Math.max(MALAYALAM_FREQUENCY.get(ml) ?? 0, Math.max(1, entry.frequency)),
    );
  }
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

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadUserPreferences(): void {
  if (!canUseLocalStorage()) return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<string, Record<string, number>>;
    USER_PREFERENCES.clear();

    for (const [roman, values] of Object.entries(parsed)) {
      const bucket = new Map<string, number>();
      for (const [ml, count] of Object.entries(values)) {
        bucket.set(ml, Number(count) || 1);
      }
      USER_PREFERENCES.set(roman, bucket);
    }
  } catch {
    // Ignore corrupt/blocked localStorage.
  }
}

function persistUserPreferences(): void {
  if (!canUseLocalStorage()) return;

  try {
    const output: Record<string, Record<string, number>> = {};

    for (const [roman, bucket] of USER_PREFERENCES) {
      output[roman] = Object.fromEntries(bucket);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(output));
  } catch {
    // Ignore quota/privacy-mode errors.
  }
}

/**
 * Call this when the user taps a suggestion.
 * The chosen Malayalam spelling will be ranked higher next time.
 */
export function learnSelection(romanInput: string, malayalam: string): void {
  const roman = normalizeRoman(romanInput);
  const ml = normalizeMalayalam(malayalam);
  if (!roman || !ml) return;

  let bucket = USER_PREFERENCES.get(roman);
  if (!bucket) {
    bucket = new Map<string, number>();
    USER_PREFERENCES.set(roman, bucket);
  }

  bucket.set(ml, (bucket.get(ml) ?? 0) + 1);
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

/**
 * Generate common typing variations without exploding the search space.
 *
 * Examples:
 *   njaan -> njan
 *   veedu -> vidu / veedu variants remain searchable
 *   cheyyunnu -> cheyunnu
 *   aa/ee/oo and doubled consonants get conservative alternates
 */
export function generateRomanVariants(input: string): string[] {
  const base = normalizeRoman(input);
  if (!base) return [];

  const out = new Set<string>([base]);

  const add = (v: string) => {
    if (v && out.size < MAX_ROMAN_VARIANTS) out.add(v);
  };

  // Long-vowel typing variants.
  add(base.replace(/aa/g, "a"));
  add(base.replace(/ee/g, "i"));
  add(base.replace(/ii/g, "i"));
  add(base.replace(/oo/g, "u"));
  add(base.replace(/uu/g, "u"));

  // Reverse a few common short-vowel conventions.
  if (base.includes("i")) add(base.replace(/i/g, "ee"));
  if (base.includes("u")) add(base.replace(/u/g, "oo"));

  // Conservative duplicate-letter variation.
  add(base.replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, "$1"));

  // Malayalam-specific Roman habits.
  add(base.replace(/nj/g, "gn"));
  add(base.replace(/gn/g, "nj"));
  add(base.replace(/zh/g, "z"));

  // Common "y" compression in casual typing.
  add(base.replace(/yy/g, "y"));

  return [...out].slice(0, MAX_ROMAN_VARIANTS);
}

/* -------------------------------------------------------------------------- */
/*                                  SCORING                                    */
/* -------------------------------------------------------------------------- */

function frequencyBoost(ml: string): number {
  const f = MALAYALAM_FREQUENCY.get(ml) ?? 0;
  if (!f) return 0;

  // Log scale prevents huge corpus counts from dominating everything.
  return Math.min(90, Math.log10(f + 1) * 18);
}

function contextBoost(previousMalayalam: string | undefined, ml: string): number {
  if (!previousMalayalam) return 0;
  const previous = normalizeMalayalam(previousMalayalam);
  const frequency = MALAYALAM_CONTEXT_FREQUENCY.get(previous)?.get(ml) ?? 0;
  return frequency ? Math.min(110, Math.log10(frequency + 1) * 24) : 0;
}

function addMalayalamCandidate(
  map: Map<string, { score: number; source: CandidateSource }>,
  ml: string,
  score: number,
  source: CandidateSource,
): void {
  const normalized = normalizeMalayalam(ml);
  if (!normalized) return;
  if (/[A-Za-z]/.test(normalized)) return;

  const finalScore = score + frequencyBoost(normalized);
  const previous = map.get(normalized);

  if (!previous || finalScore > previous.score) {
    map.set(normalized, { score: finalScore, source });
  }
}

function sourceBaseScore(source: CandidateSource): number {
  switch (source) {
    case "user":
      return 1200;
    case "override":
      return 1080;
    case "lexicon":
      return 900;
    case "model":
      return 820;
    case "phonetic":
      return 620;
    case "typed":
      return 0;
  }
}

/* -------------------------------------------------------------------------- */
/*                       ROMAN -> MALAYALAM CANDIDATES                         */
/* -------------------------------------------------------------------------- */

/**
 * This returns Malayalam candidates first.
 * That separation is important:
 *
 * Roman text -> Malayalam candidate ranking -> Arabi-Malayalam rendering
 *
 * Do not try to learn millions of Roman -> Arabi spellings directly.
 */
export async function getMalayalamCandidates(
  input: string,
  limit = 10,
  context: SmartContext = {},
): Promise<Array<{ text: string; score: number; source: CandidateSource }>> {
  const normalized = normalizeRoman(input);
  if (!normalized) return [];

  const ranked = new Map<string, { score: number; source: CandidateSource }>();
  const addRanked = (ml: string, score: number, source: CandidateSource) =>
    addMalayalamCandidate(ranked, ml, score + contextBoost(context.previousMalayalam, ml), source);

  /* 1. User selections */
  const userBucket = USER_PREFERENCES.get(normalized);
  if (userBucket) {
    for (const [ml, count] of userBucket) {
      addRanked(ml, sourceBaseScore("user") + Math.min(100, count * 12), "user");
    }
  }

  /* 2. Curated exact override dictionary from your current project */
  //
  // IMPORTANT:
  // Keep only true spelling/transliteration variants here.
  // Do NOT map a word to an expanded sentence or a different inflected word.
  //
  const curatedOutputs = MANGLISH_TO_MALAYALAM_MAP[normalized] ?? [];
  curatedOutputs.forEach((ml, index) => {
    addRanked(ml, sourceBaseScore("override") - index * 8, "override");
  });

  /* 3. Large corpus lexicon */
  const variants = generateRomanVariants(input);

  variants.forEach((variant, variantIndex) => {
    const bucket = ROMAN_TO_MALAYALAM.get(variant);
    if (!bucket) return;

    const sorted = [...bucket.entries()].sort((a, b) => b[1] - a[1]);

    sorted.slice(0, 12).forEach(([ml, freq], rank) => {
      const variantPenalty = variantIndex * 9;
      const corpusBoost = Math.min(75, Math.log10(freq + 1) * 15);

      addRanked(
        ml,
        sourceBaseScore("lexicon") + corpusBoost - variantPenalty - rank * 5,
        "lexicon",
      );
    });
  });

  /* 4. Optional model provider (IndicXlit / your own service) */
  if (externalMalayalamProvider) {
    try {
      const cacheKey = `${normalized}:8:${context.previousMalayalam ?? ""}`;
      let modelOutputs = MODEL_CACHE.get(cacheKey);
      if (!modelOutputs) {
        const request = externalMalayalamProvider(normalized, 8, context)
          .then((outputs) => {
            MODEL_CACHE.set(cacheKey, outputs);
            return outputs;
          })
          .catch(() => []);
        modelOutputs = await Promise.race([
          request,
          new Promise<undefined>((resolve) =>
            setTimeout(() => resolve(undefined), INTERACTIVE_PROVIDER_TIMEOUT_MS),
          ),
        ]);
      }

      modelOutputs?.forEach((candidate, index) => {
        addRanked(
          candidate.text,
          sourceBaseScore("model") + (candidate.score ?? 0) - index * 12,
          "model",
        );
      });
    } catch {
      // Network/model errors must never break keyboard typing.
    }
  }

  /* 5. Existing phonetic fallback */
  //
  // manglishToMalayalam() is already called above. If you later split your
  // exact dictionary lookup from the rule engine, put the pure rule result here.
  try {
    const fallback = manglishToMalayalam(input);

    fallback.forEach((ml, index) => {
      addRanked(ml, sourceBaseScore("phonetic") - index * 12, "phonetic");
    });
  } catch {
    // Ignore.
  }

  return [...ranked.entries()]
    .map(([text, meta]) => ({
      text,
      score: meta.score,
      source: meta.source,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

/* -------------------------------------------------------------------------- */
/*                     MALAYALAM -> ARABI-MALAYALAM                           */
/* -------------------------------------------------------------------------- */

function getArabiForms(ml: string): string[] {
  const out = new Set<string>();

  // Curated spellings always come first.
  const curated = MALAYALAM_TO_ARABI_VOCABULARY[ml];
  if (curated) {
    for (const value of curated) out.add(value.normalize("NFC"));
  }

  // Rule-based conversion handles unseen Malayalam words.
  try {
    for (const value of convertMalayalamToArabiMalayalam(ml)) {
      if (value) out.add(value.normalize("NFC"));
    }
  } catch {
    // Ignore converter failure for one candidate.
  }

  return [...out];
}

/**
 * Main keyboard function.
 *
 * It returns final Arabi-Malayalam candidates, ranked.
 */
export async function getSmartTransliterationCandidates(
  input: string,
  limit = DEFAULT_LIMIT,
  context: SmartContext = {},
): Promise<SmartCandidate[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (/[\u0D00-\u0D7F]/u.test(trimmed)) {
    const converted: SmartCandidate[] = getArabiForms(trimmed)
      .slice(0, Math.max(1, limit - 1))
      .map((text, index) => ({
        text,
        malayalam: trimmed,
        score: sourceBaseScore("override") - index * 5,
        source: "override" as const,
      }));
    if (limit > 1) {
      converted.push({
        text: trimmed,
        malayalam: trimmed,
        score: 0,
        source: "typed",
      });
    }
    return converted.slice(0, limit);
  }

  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(trimmed)) {
    return getTransliterationCandidates(trimmed, "arabic")
      .slice(0, limit)
      .map(({ text }, index, all) => ({
        text,
        score: index === all.length - 1 && text === trimmed ? 0 : 1000 - index * 5,
        source:
          index === all.length - 1 && text === trimmed ? ("typed" as const) : ("override" as const),
      }));
  }

  const normalized = normalizeRoman(trimmed);
  const finalMap = new Map<string, SmartCandidate>();

  const addFinal = (candidate: SmartCandidate) => {
    const key = candidate.text.normalize("NFC");
    const previous = finalMap.get(key);

    if (!previous || candidate.score > previous.score) {
      finalMap.set(key, { ...candidate, text: key });
    }
  };

  /* A. Exact Roman -> Arabi-Malayalam curated vocabulary */
  if (normalized && ARABI_MALAYALAM_VOCABULARY[normalized]) {
    const exactMalayalam = manglishToMalayalam(trimmed)[0];
    ARABI_MALAYALAM_VOCABULARY[normalized]!.forEach((text, index) => {
      addFinal({
        text,
        ...(exactMalayalam ? { malayalam: exactMalayalam } : {}),
        score: sourceBaseScore("override") + 80 - index * 8,
        source: "override",
      });
    });
  }

  /* B. Roman -> ranked Malayalam -> Arabi-Malayalam */
  const mlCandidates = await getMalayalamCandidates(trimmed, Math.max(limit * 2, 10), context);

  for (const mlCandidate of mlCandidates) {
    const arabiForms = getArabiForms(mlCandidate.text);

    arabiForms.forEach((arabi, arabiIndex) => {
      addFinal({
        text: arabi,
        malayalam: mlCandidate.text,
        score:
          mlCandidate.score +
          (MALAYALAM_TO_ARABI_VOCABULARY[mlCandidate.text] ? 35 : 0) -
          arabiIndex * 5,
        source: mlCandidate.source,
      });
    });
  }

  let ranked = [...finalMap.values()].sort((a, b) => b.score - a.score);

  // Optional "keep what I typed" fallback as the final keyboard candidate.
  // If you do not want this behavior, remove the following block.
  if (limit > 1 && !ranked.some((candidate) => candidate.text === trimmed) && trimmed.length > 0) {
    ranked = ranked.slice(0, limit - 1);
    ranked.push({
      text: trimmed,
      score: 0,
      source: "typed",
    });
  }

  return ranked.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*                          WHOLE-TEXT TRANSLITERATION                         */
/* -------------------------------------------------------------------------- */

const TOKEN_PATTERN =
  /https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[A-Za-z]+(?:['’][A-Za-z]+)*/g;

/**
 * Convert pasted Manglish text while preserving URLs/e-mails/punctuation.
 *
 * This function is async because your best Malayalam layer should be allowed
 * to use an ML/backend provider.
 */
export async function transliterateSmartPastedText(input: string): Promise<string> {
  if (!input) return input;

  const source = convertMalayalamToArabiMalayalam(input)[0] ?? input;
  const matches = [...source.matchAll(TOKEN_PATTERN)];
  const conversions = new Map<string, Promise<string>>();

  for (const match of matches) {
    const token = match[0];
    if (/^(?:https?:\/\/|www\.)/i.test(token) || token.includes("@")) {
      continue;
    }
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

  const pieces: string[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const token = match[0];
    const index = match.index ?? 0;

    pieces.push(source.slice(lastIndex, index));

    if (/^(?:https?:\/\/|www\.)/i.test(token) || token.includes("@")) {
      pieces.push(token);
    } else {
      pieces.push(resolved.get(normalizeRoman(token)) ?? token);
    }

    lastIndex = index + token.length;
  }

  pieces.push(source.slice(lastIndex));
  return pieces.join("");
}

/* -------------------------------------------------------------------------- */
/*                     EXAMPLE EXTERNAL MODEL PROVIDER                         */
/* -------------------------------------------------------------------------- */

/**
 * Example adapter for YOUR OWN backend.
 *
 * Expected backend response:
 * {
 *   "candidates": [
 *     { "text": "ഞാൻ", "score": 1.0 },
 *     { "text": "ജാൻ", "score": 0.73 }
 *   ]
 * }
 *
 * On the server, connect this endpoint to IndicXlit or another Malayalam
 * transliteration model. This keeps large models/data out of your browser.
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

/* -------------------------------------------------------------------------- */
/*                          RECOMMENDED INITIALIZATION                         */
/* -------------------------------------------------------------------------- */

/**
 * Example:
 *
 * loadUserPreferences();
 *
 * registerManglishLexicon([
 *   { roman: "njan", malayalam: "ഞാൻ", frequency: 50000 },
 *   { roman: "njaan", malayalam: "ഞാൻ", frequency: 30000 },
 *   { roman: "ente", malayalam: "എന്റെ", frequency: 80000 },
 * ]);
 *
 * setMalayalamProvider(
 *   createHttpMalayalamProvider("/api/transliterate/malayalam"),
 * );
 *
 * const candidates = await getSmartTransliterationCandidates("sugamano", 6);
 */
