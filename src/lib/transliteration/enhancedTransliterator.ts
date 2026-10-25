import { transliterateMalayalamToArabic, withStandardOMarks } from "./malayalamToArabic.ts";
import { generateMalayalamSpellings } from "./manglishPhonetic.ts";
import {
  isLexiconPrefix,
  lexiconBoost,
  lexiconSize,
  registerLexiconEntries,
} from "./malayalamLexicon.ts";
import { loanwordMalayalamSpellings } from "./arabicLoanwords.ts";

/**
 * Manglish -> Malayalam and Malayalam -> Arabi-Malayalam building blocks.
 *
 * Every Arabi-Malayalam spelling is produced from Malayalam by the single
 * rule engine in malayalamToArabic.ts (or, for Arabic loanwords, taken from
 * arabicLoanwords.ts), so all suggestions share one consistent orthography.
 */

export const transliterateToArabic = transliterateMalayalamToArabic;

/**
 * Curated Manglish spellings whose Malayalam form the phonetic rules cannot
 * reach, or where a common spelling is ambiguous. Keep only true spelling
 * variants of one word here, never a different inflection.
 */
export const MANGLISH_TO_MALAYALAM_MAP: Record<string, string[]> = {
  hello: ["ഹലോ"],
  njan: ["ഞാൻ"],
  njaan: ["ഞാൻ"],
  njanum: ["ഞാനും"],
  njananu: ["ഞാനാണ്"],
  njanennu: ["ഞാനെന്ന്"],
  namaskaram: ["നമസ്കാരം"],
  vellam: ["വെള്ളം"],
  veedu: ["വീട്"],
  veettil: ["വീട്ടിൽ"],
  ente: ["എന്റെ"],
  entethu: ["എന്റേത്"],
  ningal: ["നിങ്ങൾ"],
  ningalude: ["നിങ്ങളുടെ"],
  njangal: ["ഞങ്ങൾ"],
  njangalude: ["ഞങ്ങളുടെ"],
  njangalkk: ["ഞങ്ങൾക്ക്"],
  njangalkku: ["ഞങ്ങൾക്ക്"],
  ningalkku: ["നിങ്ങൾക്ക്"],
  ningalkk: ["നിങ്ങൾക്ക്"],
  enikku: ["എനിക്ക്"],
  enikk: ["എനിക്ക്"],
  ninakku: ["നിനക്ക്"],
  ninakk: ["നിനക്ക്"],
  nammal: ["നമ്മൾ"],
  namukk: ["നമുക്ക്"],
  namukku: ["നമുക്ക്"],
  sukhamano: ["സുഖമാണോ"],
  sukhamanu: ["സുഖമാണ്"],
  sukham: ["സുഖം"],
  poyi: ["പോയി"],
  vannu: ["വന്നു"],
  kazhichu: ["കഴിച്ചു"],
  kazhicho: ["കഴിച്ചോ"],
  entha: ["എന്താ"],
  enthanu: ["എന്താണ്"],
  evide: ["എവിടെ"],
  evideya: ["എവിടെയാ"],
  evidayanu: ["എവിടെയാണ്"],
  aaru: ["ആര്"],
  aar: ["ആര്"],
  aaranu: ["ആരാണ്"],
  eppol: ["എപ്പോൾ"],
  eppo: ["എപ്പോ"],
  eppozha: ["എപ്പോഴാ"],
  eppozhanu: ["എപ്പോഴാണ്"],
  eppozhum: ["എപ്പോഴും"],
  engane: ["എങ്ങനെ"],
  enganeya: ["എങ്ങനെയാ"],
  enganeyanu: ["എങ്ങനെയാണ്"],
  nanni: ["നന്ദി"],
  pusthakam: ["പുസ്തകം"],
  kutty: ["കുട്ടി"],
  kutti: ["കുട്ടി"],
  amma: ["അമ്മ"],
  uppa: ["ഉപ്പ"],
  umma: ["ഉമ്മ"],
  nalla: ["നല്ല"],
  onnu: ["ഒന്ന്"],
  randu: ["രണ്ട്"],
  moonnu: ["മൂന്ന്"],
  naalu: ["നാല്"],
  anju: ["അഞ്ച്"],
  ezhu: ["ഏഴ്"],
  ettu: ["എട്ട്"],
  onpathu: ["ഒൻപത്"],
  pathu: ["പത്ത്"],
  ezhuthuka: ["എഴുതുക"],
  ezhuthu: ["എഴുത്ത്"],
  vaayikkuka: ["വായിക്കുക"],
  vaayikkunnu: ["വായിക്കുന്നു"],
  vaayichu: ["വായിച്ചു"],
  vaayana: ["വായന"],
  arabi: ["അറബി"],
  arabic: ["അറബിക്"],
  malayalam: ["മലയാളം"],
  arabimalayalam: ["അറബിമലയാളം"],
  chothichu: ["ചോദിച്ചു"],
  chodichu: ["ചോദിച്ചു"],
  paranju: ["പറഞ്ഞു"],
  ariyilla: ["അറിയില്ല"],
  ariyaam: ["അറിയാം"],
  ariyamo: ["അറിയാമോ"],
  cheyyuka: ["ചെയ്യുക"],
  cheythu: ["ചെയ്തു"],
  pokuka: ["പോകുക"],
  povaam: ["പോവാം"],
  povam: ["പോവാം"],
  pokam: ["പോകാം"],
  pokaam: ["പോകാം"],
  varuka: ["വരുക"],
  varaam: ["വരാം"],
  varam: ["വരാം"],
  varunnu: ["വരുന്നു"],
  ippol: ["ഇപ്പോൾ"],
  appol: ["അപ്പോൾ"],
  ivide: ["ഇവിടെ"],
  avide: ["അവിടെ"],
  ithu: ["ഇത്"],
  athu: ["അത്"],
  engottu: ["എങ്ങോട്ട്"],
  ingottu: ["ഇങ്ങോട്ട്"],
  angottu: ["അങ്ങോട്ട്"],
  sathyam: ["സത്യം"],
  sneham: ["സ്നേഹം"],
  santhosham: ["സന്തോഷം"],
  venam: ["വേണം"],
  venda: ["വേണ്ട"],
  pattum: ["പറ്റും"],
  pattilla: ["പറ്റില്ല"],
  kazhikkam: ["കഴിക്കാം"],
  parayaam: ["പറയാം"],
  parayam: ["പറയാം"],
  cheyyaam: ["ചെയ്യാം"],
  cheyyam: ["ചെയ്യാം"],
  enth: ["എന്ത്"],
  enthu: ["എന്ത്"],
  enthina: ["എന്തിനാ"],
  enthinaan: ["എന്തിനാണ്"],
  parayunnu: ["പറയുന്നു"],
  niskaram: ["നിസ്കാരം"],
  nomb: ["നോമ്പ്"],
  nombu: ["നോമ്പ്"],
  perunnal: ["പെരുന്നാൾ"],
  // Place names the phonetic rules cannot reach.
  keralam: ["കേരളം"],
  kerala: ["കേരള"],
  kozhikode: ["കോഴിക്കോട്"],
  calicut: ["കോഴിക്കോട്"],
  thrissur: ["തൃശ്ശൂർ"],
  thrishur: ["തൃശ്ശൂർ"],
  trivandrum: ["തിരുവനന്തപുരം"],
  thiruvananthapuram: ["തിരുവനന്തപുരം"],
  kasaragod: ["കാസർകോട്"],
  kasargod: ["കാസർകോട്"],
  malappuram: ["മലപ്പുറം"],
  kannur: ["കണ്ണൂർ"],
  ponnani: ["പൊന്നാനി"],
  tirur: ["തിരൂർ"],
  thalassery: ["തലശ്ശേരി"],
};

/**
 * Kerala and Mappila vocabulary that a subtitle-derived frequency list
 * under-represents. Registered with a moderate frequency so these rank as
 * real words.
 */
const SUPPLEMENTARY_WORDS = [
  // Places
  "കേരളം",
  "കോഴിക്കോട്",
  "മലപ്പുറം",
  "കണ്ണൂർ",
  "തൃശ്ശൂർ",
  "തിരുവനന്തപുരം",
  "കൊച്ചി",
  "എറണാകുളം",
  "പാലക്കാട്",
  "വയനാട്",
  "കാസർകോട്",
  "കൊല്ലം",
  "ആലപ്പുഴ",
  "കോട്ടയം",
  "ഇടുക്കി",
  "പത്തനംതിട്ട",
  "പൊന്നാനി",
  "തിരൂർ",
  "മഞ്ചേരി",
  "കൊണ്ടോട്ടി",
  "വടകര",
  "തലശ്ശേരി",
  "മലബാർ",
  "ഗൾഫ്",
  "ദുബായ്",
  "സൗദി",
  "ഖത്തർ",
  // Family
  "ഉമ്മ",
  "ഉപ്പ",
  "ഇക്ക",
  "ഇത്ത",
  "ഉമ്മാമ",
  "ഉപ്പാപ്പ",
  "ഇക്കാക്ക",
  "താത്ത",
  "മാമ",
  "മൂത്താപ്പ",
  "എളാപ്പ",
  "എളേമ",
  "അമ്മായി",
  "കാക്ക",
  "ബാപ്പ",
  "മോൻ",
  "മോള്",
  // Faith and community
  "നിസ്കാരം",
  "നിസ്കരിക്കുക",
  "നോമ്പ്",
  "പള്ളി",
  "മദ്രസ",
  "ഉസ്താദ്",
  "മൗലവി",
  "മുസ്ലിയാർ",
  "ഖാസി",
  "പെരുന്നാൾ",
  "ബലിപെരുന്നാൾ",
  "ചെറിയപെരുന്നാൾ",
  "ഇഫ്താർ",
  "അത്താഴം",
  "നേർച്ച",
  "മൗലിദ്",
  "റാത്തീബ്",
  "മഹല്ല്",
  "ഖബർ",
  "ഖബർസ്ഥാൻ",
  "മയ്യിത്ത്",
  "യാസീൻ",
  "തക്ബീർ",
  // Clothing, food, culture
  "കുപ്പായം",
  "തട്ടം",
  "മുണ്ട്",
  "തൊപ്പി",
  "പർദ്ദ",
  "കാച്ചി",
  "പത്തിരി",
  "ബിരിയാണി",
  "നെയ്ച്ചോർ",
  "ഉന്നക്കായ",
  "ഈത്തപ്പഴം",
  "സുലൈമാനി",
  "കട്ടൻ",
  "മാപ്പിള",
  "മാപ്പിളപ്പാട്ട്",
  "ഒപ്പന",
  "ദഫ്മുട്ട്",
  "കോൽക്കളി",
  // Home, food and farm
  "പാടം",
  "നെല്ല്",
  "വാഴ",
  "ചക്ക",
  "കപ്പ",
  "പപ്പടം",
  "പായസം",
  "ഉണ്ണിയപ്പം",
  "പുട്ട്",
  "ദോശ",
  "ഇഡ്ഡലി",
  "സാമ്പാർ",
  "അവിയൽ",
  "തോരൻ",
  "പാവയ്ക്ക",
  "വെണ്ടയ്ക്ക",
  "സവാള",
  "ഇഞ്ചി",
  "വള",
  "കമ്മൽ",
  "പട്ട്",
  "നടു",
  // Language and writing
  "അറബി",
  "മലയാളം",
  "അറബിമലയാളം",
  "ലിപി",
  "അക്ഷരം",
  "ഭാഷ",
  "വാക്ക്",
  "വാചകം",
  "പഠിക്കുക",
  "എഴുതുക",
  "വായിക്കുക",
  "സുഖം",
  "സുഖമാണോ",
  "സുഖമാണ്",
  "നമസ്കാരം",
];

const SUPPLEMENTARY_FREQUENCY = 150;

registerLexiconEntries(
  [
    ...SUPPLEMENTARY_WORDS,
    ...loanwordMalayalamSpellings(),
    ...Object.values(MANGLISH_TO_MALAYALAM_MAP).flat(),
  ].map((malayalam) => ({ malayalam, frequency: SUPPLEMENTARY_FREQUENCY })),
);

/** Weight of one unit of phonetic cost against the lexicon frequency boost. */
export const PHONETIC_COST_WEIGHT = 40;

/**
 * Ranked Malayalam spellings for a Manglish word from the phonetic rules,
 * scored against the lexicon: higher is better.
 */
export function phoneticMalayalamCandidates(
  word: string,
  limit = 12,
): Array<{ text: string; cost: number; score: number }> {
  // With a loaded lexicon, generate widely and let attested words float up.
  const guided = lexiconSize() > 0;
  return generateMalayalamSpellings(word, {
    limit: guided ? 64 : limit,
    ...(guided ? { isKnownPrefix: isLexiconPrefix } : {}),
  })
    .map(({ text, cost }) => ({
      text,
      cost,
      score: lexiconBoost(text) - cost * PHONETIC_COST_WEIGHT,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Known-word Malayalam prefixes for an unfinished Manglish word, for completion. */
export function openMalayalamPrefixes(word: string, limit = 3): string[] {
  if (lexiconSize() === 0) return [];
  return generateMalayalamSpellings(word, {
    limit: limit * 4,
    open: true,
    isKnownPrefix: isLexiconPrefix,
  })
    .filter(({ text }) => isLexiconPrefix(text))
    .slice(0, limit)
    .map(({ text }) => text);
}

/** Convert a Manglish word into Malayalam candidates, best first. */
export function manglishToMalayalam(word: string): string[] {
  const normalized = word
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!normalized) return [];

  const results = new Set<string>(MANGLISH_TO_MALAYALAM_MAP[normalized] ?? []);
  for (const { text } of phoneticMalayalamCandidates(word, 6)) results.add(text);
  return [...results];
}

/**
 * Arabi-Malayalam spellings for a Malayalam word: the inverted-damma (ٗ)
 * spelling of o/oo first, then the plain-damma variant when it differs.
 */
export function convertMalayalamToArabiMalayalam(ml: string): string[] {
  const primary = transliterateMalayalamToArabic(ml);
  const standardOVariant = withStandardOMarks(primary);
  return standardOVariant === primary ? [primary] : [primary, standardOVariant];
}

// Unvocalized Arabic -> fully vocalized spelling for Arabic typed directly.
export const ARABIC_TO_ARABI_MALAYALAM_VOCABULARY: Record<string, string[]> = {
  سلام: ["سَلَام", "السَّلَام"],
  كتاب: ["كِتَاب", "الكِتَاب"],
  الله: ["اللّٰه", "اللّٰهُ"],
  محمد: ["مُحَمَّد"],
  قران: ["قُرْآن", "القُرْآن"],
  قرآن: ["قُرْآن", "القُرْآن"],
  صلاة: ["صَلَاة", "الصَّلَاة", "صَلَوَات"],
  مسجد: ["مَسْجِد", "المَسْجِد"],
  علم: ["عِلْم", "العِلْم"],
  طالب: ["طَالِب"],
  استاذ: ["أُسْتَاذ"],
  مدرسة: ["مَدْرَسَة", "المَدْرَسَة"],
  دعاء: ["دُعَاء", "الدُّعَاء"],
  نور: ["نُور", "النُّور"],
  حق: ["حَقّ", "الحَقّ"],
  صبر: ["صَبْر", "الصَّبْر"],
  شكر: ["شُكْر", "الشُّكْر"],
  رمضان: ["رَمَضَان"],
  عيد: ["عِيد", "العِيد"],
  جمعة: ["جُمُعَة", "الجُمُعَة"],
  حديث: ["حَدِيث", "الحَدِيث"],
  فقه: ["فِقْه", "الفِقْه"],
  توبة: ["تَوْبَة"],
  استغفار: ["اِسْتِغْفَار"],
  مكة: ["مَكَّة", "مَكَّةُ المُكَرَّمَة"],
  مدينة: ["مَدِينَة", "المَدِينَةُ المُنَوَّرَة"],
  جنة: ["جَنَّة", "الجَنَّة"],
  جهنم: ["جَهَنَّم"],
  ايمان: ["إِيمَان", "الإِيمَان"],
  اسلام: ["إِسْلَام", "الإِسْلَام"],
  احسان: ["إِحْسَان"],
  رسول: ["رَسُول", "الرَّسُول"],
  نبي: ["نَبِيّ", "النَّبِيّ"],
  شيخ: ["شَيْخ", "الشَّيْخ"],
  بيت: ["بَيْت", "البَيْت"],
  قلب: ["قَلْب", "القَلْب"],
  روح: ["رُوح", "الرُّوح"],
  دنيا: ["دُنْيَا", "الدُّنْيَا"],
  بركة: ["بَرَكَة", "بَرَكَات"],
  رحمة: ["رَحْمَة", "رَحْمَةُ اللّٰه"],
};

/** Strips Arabic harakat/tashkeel diacritics for clean base lookup. */
export function stripArabicDiacritics(text: string): string {
  return text.replace(/[ً-ٰٟ]/g, "");
}

/**
 * Candidates for Arabic typed directly: vocalized dictionary spellings, then
 * the text exactly as typed. Arabic needs no letter conversion.
 */
export function arabicInputCandidates(word: string): string[] {
  const trimmed = word.trim();
  if (!trimmed) return [];
  const vocalized =
    ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[trimmed] ??
    ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[stripArabicDiacritics(trimmed)] ??
    [];
  return [...new Set([...vocalized.filter((text) => text !== trimmed), trimmed])];
}
