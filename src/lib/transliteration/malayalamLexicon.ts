/**
 * Malayalam word-frequency lexicon.
 *
 * The phonetic generator produces several plausible Malayalam spellings for a
 * Manglish word; this lexicon tells us which of them are real, common words
 * and offers whole-word completions for a partially typed prefix.
 *
 * The bundled list (public/lexicon/ml-words.txt) is built by
 * scripts/build-lexicon.mjs from OpenSubtitles 2018 frequency data
 * (hermitdave/FrequencyWords, CC-BY-SA-4.0). It is fetched lazily so it never
 * blocks the first keystroke, and the service worker caches it for offline use.
 */

export const LEXICON_URL = "/lexicon/ml-words.txt";

/** Prefix scans stop after this many entries so short prefixes stay cheap. */
const MAX_PREFIX_SCAN = 4000;

const FREQUENCY = new Map<string, number>();
let sortedWords: string[] = [];
let sortedDirty = false;
let loadPromise: Promise<void> | null = null;

// Letter-trigram counts over the lexicon's words, rebuilt lazily after changes.
const TRIGRAMS = new Map<string, number>();
const CONTEXTS = new Map<string, number>();
let alphabetSize = 1;
let trigramsDirty = false;
const TRIGRAM_SMOOTHING = 0.5;

function normalize(word: string): string {
  return word.normalize("NFC").trim();
}

export function registerLexiconEntries(
  entries: Iterable<{ malayalam: string; frequency: number }>,
): void {
  for (const entry of entries) {
    const word = normalize(entry.malayalam);
    if (!word || !Number.isFinite(entry.frequency)) continue;
    const frequency = Math.max(1, entry.frequency);
    FREQUENCY.set(word, Math.max(FREQUENCY.get(word) ?? 0, frequency));
  }
  sortedDirty = true;
  trigramsDirty = true;
}

/** Parse the `word<TAB>count` format written by scripts/build-lexicon.mjs. */
export function registerLexiconText(text: string): void {
  const entries: Array<{ malayalam: string; frequency: number }> = [];
  for (const line of text.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    entries.push({ malayalam: line.slice(0, tab), frequency: Number(line.slice(tab + 1)) });
  }
  registerLexiconEntries(entries);
}

/** Fetch the bundled lexicon once. Failures are swallowed: typing must keep working. */
export function loadLexicon(url = LEXICON_URL): Promise<void> {
  loadPromise ??= fetch(url)
    .then((response) => (response.ok ? response.text() : ""))
    .then(registerLexiconText)
    .catch(() => {
      loadPromise = null;
    });
  return loadPromise;
}

export function lexiconSize(): number {
  return FREQUENCY.size;
}

export function wordFrequency(word: string): number {
  return FREQUENCY.get(normalize(word)) ?? 0;
}

/**
 * Ranking bonus for a Malayalam word. Any attested word gets a flat bonus so
 * it beats unattested phonetic guesses; frequency is log-scaled so very common
 * words do not drown out everything else.
 */
export function lexiconBoost(word: string): number {
  const frequency = wordFrequency(word);
  return frequency ? 120 + Math.log10(frequency + 1) * 40 : 0;
}

const letters = (word: string) => ["^", "^", ...Array.from(word), "$"];

function ensureTrigrams(): void {
  if (!trigramsDirty) return;
  TRIGRAMS.clear();
  CONTEXTS.clear();
  const alphabet = new Set<string>();
  for (const word of FREQUENCY.keys()) {
    const chars = letters(word);
    for (let i = 2; i < chars.length; i++) {
      const context = chars[i - 2]! + chars[i - 1]!;
      alphabet.add(chars[i]!);
      TRIGRAMS.set(context + chars[i]!, (TRIGRAMS.get(context + chars[i]!) ?? 0) + 1);
      CONTEXTS.set(context, (CONTEXTS.get(context) ?? 0) + 1);
    }
  }
  alphabetSize = Math.max(1, alphabet.size);
  trigramsDirty = false;
}

/**
 * How Malayalam-like a spelling looks: the average log-probability per letter
 * under a letter-trigram model of the lexicon. Real words the lexicon lacks
 * (പാടം, പട്ട്) score around -2.4; implausible spellings (പനീ, പഡം) around
 * -3.4 or lower. Returns 0 while no lexicon is loaded.
 */
export function spellingPlausibility(word: string): number {
  if (FREQUENCY.size === 0) return 0;
  ensureTrigrams();
  const chars = letters(normalize(word));
  let total = 0;
  for (let i = 2; i < chars.length; i++) {
    const context = chars[i - 2]! + chars[i - 1]!;
    const count = TRIGRAMS.get(context + chars[i]!) ?? 0;
    const contextCount = CONTEXTS.get(context) ?? 0;
    total += Math.log(
      (count + TRIGRAM_SMOOTHING) / (contextCount + TRIGRAM_SMOOTHING * alphabetSize),
    );
  }
  return total / (chars.length - 2);
}

function ensureSorted(): void {
  if (!sortedDirty) return;
  sortedWords = [...FREQUENCY.keys()].sort();
  sortedDirty = false;
}

function lowerBound(prefix: string): number {
  let low = 0;
  let high = sortedWords.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (sortedWords[mid]! < prefix) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** True when at least one lexicon word starts with `prefix`. */
export function isLexiconPrefix(prefix: string): boolean {
  if (!prefix || FREQUENCY.size === 0) return false;
  ensureSorted();
  return sortedWords[lowerBound(prefix)]?.startsWith(prefix) ?? false;
}

/**
 * Most frequent lexicon words that start with `prefix` (excluding the prefix
 * itself). Prefixes shorter than `minLength` code points return nothing.
 */
export function lexiconCompletions(
  prefix: string,
  limit = 3,
  minLength = 3,
): Array<{ text: string; frequency: number }> {
  const normalized = normalize(prefix);
  if (Array.from(normalized).length < minLength || limit <= 0) return [];
  ensureSorted();

  const best: Array<{ text: string; frequency: number }> = [];
  const start = lowerBound(normalized);
  const end = Math.min(sortedWords.length, start + MAX_PREFIX_SCAN);

  for (let i = start; i < end; i++) {
    const word = sortedWords[i]!;
    if (!word.startsWith(normalized)) break;
    if (word === normalized) continue;

    const frequency = FREQUENCY.get(word) ?? 0;
    if (best.length < limit) {
      best.push({ text: word, frequency });
      best.sort((a, b) => b.frequency - a.frequency);
    } else if (frequency > best.at(-1)!.frequency) {
      best[best.length - 1] = { text: word, frequency };
      best.sort((a, b) => b.frequency - a.frequency);
    }
  }
  return best;
}
