#!/usr/bin/env node
/**
 * Builds public/lexicon/ml-words.txt from a FrequencyWords Malayalam list.
 *
 *   curl -L -o ml_50k.txt \
 *     https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ml/ml_50k.txt
 *   node scripts/build-lexicon.mjs ml_50k.txt
 *
 * Source data: OpenSubtitles 2018 via hermitdave/FrequencyWords, CC-BY-SA-4.0.
 *
 * The upstream tokenizer dropped zero-width joiners, so legacy chillus such
 * as ന്‍ arrive as a bare consonant + virama (ഞാന്) and words that used the
 * legacy ന്‍റ spelling were split into fragments (എന് + റെ). This script folds
 * the legacy chillus into their atomic forms and drops the fragments.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_WORDS = 30_000;
const LEGACY_FORM_SHARE = 0.3;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/build-lexicon.mjs <ml_50k.txt>");
  process.exit(1);
}

const CHILLU = { ന: "ൻ", ര: "ർ", ല: "ൽ", ള: "ൾ" };
const VIRAMA = "്";

// Suffix halves left behind by legacy ന്‍റ splits, plus bare consonant+virama tokens.
const FRAGMENTS = new Set(["റെ", "റെയും", "റെയോ", "റേത്", "റേതാണ്", "റേതും", "റി", "റ്റ്"]);

const isMalayalamWord = (word) => /^[അ-ഹ][ഀ-ൿ]*$/u.test(word);
const startsWithGeminate = (word) => /^([ക-ഹ])്\1/u.test(word);
const isBareConsonant = (word) => /^[ക-ഹ]്?$/u.test(word);

function normalize(word) {
  return word
    .normalize("NFC")
    .replace(/[‌‍]/g, "")
    .replace(/ൌ/g, "ൗ") // legacy AU sign -> modern AU length mark
    .replace(/ു്$/u, "്"); // old samvruthokaram spelling ഉണ്ടു് -> ഉണ്ട്
}

/** ഞാന് -> ഞാൻ, but leave conjunct endings such as ഇന്ന് untouched. */
function foldLegacyChillu(word) {
  const last = word.at(-1);
  const consonant = word.at(-2);
  if (last !== VIRAMA || !consonant || !CHILLU[consonant]) return null;
  if (word.at(-3) === VIRAMA) return null;
  return word.slice(0, -2) + CHILLU[consonant];
}

const counts = new Map();
const add = (word, count) => counts.set(word, (counts.get(word) ?? 0) + count);

for (const line of readFileSync(input, "utf8").split("\n")) {
  const separator = line.lastIndexOf(" ");
  if (separator <= 0) continue;
  const word = normalize(line.slice(0, separator).trim());
  const count = Number(line.slice(separator + 1));
  if (!Number.isFinite(count) || count <= 0) continue;
  if (!isMalayalamWord(word) || FRAGMENTS.has(word)) continue;
  if (startsWithGeminate(word) || isBareConsonant(word) || word.startsWith("റ്")) continue;

  const folded = foldLegacyChillu(word);
  if (folded) {
    add(folded, count);
    add(word, Math.round(count * LEGACY_FORM_SHARE));
  } else {
    add(word, count);
  }
}

const sorted = [...counts]
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  .slice(0, MAX_WORDS);

const output = resolve(root, "public/lexicon/ml-words.txt");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sorted.map(([word, count]) => `${word}\t${count}`).join("\n") + "\n");
console.log(`wrote ${sorted.length} words to ${output}`);
