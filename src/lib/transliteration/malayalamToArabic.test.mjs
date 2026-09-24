import assert from "node:assert/strict";
import test from "node:test";

import {
  transliterateMalayalamToArabic as transliterate,
  withStandardOMarks,
} from "./malayalamToArabic.ts";

test("transliterates every independent vowel", () => {
  assert.equal(transliterate("അആഇഈഉഊഋൠഌൡഎഏഐഒഓഔ"), "اَاٰاِاِیاُاُورْرّْلْلّْا٘ا٘یاَیاٗاٗواَو");
});

test("applies every dependent vowel to a consonant", () => {
  const cases = {
    ക: "کَ",
    കാ: "کا",
    കി: "کِ",
    കീ: "کِي",
    കു: "کُ",
    കൂ: "کُو",
    കൃ: "کْر",
    കൄ: "کْرّ",
    കൢ: "کْل",
    കൣ: "کْلّ",
    കെ: "ک٘",
    കേ: "ک٘ی",
    കൈ: "کَی",
    കൊ: "کٗ",
    കോ: "کٗو",
    കൌ: "کَو",
    കൗ: "کَو",
    ക്: "کْ",
  };

  for (const [source, expected] of Object.entries(cases)) {
    assert.equal(transliterate(source), expected, source);
  }
});

test("applies harakat after geminated and irregular conjuncts", () => {
  const cases = {
    ക്ക: "کَّ",
    ക്കി: "کِّ",
    ക്കൂ: "کُّو",
    ക്കേ: "کّ٘ی",
    ക്കോ: "کّٗو",
    ക്ക്: "کّْ",
    ക്ഷി: "کْشِ",
    ജ്ഞാ: "جْڿا",
    ശ്രേ: "شْر٘ی",
    സ്രോ: "سْرٗو",
    ഹ്രൗ: "حْرَو",
    സ്വാ: "صا",
    ദ്ധി: "دّھِ",
    ങ്കു: "نْکُ",
    ന്റേ: "نْڔ٘ی",
    റ്റോ: "ڔّٗو",
    ഞ്ച: "ڿْچَ",
    ന്തി: "نْتِ",
    മ്പൂ: "مْپُو",
  };

  for (const [source, expected] of Object.entries(cases)) {
    assert.equal(transliterate(source), expected, source);
  }
});

test("supports combining marks, modern chillus, and legacy chillu sequences", () => {
  assert.equal(transliterate("കം കഃ കഁ കഀ"), "کَمْ کَحْ کَنْ کَنْ");
  assert.equal(transliterate("ൻ ർ ൽ ൾ ൺ ൿ ൔ ൕ ൖ"), "نْ رْ لْ ۻْ ڹْ کْ مْ یْ ژْ");
  assert.equal(transliterate("ന്\u200D ക്\u200D"), "نْ کْ");
});

test("normalizes both Unicode spellings of dependent au", () => {
  assert.equal(transliterate("കൗ"), "کَو");
  assert.equal(transliterate("കൌ"), "کَو");
});

test("converts Malayalam digits and punctuation and preserves other text", () => {
  assert.equal(transliterate("൦൧൨൩൪൫൬൭൮൯൹"), "۰۱۲۳۴۵۶۷۸۹۔");
  assert.equal(transliterate("മലയാളം test 123! عربي"), "مَلَیاۻَمْ test 123! عربي");
});

test("converts complete sentences and paragraphs without losing layout", () => {
  assert.equal(
    transliterate("മലയാളം ഒരു ഭാഷയാണ്.\nഇത് രണ്ടാം വരിയാണ്!"),
    "مَلَیاۻَمْ اٗڔُ بّاشَّیاڹْ.\nاِتْ ڔَڹْڈامْ وَڔِیاڹْ!",
  );
});

test("handles curated phrases without changing surrounding spacing", () => {
  assert.equal(transliterate("അല്ലാഹു മുഹമ്മദ്"), "اللهُ مُحَمَّدْ");
  assert.equal(transliterate("ബിസ്മില്ലാഹി റഹ്മാനി റഹീം"), "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ");
});

test("offers a standard-damma variant for o and oo", () => {
  assert.equal(withStandardOMarks(transliterate("ഒ ഓ കൊ കോ")), "اُ اُو کُ کُو");
});
