import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { manglishToMalayalam } from "./enhancedTransliterator.ts";
import { registerLexiconText } from "./malayalamLexicon.ts";
import {
  getSmartTransliterationCandidates,
  getMalayalamCandidates,
  learnSelection,
  registerManglishLexicon,
  registerMalayalamContext,
  setMalayalamProvider,
  transliterateMalayalamText,
  transliterateSmartPastedText,
} from "./smartManglishLayer.ts";

// The browser fetches this file lazily; tests read it from disk.
registerLexiconText(
  readFileSync(new URL("../../../public/lexicon/ml-words.txt", import.meta.url), "utf8"),
);

const firstMalayalam = (word) => manglishToMalayalam(word)[0];
const candidates = (word, limit = 6) => getSmartTransliterationCandidates(word, limit);
const topSmart = async (word) => (await candidates(word))[0];

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

test("finds real words for spellings with no curated override", () => {
  const cases = {
    kandu: "കണ്ടു",
    kuttikal: "കുട്ടികൾ",
    makkal: "മക്കൾ",
    undu: "ഉണ്ട്",
    undo: "ഉണ്ടോ",
    ishtam: "ഇഷ്ടം",
    padikkanam: "പഠിക്കണം",
    vayichu: "വായിച്ചു",
    ninte: "നിന്റെ",
    cheriya: "ചെറിയ",
    kure: "കുറെ",
    naale: "നാളെ",
    kayyil: "കയ്യിൽ",
    sankadam: "സങ്കടം",
    aval: "അവൾ",
    shari: "ശരി",
    kuppayam: "കുപ്പായം",
    biriyani: "ബിരിയാണി",
  };

  for (const [source, expected] of Object.entries(cases)) {
    assert.equal(firstMalayalam(source), expected, source);
  }
});

test("every suggestion for a Manglish word is Arabi-Malayalam except the typed text", async () => {
  for (const word of ["Njangalkk", "engane", "kappa", "varunnu", "zxqv"]) {
    const list = await candidates(word);
    assert.equal(list.at(-1)?.text, word, word);
    assert.equal(list.at(-1)?.source, "typed", word);
    for (const candidate of list.slice(0, -1)) {
      assert.doesNotMatch(candidate.text, /[A-Za-z]/, word);
      assert.match(candidate.text, /[؀-ۿ]/u, word);
    }
  }
});

test("shows one consistent orthography: no legacy letter forms", async () => {
  for (const word of ["njan", "keralam", "vellam", "ningal", "thenga", "malayalam"]) {
    for (const candidate of await candidates(word)) {
      assert.doesNotMatch(candidate.text, /[ݧڞڰڶ]/u, `${word}: ${candidate.text}`);
    }
  }
});

test("offers Arabic spellings for Arabic loanwords first", async () => {
  assert.equal((await topSmart("salam"))?.text, "سَلَام");
  assert.equal((await topSmart("swalath"))?.text, "صَلَاة");
  assert.equal((await topSmart("bismillah"))?.text, "بِسْمِ اللّٰه");
  assert.equal((await topSmart("quran"))?.text, "قُرْآن");
  // "alla" is the Malayalam word അല്ല, not Allah.
  assert.equal((await topSmart("alla"))?.malayalam, "അല്ല");
});

test("uses the house letters: fatha + alef for ā, ھ for ഹ, ق for ഖ", async () => {
  assert.equal((await topSmart("kaanaan"))?.text, "كَاڹَانْ");
  assert.equal((await topSmart("sukham"))?.text, "سُقَمْ");
  assert.equal((await topSmart("sneham"))?.text, "سْن٘يھَمْ");
});

test("keeps ص for Arabic loanwords now that native സ്വ is regular", async () => {
  assert.equal((await topSmart("swantham"))?.text, "سْوَنْتَمْ");
  assert.equal((await topSmart("sahih"))?.text, "صَحِيح");
  assert.equal(transliterateMalayalamText("സ്വഹീഹ് സ്വന്തം"), "صَحِيح سْوَنْتَمْ");
});

test("offers every real word an ambiguous spelling can mean", async () => {
  const cases = {
    padam: ["പടം", "പാടം", "പദം", "പാഠം"],
    pani: ["പണി", "പനി"],
    vala: ["വല", "വള"],
    mala: ["മല", "മാല"],
    kodi: ["കൊടി", "കോടി"],
    kari: ["കറി", "കരി"],
    pattu: ["പാട്ട്", "പട്ട്", "പത്ത്"],
  };
  for (const [word, meanings] of Object.entries(cases)) {
    const shown = (await candidates(word, 10)).map((candidate) => candidate.malayalam);
    for (const meaning of meanings) assert.ok(shown.includes(meaning), `${word}: ${meaning}`);
  }
});

test("shows ten suggestions by default without stretched-vowel guesses", async () => {
  const list = await getSmartTransliterationCandidates("padam");
  assert.ok(list.length > 6 && list.length <= 10);
  assert.equal(list.at(-1)?.source, "typed");
  const shown = (await candidates("vala", 10)).map((candidate) => candidate.malayalam);
  for (const junk of ["വലാ", "വളാ"]) assert.ok(!shown.includes(junk), junk);
  const pani = (await candidates("pani", 10)).map((candidate) => candidate.malayalam);
  assert.ok(!pani.includes("പനീ"));
});

test("whole-word completions are suggested but never replace the typed word", async () => {
  const list = await candidates("sukhama");
  assert.notEqual(list[0]?.source, "completion");
  assert.ok(list.some((candidate) => candidate.malayalam === "സുഖമാണോ"));
  assert.ok(list.filter((candidate) => candidate.source === "completion").length <= 3);
});

test("keeps the other o-mark style one tap away and learns the choice", async () => {
  const list = await candidates("poyi");
  assert.equal(list[0]?.text, "پٗويِ");
  assert.equal(list.at(-2)?.text, "پُويِ", "plain-damma variant sits just above the typed text");

  learnSelection("poyi", "പോയി", "پُويِ");
  assert.equal((await topSmart("eppo"))?.text, "ا٘پُّو", "the style applies to other words");

  learnSelection("poyi", "പോയി", "پٗويِ");
  assert.equal((await topSmart("eppo"))?.text, "ا٘پّٗو");
});

test("handles Malayalam, Arabic and non-word input", async () => {
  const malayalam = await candidates("ഞാൻ");
  assert.equal(malayalam[0]?.text, "ڿَانْ");
  assert.equal(malayalam.at(-1)?.text, "ഞാൻ");

  const arabic = await candidates("سلام");
  assert.equal(arabic[0]?.text, "سَلَام");
  assert.equal(arabic.at(-1)?.text, "سلام");

  assert.deepEqual(
    (await candidates("2024")).map((candidate) => candidate.text),
    ["2024"],
  );
});

test("automatically transliterates Manglish sentences and paragraphs on paste", async () => {
  const converted = await transliterateSmartPastedText(
    "Njangalkk evide eppo engane povaam?\nമലയാളം test@example.com https://example.com",
  );

  assert.equal(
    converted,
    "ڿَۼَّۻْكّْ ا٘وِڊ٘ ا٘پّٗو ا٘ۼَّن٘ پٗووَامْ?\nمَلَيَاۻَمْ test@example.com https://example.com",
  );
});

test("pasted Malayalam keeps Arabic spellings for loanwords as whole words", () => {
  assert.equal(transliterateMalayalamText("അല്ലാഹു മുഹമ്മദ് (സ്വ)"), "اللّٰهُ مُحَمَّد ﷺ");
  // Inside a longer word the loanword is not substituted.
  assert.doesNotMatch(transliterateMalayalamText("അല്ലാഹുവിന്റെ"), /اللّٰهُ/u);
});

test("ranks corpus entries above the phonetic fallback", async () => {
  registerManglishLexicon([
    { roman: "shahabas", malayalam: "ഷഹബാസ്", frequency: 25_000 },
    { roman: "shahabas", malayalam: "ശഹബാസ്", frequency: 100 },
  ]);

  const list = await candidates("shahabas");
  assert.equal(list[0]?.malayalam, "ഷഹബാസ്");
  assert.equal(list[0]?.source, "lexicon");
  assert.ok(list.length <= 6);
  assert.equal(list.at(-1)?.text, "shahabas");
});

test("uses previous-word corpus context to disambiguate candidates", async () => {
  registerManglishLexicon([
    { roman: "contextsample", malayalam: "അവൻ", frequency: 100 },
    { roman: "contextsample", malayalam: "അവൾ", frequency: 100 },
  ]);
  registerMalayalamContext([{ previousMalayalam: "ഞാൻ", malayalam: "അവൾ", frequency: 50_000 }]);

  const list = await getMalayalamCandidates("contextsample", 2, {
    previousMalayalam: "ഞാൻ",
  });
  assert.equal(list[0]?.text, "അവൾ");
});

test("uses a model provider for unseen words and learns the selected spelling", async () => {
  setMalayalamProvider(async (roman) =>
    roman === "sugamano" ? [{ text: "സുഖമാണോ", score: 1 }] : [],
  );

  const modelCandidates = await candidates("sugamano");
  assert.equal(modelCandidates[0]?.malayalam, "സുഖമാണോ");
  assert.equal(modelCandidates[0]?.source, "model");

  learnSelection("sugamano", "സുഖമാണോ");
  setMalayalamProvider(null);
  const learnedCandidates = await candidates("sugamano");
  assert.equal(learnedCandidates[0]?.malayalam, "സുഖമാണോ");
  assert.equal(learnedCandidates[0]?.source, "user");
});

test("learned choices outrank curated overrides", async () => {
  learnSelection("vellam", "വെല്ലം");
  assert.equal((await topSmart("vellam"))?.malayalam, "വെല്ലം");
});

test("smart paragraph conversion handles Malayalam and Manglish in parallel", async () => {
  const converted = await transliterateSmartPastedText(
    "Njangalkk evide?\nമലയാളം test@example.com https://example.com",
  );

  assert.match(converted, /^ڿَۼَّۻْكّْ ا٘وِڊ٘\?\n/u);
  assert.match(converted, /مَلَيَاۻَمْ/u);
  assert.match(converted, /test@example\.com https:\/\/example\.com$/u);
});
