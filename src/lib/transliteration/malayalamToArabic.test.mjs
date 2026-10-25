import assert from "node:assert/strict";
import test from "node:test";

import {
  transliterateMalayalamToArabic as transliterate,
  withStandardOMarks,
} from "./malayalamToArabic.ts";

// Marks and letters spelled out so expected strings are unambiguous. Expected
// values are written in reading order and compared in Unicode canonical order.
const FA = "َ"; // fatha
const KA = "ِ"; // kasra
const DA = "ُ"; // damma
const SU = "ْ"; // sukun
const SH = "ّ"; // shadda
const E = "٘"; // Arabi-Malayalam e
const O = "ٗ"; // Arabi-Malayalam o (inverted damma)
const K = "ك"; // ക
const Y = "ي"; // യ and long-vowel yeh (dotted Arabic yeh)
const H = "ھ"; // ഹ, and the aspiration mark
const AA = `${FA}ا`; // long ā: fatha + alef

const expectArabic = (source, expected) =>
  assert.equal(transliterate(source), expected.normalize("NFC"), source);

test("transliterates every independent vowel", () => {
  expectArabic(
    "അആഇഈഉഊഋൠഌൡഎഏഐഒഓഔ",
    `ا${FA}آا${KA}ا${KA}${Y}ا${DA}ا${DA}ور${SU}ر${SH}${SU}ل${SU}ل${SH}${SU}ا${E}ا${E}${Y}ا${FA}${Y}${SU}ا${O}ا${O}وا${FA}و${SU}`,
  );
});

test("applies every dependent vowel to a consonant", () => {
  const cases = {
    ക: K + FA,
    കാ: K + AA,
    കി: K + KA,
    കീ: K + KA + Y,
    കു: K + DA,
    കൂ: `${K}${DA}و`,
    കൃ: `${K}${SU}ر${SU}`,
    കൄ: `${K}${SU}ر${SH}${SU}`,
    കൢ: `${K}${SU}ل${SU}`,
    കൣ: `${K}${SU}ل${SH}${SU}`,
    കെ: K + E,
    കേ: K + E + Y,
    കൈ: K + FA + Y + SU,
    കൊ: K + O,
    കോ: `${K}${O}و`,
    കൌ: `${K}${FA}و${SU}`,
    കൗ: `${K}${FA}و${SU}`,
    ക്: K + SU,
  };

  for (const [source, expected] of Object.entries(cases)) expectArabic(source, expected);
});

test("marks every long ā with fatha + alef", () => {
  expectArabic("കാണാൻ", `${K}${AA}ڹ${AA}ن${SU}`);
  expectArabic("ആന", `آن${FA}`);
});

test("uses the standard Arabi-Malayalam letters", () => {
  const cases = {
    ഞ: "ڿ" + FA,
    ങ: "ۼ" + FA,
    ട: "ڊ" + FA,
    ഡ: "ڗ" + FA,
    ണ: "ڹ" + FA,
    ള: "ۻ" + FA,
    ഴ: "ژ" + FA,
    ഷ: "ۺ" + FA,
    ശ: "ش" + FA,
    ര: "ڔ" + FA,
    റ: "ر" + FA,
    ഗ: "گ" + FA,
    ഖ: "ق" + FA,
    ഹ: H + FA,
    യ: Y + FA,
  };

  for (const [source, expected] of Object.entries(cases)) expectArabic(source, expected);
});

test("writes ഹ as ھ with its own vowel marks", () => {
  expectArabic("ഹി", H + KA);
  expectArabic("ഹ്ഹ", H + SH + FA);
  expectArabic("സ്നേഹം", `س${SU}ن${E}${Y}${H}${FA}م${SU}`);
});

test("writes aspirates with ھ so they never collide with doubled letters", () => {
  expectArabic("ഥ", `ت${FA}${H}`);
  expectArabic("ത്ത", `ت${SH}${FA}`);
  expectArabic("ധ", `د${FA}${H}`);
  expectArabic("ദ", `د${FA}`);
  expectArabic("ഘ ഛ ഝ ഠ ഢ ഭ", `گ${FA}${H} چ${FA}${H} ج${FA}${H} ڊ${FA}${H} ڗ${FA}${H} ب${FA}${H}`);
  assert.notEqual(transliterate("ഷ"), transliterate("ശ്ശ"));

  // Vowel marks sit on the base letter, before ھ.
  expectArabic("ഥി", `ت${KA}${H}`);
  expectArabic("ഭാ", `ب${FA}${H}ا`);
  expectArabic("ഥ്", `ت${SU}${H}`);
  // An aspirate doubled on its own base takes shadda: ദ്ധ, ത്ഥ.
  expectArabic("ദ്ധി", `د${SH}${KA}${H}`);
  expectArabic("ത്ഥ", `ت${SH}${FA}${H}`);
  // Aspirate inside a cluster: ഭ്രാ.
  expectArabic("ഭ്രാ", `ب${SU}${H}ڔ${AA}`);
});

test("applies harakat after geminated and irregular conjuncts", () => {
  const cases = {
    ക്ക: K + SH + FA,
    ക്കി: K + SH + KA,
    ക്കൂ: `${K}${SH}${DA}و`,
    ക്കേ: K + SH + E + Y,
    ക്കോ: `${K}${SH}${O}و`,
    ക്ക്: K + SH + SU,
    ക്ഷി: `${K}${SU}ۺ${KA}`,
    ജ്ഞാ: `ج${SU}ڿ${AA}`,
    ശ്രേ: `ش${SU}ڔ${E}${Y}`,
    ങ്കു: `ن${SU}${K}${DA}`,
    ന്റേ: `ن${SU}ڔ${E}${Y}`,
    റ്റോ: `ڔ${SH}${O}و`,
    ഞ്ച: `ڿ${SU}چ${FA}`,
    ണ്ട: `ڹ${SU}ڊ${FA}`,
    ന്തി: `ن${SU}ت${KA}`,
    മ്പൂ: `م${SU}پ${DA}و`,
  };

  for (const [source, expected] of Object.entries(cases)) expectArabic(source, expected);
});

test("reads native സ്വ letter by letter (ص comes only from Arabic loanwords)", () => {
  expectArabic("സ്വന്തം", `س${SU}و${FA}ن${SU}ت${FA}م${SU}`);
  expectArabic("സ്വാ", `س${SU}و${AA}`);
});

test("writes anusvara before ക ഖ ഗ ഘ as ۼ", () => {
  expectArabic("അംഗം", `ا${FA}ۼ${SU}گ${FA}م${SU}`);
  expectArabic("ശംഖ്", `ش${FA}ۼ${SU}ق${SU}`);
  expectArabic("ടുംകൂടി", `ڊ${DA}ۼ${SU}${K}${DA}وڊ${KA}`);
  expectArabic("കം", `${K}${FA}م${SU}`);
});

test("supports combining marks, modern chillus, and legacy chillu sequences", () => {
  expectArabic("കം കഃ കഁ കഀ", `${K}${FA}م${SU} ${K}${FA}${H}${SU} ${K}${FA}ن${SU} ${K}${FA}ن${SU}`);
  expectArabic(
    "ൻ ർ ൽ ൾ ൺ ൿ ൔ ൕ ൖ",
    `ن${SU} ر${SU} ل${SU} ۻ${SU} ڹ${SU} ${K}${SU} م${SU} ${Y}${SU} ژ${SU}`,
  );
  expectArabic("ന്‍ ക്‍", `ن${SU} ${K}${SU}`);
});

test("outputs marks in Unicode canonical order", () => {
  for (const word of ["ക്കി", "ത്തു", "ദ്ധി", "കാണാൻ", "മനുഷ്യരെല്ലാവരും"]) {
    const output = transliterate(word);
    assert.equal(output, output.normalize("NFC"), word);
  }
  // Vowel mark before shadda, as the sample texts and other Arabic text store it.
  assert.equal(transliterate("ക്കി"), `${K}${KA}${SH}`);
});

test("converts Malayalam digits and punctuation and preserves other text", () => {
  expectArabic("൦൧൨൩൪൫൬൭൮൯൹", "۰۱۲۳۴۵۶۷۸۹۔");
  expectArabic("മലയാളം test 123! عربي", `م${FA}ل${FA}${Y}${AA}ۻ${FA}م${SU} test 123! عربي`);
});

test("converts complete sentences and paragraphs without losing layout", () => {
  expectArabic(
    "മലയാളം ഒരു ഭാഷയാണ്.\nഇത് രണ്ടാം വരിയാണ്!",
    `م${FA}ل${FA}${Y}${AA}ۻ${FA}م${SU} ا${O}ڔ${DA} ب${FA}${H}اۺ${FA}${Y}${AA}ڹ${SU}.\n` +
      `ا${KA}ت${SU} ڔ${FA}ڹ${SU}ڊ${AA}م${SU} و${FA}ڔ${KA}${Y}${AA}ڹ${SU}!`,
  );
});

test("handles multi-word phrases without changing surrounding spacing", () => {
  expectArabic("ബിസ്മില്ലാഹി റഹ്മാനി റഹീം", "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ");
  expectArabic("അസ്സലാമു അലൈക്കും!", "اَلسَّلَامُ عَلَيْكُمْ!");
  expectArabic("നബി (സ്വ)", `ن${FA}ب${KA} ﷺ`);
});

test("offers a standard-damma variant for o and oo", () => {
  assert.equal(
    withStandardOMarks(transliterate("ഒ ഓ കൊ കോ")),
    `ا${DA} ا${DA}و ${K}${DA} ${K}${DA}و`,
  );
});
