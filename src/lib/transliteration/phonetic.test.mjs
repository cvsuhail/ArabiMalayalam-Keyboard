import assert from "node:assert/strict";
import test from "node:test";

import { generateMalayalamSpellings, normalizeManglish } from "./manglishPhonetic.ts";
import {
  isLexiconPrefix,
  lexiconCompletions,
  registerLexiconText,
  spellingPlausibility,
  wordFrequency,
} from "./malayalamLexicon.ts";

const spellings = (word, options) => generateMalayalamSpellings(word, options).map((s) => s.text);
const top = (word) => spellings(word)[0];

test("reads Malayalam consonant clusters the way Manglish typists use them", () => {
  assert.equal(top("kappa"), "കപ്പ");
  assert.equal(top("kandu"), "കണ്ട്"); // nd -> ണ്ട
  assert.equal(top("ente"), "എന്റെ"); // nt -> ന്റ
  assert.equal(top("kazhichu"), "കഴിച്ച്"); // intervocalic ch -> ച്ച
  assert.equal(top("paranju"), "പരഞ്ഞ്"); // intervocalic nj -> ഞ്ഞ
  assert.equal(top("njan"), "ഞൻ"); // initial nj -> ഞ, final n -> ൻ
  assert.equal(top("ishtam"), "ഇഷ്ടം"); // sh before t -> ഷ
  assert.equal(top("sankadam"), "സങ്കടം"); // nk -> ങ്ക, intervocalic d -> ട
  assert.equal(top("kutty"), "കുട്ടി"); // final y after a consonant is a vowel
});

test("offers the alternatives the lexicon needs to choose between", () => {
  const kannu = spellings("kannu");
  assert.ok(kannu.includes("കന്ന്") && kannu.includes("കണ്ണ്") && kannu.includes("കന്നു"));
  assert.ok(spellings("njan").includes("ഞാൻ"), "short a may be a long ā");
  assert.ok(spellings("kure").includes("കുറെ"), "r may be റ");
  assert.ok(spellings("makkal").includes("മക്കൾ"), "final l may be ൾ");
  assert.ok(spellings("krishi").includes("കൃഷി"), "consonant + ri may be the vocalic ൃ");
  assert.ok(spellings("pattum").includes("പറ്റും"), "tt may be റ്റ");
});

test("never leaves Latin letters in a spelling", () => {
  for (const word of ["Njangalkk", "engane", "qwerty", "xylophone", "kozhikode"]) {
    for (const spelling of spellings(word)) assert.doesNotMatch(spelling, /[A-Za-z]/, word);
  }
});

test("renders an unfinished word as an open prefix for completion", () => {
  assert.equal(spellings("sukham", { open: true })[0], "സുഖമ");
  assert.equal(spellings("paranj", { open: true })[0], "പരഞ്ഞ");
});

test("normalizes casing and stretched letters", () => {
  assert.equal(normalizeManglish("Njan"), "njan");
  assert.equal(normalizeManglish("SHERIII"), "sherii");
  assert.equal(normalizeManglish("kaLLan"), "kaLLan");
});

test("lexicon answers frequency, prefix and completion queries", () => {
  registerLexiconText("സുഖം\t50\nസുഖമാണോ\t900\nസുഖമാണ്\t300\nസുഖമായി\t100\n");
  assert.equal(wordFrequency("സുഖമാണോ"), 900);
  assert.ok(isLexiconPrefix("സുഖമ"));
  assert.ok(!isLexiconPrefix("സുഖമോ"));
  assert.deepEqual(
    lexiconCompletions("സുഖമ", 2).map((entry) => entry.text),
    ["സുഖമാണോ", "സുഖമാണ്"],
  );
  assert.deepEqual(lexiconCompletions("സു", 2), [], "very short prefixes give no completions");
});

test("lexicon-guided search keeps costly spellings of real words", () => {
  registerLexiconText("കുപ്പായം\t200\n");
  const guided = spellings("kuppayam", { limit: 64, isKnownPrefix: isLexiconPrefix });
  assert.ok(guided.includes("കുപ്പായം"));
});

test("letter-sequence model scores real spellings above implausible ones", () => {
  registerLexiconText("പാടം\t9\nപാട്ട്\t9\nകട്ട്\t9\nവല\t9\nതല\t9\nപനി\t9\nമല\t9\nകല\t9\n");
  assert.ok(spellingPlausibility("പട്ട്") > spellingPlausibility("പഡ്ഡീ"));
  assert.ok(spellingPlausibility("കല") > spellingPlausibility("കഴ്ഴ"));
});
