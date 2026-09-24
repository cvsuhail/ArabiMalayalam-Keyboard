import assert from "node:assert/strict";
import test from "node:test";

import {
  getTransliterationCandidates,
  manglishToMalayalam,
  transliteratePastedText,
} from "./enhancedTransliterator.ts";
import {
  getSmartTransliterationCandidates,
  getMalayalamCandidates,
  learnSelection,
  registerManglishLexicon,
  registerMalayalamContext,
  setMalayalamProvider,
  transliterateSmartPastedText,
} from "./smartManglishLayer.ts";

const firstMalayalam = (word) => manglishToMalayalam(word)[0];
const firstArabiMalayalam = (word) => getTransliterationCandidates(word)[0]?.text;

test("recognizes difficult conversational Manglish spellings", () => {
  const cases = {
    Njangalkk: "ഞങ്ങൾക്ക്",
    njangalkku: "ഞങ്ങൾക്ക്",
    evide: "എവിടെ",
    eppo: "എപ്പോ",
    eppol: "എപ്പോൾ",
    engane: "എങ്ങനെ",
    povaam: "പോവാം",
    povam: "പോവാം",
    pokam: "പോകാം",
    varunnu: "വരുന്നു",
    kazhikkam: "കഴിക്കാം",
    chodichu: "ചോദിച്ചു",
    parayunnu: "പറയുന്നു",
  };

  for (const [source, expected] of Object.entries(cases)) {
    assert.equal(firstMalayalam(source), expected, source);
  }
});

test("generalizes doubled consonants instead of returning mixed Latin text", () => {
  assert.equal(firstMalayalam("kappa"), "കപ്പ");
  assert.equal(firstMalayalam("varunnu"), "വരുന്നു");

  for (const word of ["Njangalkk", "engane", "kappa", "varunnu"]) {
    assert.doesNotMatch(firstMalayalam(word), /[A-Za-z]/, word);
    assert.match(firstArabiMalayalam(word), /[\u0600-\u06FF]/u, word);
  }
});

test("automatically transliterates Manglish sentences and paragraphs on paste", () => {
  const converted = transliteratePastedText(
    "Njangalkk evide eppo engane povaam?\nമലയാളം test@example.com https://example.com",
  );

  assert.equal(
    converted,
    "ڿَۼَّۻْکّْ ا٘وِد٘ ا٘پّٗو ا٘ۼَّن٘ پٗووامْ?\nمَلَیاۻَمْ test@example.com https://example.com",
  );
});

test("ranks corpus entries above the phonetic fallback", async () => {
  registerManglishLexicon([
    { roman: "shahabas", malayalam: "ഷഹബാസ്", frequency: 25_000 },
    { roman: "shahabas", malayalam: "ശഹബാസ്", frequency: 100 },
  ]);

  const candidates = await getSmartTransliterationCandidates("shahabas", 6);
  assert.equal(candidates[0]?.malayalam, "ഷഹബാസ്");
  assert.equal(candidates[0]?.source, "lexicon");
  assert.ok(candidates.length <= 6);
  assert.equal(candidates.at(-1)?.text, "shahabas");
});

test("uses previous-word corpus context to disambiguate candidates", async () => {
  registerManglishLexicon([
    { roman: "contextsample", malayalam: "അവൻ", frequency: 100 },
    { roman: "contextsample", malayalam: "അവൾ", frequency: 100 },
  ]);
  registerMalayalamContext([{ previousMalayalam: "ഞാൻ", malayalam: "അവൾ", frequency: 50_000 }]);

  const candidates = await getMalayalamCandidates("contextsample", 2, {
    previousMalayalam: "ഞാൻ",
  });
  assert.equal(candidates[0]?.text, "അവൾ");
});

test("uses a model provider for unseen words and learns the selected spelling", async () => {
  setMalayalamProvider(async (roman) =>
    roman === "sugamano" ? [{ text: "സുഖമാണോ", score: 1 }] : [],
  );

  const modelCandidates = await getSmartTransliterationCandidates("sugamano", 6);
  assert.equal(modelCandidates[0]?.malayalam, "സുഖമാണോ");
  assert.equal(modelCandidates[0]?.source, "model");

  learnSelection("sugamano", "സുഖമാണോ");
  setMalayalamProvider(null);
  const learnedCandidates = await getSmartTransliterationCandidates("sugamano", 6);
  assert.equal(learnedCandidates[0]?.malayalam, "സുഖമാണോ");
  assert.equal(learnedCandidates[0]?.source, "user");
});

test("smart paragraph conversion handles Malayalam and Manglish in parallel", async () => {
  const converted = await transliterateSmartPastedText(
    "Njangalkk evide?\nമലയാളം test@example.com https://example.com",
  );

  assert.match(converted, /^ڿَۼَّۻْکّْ ا٘وِد٘\?\n/u);
  assert.match(converted, /مَلَیاۻَمْ/u);
  assert.match(converted, /test@example\.com https:\/\/example\.com$/u);
});
