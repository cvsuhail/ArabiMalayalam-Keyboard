import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ARABIC_LOANWORDS, arabicSpellingForMalayalam } from "./arabicLoanwords.ts";
import { registerLexiconText } from "./malayalamLexicon.ts";
import {
  getSmartTransliterationCandidates,
  transliterateMalayalamText,
} from "./smartManglishLayer.ts";

registerLexiconText(
  readFileSync(new URL("../../../public/lexicon/ml-words.txt", import.meta.url), "utf8"),
);

const top = async (word) => (await getSmartTransliterationCandidates(word, 6))[0]?.text;

test("no Malayalam or Manglish spelling points at two different Arabic words", () => {
  const malayalam = new Map();
  const roman = new Map();
  for (const entry of ARABIC_LOANWORDS) {
    for (const spelling of entry.malayalam) {
      const key = spelling.normalize("NFC");
      assert.ok(!malayalam.has(key) || malayalam.get(key) === entry.arabic, `${key} is ambiguous`);
      malayalam.set(key, entry.arabic);
    }
    for (const spelling of entry.roman) {
      const key = spelling.replace(/[^a-z]/g, "");
      assert.ok(!roman.has(key) || roman.get(key) === entry.arabic, `${key} is ambiguous`);
      roman.set(key, entry.arabic);
    }
  }
});

test("Allah, in every common Malayalam spelling, keeps its Arabic spelling", () => {
  for (const word of ["അല്ലാഹ്", "അള്ളാഹ്", "അള്ളാ"]) {
    assert.equal(transliterateMalayalamText(word), "اللّٰه", word);
  }
  assert.equal(transliterateMalayalamText("അള്ളാഹു"), "اللّٰهُ");
  // "alla" is the Malayalam word അല്ല, not Allah.
  assert.notEqual(arabicSpellingForMalayalam("അല്ല"), "اللّٰه");
});

test("sheikh takes خ, not the ق that plain ഖ gives", () => {
  for (const word of ["ശൈഖ്", "ശൈഖ", "ശെയ്ഖ്", "ഷെയ്ഖ്"]) {
    assert.equal(transliterateMalayalamText(word), "شَيْخ", word);
  }
});

test("qabr (khabar) takes ق and ب", () => {
  for (const word of ["ഖബർ", "ഖബ്ർ", "ഖബര്"]) {
    assert.equal(transliterateMalayalamText(word), "قَبْر", word);
  }
});

test("Sufi and Mappila-literature terms use their Arabic spelling", () => {
  const cases = {
    ഖാദിരി: "قَادِرِيّ",
    ഖാദിരിയ്യ: "قَادِرِيَّة",
    ജീലാനി: "جِيلَانِيّ",
    കൈലാനി: "جِيلَانِيّ",
    മുഹ്‌യിദ്ദീൻ: "مُحْيِي الدِّين",
    മുഹ്യിദ്ദീൻ: "مُحْيِي الدِّين",
    മുഹിയുദ്ദീൻ: "مُحْيِي الدِّين",
    ഖിലാഫത്ത്: "خِلَافَة",
    ത്വരീഖത്ത്: "طَرِيقَة",
    ഔലിയ: "أَوْلِيَاء",
    ശഹീദ്: "شَهِيد",
    ജിഹാദ്: "جِهَاد",
    ഇഷ്ക്: "عِشْق",
    സുൽത്താൻ: "سُلْطَان",
    സയ്യിദ്: "سَيِّد",
    ഹിജ്റ: "هِجْرَة",
    ബൈത്ത്: "بَيْت",
  };
  for (const [word, arabic] of Object.entries(cases)) {
    assert.equal(transliterateMalayalamText(word), arabic, word);
  }
});

test("names of the Prophet's family and companions use their Arabic spelling", () => {
  const cases = {
    ഫാത്തിമ: "فَاطِمَة",
    ആയിഷ: "عَائِشَة",
    ഖദീജ: "خَدِيجَة",
    സൈനബ്: "زَيْنَب",
    ഹുസൈൻ: "حُسَيْن",
    ഉസ്മാൻ: "عُثْمَان",
    അബൂബക്കർ: "أَبُو بَكْر",
    ഇബ്രാഹിം: "إِبْرَاهِيم",
    അബ്ദുല്ല: "عَبْدُ اللّٰه",
    അബ്ദുറഹ്മാൻ: "عَبْدُ الرَّحْمَن",
  };
  for (const [word, arabic] of Object.entries(cases)) {
    assert.equal(transliterateMalayalamText(word), arabic, word);
  }
});

test("multi-word Malayalam loanwords are found in running text", () => {
  assert.equal(transliterateMalayalamText("ഇൻശാ അല്ലാഹ്"), "إِنْ شَاءَ اللّٰه");
  assert.equal(transliterateMalayalamText("അബ്ദുൽ ഖാദിർ ജീലാനി"), "عَبْدُ الْقَادِر جِيلَانِيّ");
  assert.equal(transliterateMalayalamText("നിസാഉൽ ഇസ്ലാം"), "نِسَاءُ الْإِسْلَام");
  assert.equal(
    transliterateMalayalamText("ഞാൻ ഇൻശാ അല്ലാഹ് വരാം"),
    "ڿَانْ إِنْ شَاءَ اللّٰه وَڔَامْ",
  );
  // A phrase inside a longer word is left alone.
  assert.doesNotMatch(transliterateMalayalamText("ഇൻശാ അല്ലാഹുവിന്"), /^إِنْ شَاءَ/u);
});

test("case endings keep the Arabic stem (ഖബറിൽ, ശൈഖിന്റെ, ഹദീസുകൾ)", () => {
  const cases = {
    ഖബറിൽ: "قَبْرِلْ",
    ഖബറുകൾ: "قَبْرُكَۻْ",
    ശൈഖിന്റെ: "شَيْخِنْڔ٘",
    ശൈഖുമാർ: "شَيْخُمَارْ",
    ഹദീസിൽ: "حَدِيثِلْ",
    ഹദീസുകൾ: "حَدِيثُكَۻْ",
    ഖിലാഫത്തിന്റെ: "خِلَافَتِنْڔ٘",
  };
  for (const [word, arabic] of Object.entries(cases)) {
    assert.equal(transliterateMalayalamText(word), arabic, word);
  }
});

test("ordinary Malayalam words with similar endings are not mistaken for loanwords", () => {
  for (const word of ["വീട്ടിൽ", "പുസ്തകത്തിൽ", "മലയാളത്തിൽ", "മാപ്പിള"]) {
    assert.doesNotMatch(
      transliterateMalayalamText(word),
      /[قخحعص]/u,
      `${word} -> ${transliterateMalayalamText(word)}`,
    );
  }
  assert.equal(arabicSpellingForMalayalam("വീട്ടിൽ"), undefined);
});

test("Manglish loanwords offer the Arabic spelling first", async () => {
  const cases = {
    khabar: "قَبْر",
    qabr: "قَبْر",
    sheikh: "شَيْخ",
    shaikh: "شَيْخ",
    allah: "اللّٰه",
    khilafath: "خِلَافَة",
    jilani: "جِيلَانِيّ",
    muhyiddin: "مُحْيِي الدِّين",
    shaheed: "شَهِيد",
    fathima: "فَاطِمَة",
    aisha: "عَائِشَة",
    khadeeja: "خَدِيجَة",
    hussain: "حُسَيْن",
    abubakar: "أَبُو بَكْر",
    ibrahim: "إِبْرَاهِيم",
    usman: "عُثْمَان",
  };
  for (const [roman, arabic] of Object.entries(cases)) {
    assert.equal(await top(roman), arabic, roman);
  }
});
