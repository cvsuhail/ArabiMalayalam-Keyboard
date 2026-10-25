import assert from "node:assert/strict";
import test from "node:test";

import {
  ADDED_LETTERS,
  CHILLUS,
  CONSONANTS,
  CONSONANT_GROUPS,
  DIGITS,
  LOANWORDS,
  SPELLING_RULES,
  VOWELS,
  syllableRow,
} from "./alphabet.ts";
import { transliterateMalayalamToArabic } from "./malayalamToArabic.ts";

const byMalayalam = (ml) => CONSONANTS.find((letter) => letter.ml === ml);

test("covers all 36 Malayalam consonants once", () => {
  assert.equal(CONSONANTS.length, 36);
  assert.equal(new Set(CONSONANTS.map((letter) => letter.ml)).size, 36);
  assert.deepEqual(
    CONSONANT_GROUPS.map((group) => group.letters.length),
    [5, 5, 5, 5, 5, 11],
  );
});

test("the table spells the letters the standard way", () => {
  const expected = {
    ഞ: "ڿ",
    ങ: "ۼ",
    ട: "ڊ",
    ഡ: "ڗ",
    ണ: "ڹ",
    ള: "ۻ",
    ഴ: "ژ",
    ഷ: "ۺ",
    ര: "ڔ",
    റ: "ر",
    ഘ: "گھ",
    ഥ: "تھ",
    ഹ: "ھ",
  };
  for (const [ml, arabi] of Object.entries(expected)) {
    assert.equal(byMalayalam(ml)?.arabi, arabi, ml);
  }
});

test("every letter is non-empty and carries no vowel mark or sukun", () => {
  for (const letter of CONSONANTS) {
    assert.ok(letter.arabi.length > 0, letter.ml);
    assert.doesNotMatch(letter.arabi, /[ً-ٰٟ]/u, letter.ml);
  }
});

test("letters outside basic Arabic are flagged, and ق خ ا stay unflagged", () => {
  assert.equal(byMalayalam("ഞ")?.extra, true);
  assert.deepEqual(byMalayalam("ഞ")?.addedCodePoints, ["U+06BF"]);
  assert.equal(byMalayalam("ഘ")?.extra, true); // گ and ھ
  assert.deepEqual(byMalayalam("ഘ")?.addedCodePoints, ["U+06AF", "U+06BE"]);
  for (const ml of ["ക", "ഖ", "ത", "ദ", "ന", "മ", "ബ", "ല", "വ", "യ", "ശ", "സ", "റ", "ജ", "ഫ"]) {
    assert.equal(byMalayalam(ml)?.extra, false, ml);
  }
});

test("lists the 13 letters added to Arabic, each with the Malayalam letters it writes", () => {
  assert.equal(ADDED_LETTERS.length, 13);
  const find = (arabi) => ADDED_LETTERS.find((added) => added.arabi === arabi);
  assert.deepEqual(find("ڿ")?.ml, ["ഞ"]);
  assert.deepEqual(find("ھ")?.ml, ["ഹ"]);
  assert.deepEqual(find("گ")?.ml, ["ഗ"]);
});

test("vowels: 13 independent vowels and their spelling after a consonant", () => {
  assert.equal(VOWELS.length, 13);
  const find = (ml) => VOWELS.find((vowel) => vowel.ml === ml);
  assert.equal(find("ആ")?.initial, "آ");
  assert.equal(find("ആ")?.afterKa, "كَا");
  assert.equal(find("ഈ")?.afterKa, "كِي");
  assert.equal(find("ഊ")?.afterKa, "كُو");
  assert.equal(find("എ")?.afterKa, "ك٘");
  assert.equal(find("ഒ")?.afterKa, "كٗ");
});

test("the syllable chart row for ക matches the converter, column by column", () => {
  const row = syllableRow(byMalayalam("ക"));
  assert.equal(row.length, VOWELS.length);
  for (const cell of row) {
    assert.equal(cell.arabi, transliterateMalayalamToArabic(cell.ml).normalize("NFC"));
  }
  assert.deepEqual(
    row.slice(0, 4).map((cell) => cell.ml),
    ["ക", "കാ", "കി", "കീ"],
  );
});

test("chillu letters, digits and rule examples are all generated, never empty", () => {
  assert.ok(CHILLUS.every((chillu) => chillu.arabi.length > 0));
  assert.equal(DIGITS.map((digit) => digit.arabi).join(""), "۰۱۲۳۴۵۶۷۸۹");
  for (const rule of SPELLING_RULES) {
    assert.ok(rule.examples.length > 0, rule.title);
    for (const example of rule.examples) assert.ok(example.arabi.length > 0, example.ml);
  }
});

test("the three conventional conjunct spellings appear in the rules", () => {
  const conjuncts = SPELLING_RULES.find((rule) => rule.title.startsWith("Letters that join"));
  const spelled = Object.fromEntries(conjuncts.examples.map((e) => [e.ml, e.arabi]));
  assert.equal(spelled["ങ്ക"], "نْكَ");
  assert.equal(spelled["ന്റ"], "نْڔَ");
  assert.equal(spelled["റ്റ"], "ڔَّ");
});

test("loanword samples show the Arabic spelling next to the letter-by-letter one", () => {
  assert.ok(LOANWORDS.length >= 10);
  const salath = LOANWORDS.find((word) => word.ml === "സ്വലാത്ത്");
  assert.equal(salath?.spelling, "صَلَاة");
  assert.notEqual(salath?.letterByLetter, salath?.spelling);
  for (const word of LOANWORDS) assert.notEqual(word.spelling, word.letterByLetter, word.ml);
});
