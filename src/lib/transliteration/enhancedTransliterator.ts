import { createEngine, type LanguageConfig } from "@piraisoodan/tanglish";
import * as transliteratorModule from "arabic-malayalam-transliterator";

/**
 * Enhanced Arabi-Malayalam & Malayalam Transliterator
 * Incorporates:
 * 1. '@piraisoodan/tanglish' (Manglish / Malayalam engine)
 * 2. 'arabic-malayalam-transliterator' (by naswihmohd)
 * 3. Malayalamozhi Arabi-Malayalam orthography standards
 * 4. Comprehensive Manglish-to-Malayalam mapping
 */

// Safe cross-environment unwrap for CJS/ESM interop
const rawTransliterator: any = transliteratorModule;
export const transliterateToArabic = (text: string): string => {
  try {
    if (typeof rawTransliterator === "function") {
      return rawTransliterator(text);
    }
    if (typeof rawTransliterator?.default === "function") {
      return rawTransliterator.default(text);
    }
    if (typeof rawTransliterator?.default?.default === "function") {
      return rawTransliterator.default.default(text);
    }
  } catch (e) {
    console.error("Transliteration call error:", e);
  }
  return text;
};

// Common Manglish to Malayalam mapping dictionary
export const MANGLISH_TO_MALAYALAM_MAP: Record<string, string[]> = {
  hello: ["ഹലോ", "ഹെല്ലോ", "ഞെല്ലൊ", "ഞെല്ലോ", "ഹെലോ"],
  njan: ["ഞാൻ", "ഞാൻ", "ഞാനും", "ഞാനാണ്", "ഞാനെന്ന്"],
  njaan: ["ഞാൻ", "ഞാനും", "ഞാനാണ്"],
  salam: ["സലാം", "അസ്സലാമു അലൈക്കും"],
  salaam: ["സലാം", "അസ്സലാമു അലൈക്കും"],
  namaskaram: ["നമസ്കാരം", "നമസ്തേ"],
  keralam: ["കേരളം", "കേരളത്തിൽ"],
  vellam: ["വെള്ളം", "വെള്ളത്തിൽ"],
  veedu: ["വീട്", "വീട്ടിൽ", "വീടുകൾ"],
  veettil: ["വീട്ടിൽ"],
  ente: ["എന്റെ", "എന്റേത്"],
  ningal: ["നിങ്ങൾ", "നിങ്ങൾക്ക്", "നിങ്ങളുടെ"],
  ningalkku: ["നിങ്ങൾക്ക്"],
  enikku: ["എനിക്ക്", "എനിക്കറിയില്ല"],
  sukhamano: ["സുഖമാണോ", "സുഖമാണ്"],
  sukhamanu: ["സുഖമാണ്"],
  sukham: ["സുഖം"],
  poyi: ["പോയി", "പോയിട്ടുണ്ട്"],
  vannu: ["വന്നു", "വന്നിട്ടുണ്ട്"],
  kazhichu: ["കഴിച്ചു", "കഴിച്ചോ"],
  kazhicho: ["കഴിച്ചോ"],
  entha: ["എന്താ", "എന്താണ്", "എന്തെങ്കിലും"],
  enthanu: ["എന്താണ്"],
  evide: ["എവിടെ", "എവിടെയാണ്"],
  evideya: ["എവിടെയാ", "എവിടെയാണ്"],
  aaru: ["ആര്", "ആരാണ്"],
  aar: ["ആര്", "ആരാണ്"],
  aaranu: ["ആരാണ്"],
  eppol: ["എപ്പോൾ", "എപ്പോഴാണ്"],
  eppozhum: ["എപ്പോഴും"],
  engane: ["എങ്ങനെ", "എങ്ങനെയാണ്"],
  nanni: ["നന്ദി", "വളരെ നന്ദി"],
  pusthakam: ["പുസ്തകം", "പുസ്തകങ്ങൾ"],
  kutty: ["കുട്ടി", "കുട്ടികൾ"],
  kutti: ["കുട്ടി", "കുട്ടികൾ"],
  amma: ["അമ്മ", "അമ്മേ"],
  uppa: ["ഉപ്പ", "ഉപ്പാ"],
  nalla: ["നല്ല", "നല്ലത്"],
  onnu: ["ഒന്ന്", "ഒന്നാമത്"],
  randu: ["രണ്ട്", "രണ്ടാമത്"],
  moonnu: ["മൂന്ന്"],
  naalu: ["നാല്"],
  anju: ["അഞ്ച്"],
  aaru_num: ["ആറ്"],
  ezhu: ["ഏഴ്"],
  ettu: ["എട്ട്"],
  onpathu: ["ഒൻപത്"],
  pathu: ["പത്ത്"],
  ezhuthuka: ["എഴുതുക", "എഴുതുന്നു", "എഴുതി"],
  ezhuthu: ["എഴുത്ത്"],
  vaayikkuka: ["വായിക്കുക", "വായിക്കുന്നു", "വായിച്ചു"],
  vaayan: ["വായന"],
  arabi: ["അറബി", "അറബിക്"],
  malayalam: ["മലയാളം", "മലയാളത്തിൽ"],
  arabimalayalam: ["അറബി മലയാളം"],
  madrasa: ["മദ്രസ", "മദ്രസയിൽ"],
  kithab: ["കിതാബ്", "കിതാബുകൾ"],
  allah: ["അല്ലാഹു", "അല്ലാഹ്"],
  allahu: ["അല്ലാഹു"],
  muhammed: ["മുഹമ്മദ്", "മുഹമ്മദ് നബി"],
  nabi: ["നബി", "നബി(സ്വ)"],
  swalath: ["സ്വലാത്ത്"],
  dua: ["ദുആ", "പ്രാർത്ഥന"],
  chothichu: ["ചോദിച്ചു"],
  paranju: ["പറഞ്ഞു"],
  ariyilla: ["അറിയില്ല"],
  ariyaam: ["അറിയാം"],
  cheyyuka: ["ചെയ്യുക", "ചെയ്യുന്നു", "ചെയ്തു"],
  cheythu: ["ചെയ്തു"],
  pokuka: ["പോകുക", "പോകുന്നു"],
  varuka: ["വരുക", "വരുന്നു"],
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
};

// Malayalam consonant mapping
const CONS_MAP: Array<[string, string]> = [
  ["ksh", "ക്ഷ"],
  ["zhh", "ഴ"],
  ["zh", "ഴ"],
  ["chh", "ഛ"],
  ["ch", "ച"],
  ["ngh", "ഘ"],
  ["ng", "ങ"],
  ["nj", "ഞ"],
  ["kh", "ഖ"],
  ["gh", "ഘ"],
  ["jh", "ഝ"],
  ["sh", "ശ"],
  ["thh", "ഥ"],
  ["th", "ത"],
  ["dhh", "ഢ"],
  ["dh", "ധ"],
  ["ph", "ഫ"],
  ["bh", "ഭ"],
  ["tt", "ട്ട"],
  ["dd", "ഡ്ഡ"],
  ["nn", "ണ്ണ"],
  ["ll", "ള്ള"],
  ["rr", "റ്റ"],
  ["k", "ക"],
  ["g", "ഗ"],
  ["c", "ച"],
  ["j", "ജ"],
  ["T", "ട"],
  ["D", "ഡ"],
  ["N", "ണ"],
  ["t", "ത"],
  ["d", "ദ"],
  ["n", "ന"],
  ["p", "പ"],
  ["f", "ഫ"],
  ["b", "ബ"],
  ["m", "മ"],
  ["y", "യ"],
  ["r", "ര"],
  ["l", "ല"],
  ["v", "വ"],
  ["w", "വ"],
  ["s", "സ"],
  ["h", "ഹ"],
  ["q", "ക"],
  ["z", "സ"],
];

const VOWEL_MATRA: Array<[string, string]> = [
  ["aa", "ാ"],
  ["ee", "ീ"],
  ["ii", "ീ"],
  ["oo", "ൂ"],
  ["uu", "ൂ"],
  ["ai", "ൈ"],
  ["au", "ൌ"],
  ["ou", "ൌ"],
  ["a", ""],
  ["i", "ി"],
  ["u", "ു"],
  ["e", "െ"],
  ["o", "ൊ"],
];

const INDEP_VOWEL: Array<[string, string]> = [
  ["aa", "ആ"],
  ["ee", "ഈ"],
  ["ii", "ഈ"],
  ["oo", "ഊ"],
  ["uu", "ഊ"],
  ["ai", "ഐ"],
  ["au", "ഔ"],
  ["ou", "ഔ"],
  ["a", "അ"],
  ["i", "ഇ"],
  ["u", "ഉ"],
  ["e", "എ"],
  ["o", "ഒ"],
];

const CHILLU_MAP: Record<string, string> = {
  n: "ൻ",
  N: "ൺ",
  r: "ർ",
  l: "ൽ",
  L: "ൾ",
  m: "ം",
  k: "ൿ",
};

// Manglish configuration for @piraisoodan/tanglish
const MALAYALAM_MAPPINGS: Array<[string, string]> = [
  ["kshaa", "ക്ഷാ"], ["ksha", "ക്ഷ"], ["kshii", "ക്ഷീ"], ["kshi", "ക്ഷി"],
  ["kshu", "ക്ഷു"], ["kshuu", "ക്ഷൂ"], ["kshe", "ക്ഷെ"], ["kshee", "ക്ഷേ"],
  ["zhhaa", "ഴാ"], ["zhha", "ഴ"], ["zhaa", "ഴാ"], ["zha", "ഴ"],
  ["chhaa", "ഛാ"], ["chha", "ഛ"], ["chaa", "ചാ"], ["cha", "ച"],
  ["ngaa", "ങ്ങാ"], ["nga", "ങ"], ["njaa", "ഞാ"], ["nja", "ഞ"],
  ["khaa", "ഖാ"], ["kha", "ഖ"], ["ghaa", "ഘാ"], ["gha", "ഘ"],
  ["jhaa", "ഝാ"], ["jha", "ഝ"], ["shaa", "ശാ"], ["sha", "ശ"],
  ["thhaa", "ഥാ"], ["thha", "ഥ"], ["thaa", "താ"], ["tha", "ത"],
  ["dhhaa", "ഢാ"], ["dhha", "ഢ"], ["dhaa", "ധാ"], ["dha", "ധ"],
  ["phaa", "ഫാ"], ["pha", "ഫ"], ["bhaa", "ഭാ"], ["bha", "ഭ"],
  ["ttaa", "ട്ടാ"], ["tta", "ട്ട"], ["ddaa", "ഡ്ഡാ"], ["dda", "ഡ്ഡ"],
  ["nnaa", "ണ്ണാ"], ["nna", "ണ്ണ"], ["llaa", "ള്ളാ"], ["lla", "ള്ള"],
  ["rraa", "റ്റാ"], ["rra", "റ്റ"], ["kaa", "കാ"], ["ka", "ക"],
  ["gaa", "ഗാ"], ["ga", "ഗ"], ["jaa", "ജാ"], ["ja", "ജ"],
  ["paa", "പാ"], ["pa", "പ"], ["baa", "ബാ"], ["ba", "ബ"],
  ["maa", "മാ"], ["ma", "മ"], ["yaa", "യാ"], ["ya", "യ"],
  ["raa", "രാ"], ["ra", "ര"], ["laa", "ലാ"], ["la", "ല"],
  ["vaa", "വാ"], ["va", "വ"], ["waa", "വാ"], ["wa", "വ"],
  ["saa", "സാ"], ["sa", "സ"], ["haa", "ഹാ"], ["ha", "ഹ"],
  ["hello", "ഹലോ"], ["njan", "ഞാൻ"], ["salam", "സലാം"],
];

const MALAYALAM_VOWEL_SIGNS: Array<[string, string]> = [
  ["aa", "ാ"], ["ee", "ീ"], ["ii", "ീ"], ["oo", "ൂ"], ["uu", "ൂ"],
  ["ai", "ൈ"], ["au", "ൌ"], ["ou", "ൌ"],
  ["a", ""], ["i", "ി"], ["u", "ു"], ["e", "െ"], ["o", "ൊ"]
];

let manglishEngine: any = null;
try {
  const manglishConfig: LanguageConfig = {
    id: "manglish",
    name: "Manglish",
    nativeName: "മലയാളം",
    unicodeRange: [0x0d00, 0x0d7f],
    dictionary: {
      hello: "ഹലോ",
      njan: "ഞാൻ",
      salam: "സലാം",
      keralam: "കേരളം",
      vellam: "വെള്ളം",
      sukhamanu: "സുഖമാണ്",
      ente: "എന്റെ",
      ningal: "നിങ്ങൾ",
      evide: "എവിടെ",
      entha: "എന്താ",
      nanni: "നന്ദി",
      pusthakam: "പുസ്തകം",
      amma: "അമ്മ",
      uppa: "ഉപ്പ",
      malayalam: "മലയാളം",
    },
    mappings: MALAYALAM_MAPPINGS,
    vowelSigns: MALAYALAM_VOWEL_SIGNS,
  };
  manglishEngine = createEngine(manglishConfig);
} catch (e) {
  console.warn("Could not initialize @piraisoodan/tanglish engine", e);
}

/**
 * Convert arbitrary Manglish string into phonetic Malayalam
 */
export function manglishToMalayalam(word: string): string[] {
  const normalized = word.toLowerCase().trim();
  if (!normalized) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  const add = (w: string) => {
    const t = w.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      results.push(t);
    }
  };

  // 1. Exact dictionary matches
  if (MANGLISH_TO_MALAYALAM_MAP[normalized]) {
    for (const w of MANGLISH_TO_MALAYALAM_MAP[normalized]!) {
      add(w);
    }
  }

  // 2. Tanglish engine suggestions & transliterations
  if (manglishEngine) {
    try {
      const suggestions = manglishEngine.getSuggestions(normalized, 4);
      if (Array.isArray(suggestions)) {
        for (const s of suggestions) {
          if (s?.output) add(s.output);
        }
      }
      const direct = manglishEngine.transliterate(normalized);
      if (direct) add(direct);
    } catch {
      // safe fallback
    }
  }

  // 3. Rule-based phonetic transliteration fallback
  let out = "";
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const rest = normalized.slice(i);

    // Initial independent vowel
    if (i === 0) {
      const vMatch = INDEP_VOWEL.find(([v]) => rest.startsWith(v));
      if (vMatch) {
        out += vMatch[1];
        i += vMatch[0].length;
        continue;
      }
    }

    // Chillu at end of word
    if (i === len - 1 && CHILLU_MAP[normalized[i]!]) {
      out += CHILLU_MAP[normalized[i]!]!;
      i += 1;
      continue;
    }

    // Consonant match
    const cMatch = CONS_MAP.find(([c]) => rest.startsWith(c));
    if (cMatch) {
      const consChar = cMatch[1];
      i += cMatch[0].length;
      const after = normalized.slice(i);

      // Followed by vowel
      const vMatch = VOWEL_MATRA.find(([v]) => after.startsWith(v));
      if (vMatch) {
        out += consChar + vMatch[1];
        i += vMatch[0].length;
      } else {
        // Pure consonant with virama (chandrakkala)
        if (i === len && CHILLU_MAP[cMatch[0]]) {
          out += CHILLU_MAP[cMatch[0]]!;
        } else {
          out += consChar + "്";
        }
      }
      continue;
    }

    // Vowel in middle
    const vMatch = INDEP_VOWEL.find(([v]) => rest.startsWith(v));
    if (vMatch) {
      out += vMatch[1];
      i += vMatch[0].length;
      continue;
    }

    out += normalized[i];
    i += 1;
  }

  if (out) add(out);

  return results;
}

// Classical and standard Arabi-Malayalam vocabulary mappings
// Classical and standard Arabi-Malayalam vocabulary mappings (supporting 'o' with ٗ like 'e' with ٘)
export const ARABI_MALAYALAM_VOCABULARY: Record<string, string[]> = {
  njan: ["ݧان", "ڿانْ", "نجان"],
  njaan: ["ݧان", "ڿانْ", "نجان"],
  ningal: ["نِڹڰَڶ", "نِڠَݵ"],
  enikku: ["ا٘نِكُّ", "اِنِكُّ", "يِنِكُّ"],
  ente: ["ا٘نْت٘", "ا٘نْڔِ", "اِينْتِي"],
  entha: ["ا٘نْتھَا", "اِينْدَا"],
  evide: ["ا٘وِد٘", "اِوِد٘", "اِيوِڈِي"],
  sukhamanu: ["سُكھَمَاڹ", "سُكَمَاڹُ"],
  sukham: ["سُكھَمْ", "سُكَمْ"],
  sukhamano: ["سُكھَمَانٗو", "سُكھَمَانُو", "سُكھَمَاڹٗو", "سُكَمَانُو"],
  vellam: ["و٘ڶَّم", "وَيڶَّم", "وِڶَّم", "و٘ۻَّم"],
  veedu: ["وِيڈ", "وِيڈُ"],
  veettil: ["وِيٹِّيلْ"],
  nanni: ["نَنِّي"],
  salam: ["سَلَام", "السَّلَام"],
  salaam: ["سَلَام", "السَّلَام"],
  namaskaram: ["نَمَسْكَارَم"],
  allah: ["اللّٰه", "اَللّٰهْ"],
  allahu: ["اللّٰه", "اَللّٰهُ"],
  kithab: ["كِتَاب", "كِتَابُكَيڶ"],
  madrasa: ["مَدْرَسَة"],
  paatam: ["پَاٹَم"],
  amma: ["اَمَّا", "اُمَّا"],
  uppa: ["اُپَّا"],
  nalla: ["نَلَّ", "نَلَّتْ"],
  onnu: ["اٗنُّ", "اٗنَّْ", "اُونُّ", "اُنُّ"],
  oru: ["اٗرُ", "اٗڔُ", "اُورُ", "اُرُ"],
  oro: ["اٗرٗو", "اٗوڔٗو", "اٗورٗو", "اُورُو"],
  randu: ["رَنْڈ", "رَنْڈَامَتْ"],
  moonnu: ["مُونُّ"],
  naalu: ["نَالُ"],
  anju: ["اَنْجُ"],
  ippol: ["اِپَّٗڶ", "اِپَّوڶ", "اِپّوڶ", "اِپَّوۻ"],
  appol: ["اَپَّٗڶ", "اَپَّوڶ", "اَپَّوۻ"],
  vannu: ["وَنُّ"],
  poyi: ["پٗويِ", "پٗویِ", "پَويِ", "پُویِ"],
  kazhicho: ["كَژِچّٗو", "كَژِچُّو", "كَيِچّو"],
  nokku: ["نٗوكُّ", "نُوڪُّ", "نٗوكُو"],
  kollam: ["كٗوڶَّم", "كٗوۻَّام", "كُوڶَّم"],
  chollu: ["چٗوڶُّ", "چٗوۻّ", "چُوڶُّ"],
  ponnu: ["پٗوڹُّ", "پُوڹُّ", "پٗونُّ"],
  chothichu: ["چٗودِچُّ", "چُودِچُّ"],
  pokuka: ["پٗوكُكَ", "پُوڪُكَ"],
  engottu: ["ا٘ڹْڰٗوٹُّ", "اِنْڰُوٹُّ"],
  ingottu: ["اِنْڰٗوٹُّ", "اِنْڰُوٹُّ"],
  angottu: ["اَنْڰٗوٹُّ", "اَنْڰُوٹُّ"],
  avanod: ["اَوَنٗوڈْ", "اَوَنُوڈْ"],
  ennodu: ["ا٘نَّٗوڈُ", "اِنَّٗوڈُ"],
  entho: ["ا٘نْتھٗو", "اِنْتھُو"],
  cheyyunnu: ["چَييُّنُّ"],
  cheythu: ["چَيْدُ", "چَيْتُ"],
  pusthakam: ["پُسْتَكَم"],
  kutty: ["كُٹِّي"],
  kutti: ["كُٹِّي"],
  malayalam: ["مَلَيَاڶَم", "مَلَیاۻم"],
  keralam: ["ک٘یرَڶَم", "كِيرَڶَم", "كيرَڶَم", "كيرَۻَم"],
  sthalam: ["سْتَڶَم", "سْتَۻَم"],
  samayam: ["سَمَيَم"],
  ariyaam: ["اَرِيَام"],
  ariyilla: ["اَرِييِلَّ"],
  vaayikkuka: ["وَايِكُّكَ"],
  ezhuthuka: ["اِيژُوتُّكَ"],
  hello: ["حَلُو", "هَلُو"],
};

// Malayalam to Arabi-Malayalam vocabulary mappings (supporting 'o' with ٗ like 'e' with ٘)
export const MALAYALAM_TO_ARABI_VOCABULARY: Record<string, string[]> = {
  "ഞാൻ": ["ݧان", "ڿانْ", "نجان"],
  "നിങ്ങൾ": ["نِڹڰَڶ", "نِڠَݵ"],
  "എനിക്ക്": ["ا٘نِكُّ", "اِنِكُّ", "يِنِكُّ"],
  "എന്റെ": ["ا٘نْت٘", "ا٘نْڔِ", "اِينْتِي"],
  "എന്താണ്": ["ا٘نْتھَاڹ", "اِينْدَاڹ"],
  "എന്താ": ["ا٘نْتھَا", "اِينْدَا"],
  "എവിടെ": ["ا٘وِد٘", "اِوِد٘", "اِيوِڈِي"],
  "സുഖമാണ്": ["سُكھَمَاڹ", "سُكَمَاڹُ"],
  "സുഖം": ["سُكھَمْ", "سُكَمْ"],
  "സുഖമാണോ": ["سُكھَمَانٗو", "سُكھَمَانُو", "سُكھَمَاڹٗو", "سُكَمَانُو"],
  "വെള്ളം": ["و٘ڶَّم", "وَيڶَّم", "وِڶَّم", "و٘ۻَّم"],
  "വീട്": ["وِيڈ", "وِيڈُ"],
  "വീട്ടിൽ": ["وِيٹِّيلْ"],
  "നന്ദി": ["نَنِّي"],
  "സലാം": ["سَلَام", "السَّلَام", "سَلام"],
  "നമസ്കാരം": ["نَمَسْكَارَم"],
  "അല്ലാഹു": ["اللّٰه", "اَللّٰهْ", "اللّٰهُ"],
  "കിതാബ്": ["كِتَاب", "كِتَابُكَيڶ"],
  "മദ്രസ": ["مَدْرَسَة"],
  "പാഠം": ["پَاٹَم"],
  "അമ്മ": ["اَمَّا", "اُمَّا"],
  "ഉപ്പ": ["اُپَّا"],
  "നല്ല": ["نَلَّ", "نَلَّتْ"],
  "ഒന്ന്": ["اٗنُّ", "اٗنَّْ", "اُونُّ", "اُنُّ"],
  "ഒരു": ["اٗرُ", "اٗڔُ", "اُورُ", "اُرُ"],
  "ഓരോ": ["اٗرٗو", "اٗوڔٗو", "اٗورٗو", "اُورُو"],
  "രണ്ട്": ["رَنْڈ", "رَنْڈَامَتْ"],
  "മൂന്ന്": ["مُونُّ"],
  "നാല്": ["نَالُ"],
  "അഞ്ച്": ["اَنْجُ"],
  "ഇപ്പോൾ": ["اِپَّٗڶ", "اِپَّوڶ", "اِپّوڶ", "اِپَّوۻ"],
  "അപ്പോൾ": ["اَپَّٗڶ", "اَپَّوڶ", "اَپَّوۻ"],
  "വന്നു": ["وَنُّ"],
  "പോയി": ["پٗويِ", "پٗویِ", "پَويِ", "پُویِ"],
  "കഴിച്ചോ": ["كَژِچّٗو", "كَژِچُّو", "كَيِچّو"],
  "നോക്കൂ": ["نٗوكُّ", "نُوڪُّ", "نٗوكُو"],
  "കൊള്ളാം": ["كٗوڶَّم", "كٗوۻَّام", "كُوڶَّم"],
  "ചൊല്ല്": ["چٗوڶُّ", "چٗوۻّ", "چُوڶُّ"],
  "പൊന്ന്": ["پٗوڹُّ", "پُوڹُّ", "پٗونُّ"],
  "ചോദിച്ചു": ["چٗودِچُّ", "چُودِچُّ"],
  "പോകുക": ["پٗوكُكَ", "پُوڪُكَ"],
  "എങ്ങോട്ട്": ["ا٘ڹْڰٗوٹُّ", "اِنْڰُوٹُّ"],
  "ഇങ്ങോട്ട്": ["اِنْڰٗوٹُّ", "اِنْڰُوٹُّ"],
  "അങ്ങോട്ട്": ["اَنْڰٗوٹُّ", "اَنْڰُوٹُّ"],
  "അവനോട്": ["اَوَنٗوڈْ", "اَوَنُوڈْ"],
  "എന്നോട്": ["ا٘نَّٗوڈُ", "اِنَّٗوڈُ"],
  "എന്തോ": ["ا٘نْتھٗو", "اِنْتھُو"],
  "ചെയ്യുന്നു": ["چَييُّنُّ"],
  "ചെയ്തു": ["چَيْدُ", "چَيْتُ"],
  "പുസ്തകം": ["پُسْتَكَم"],
  "കുട്ടി": ["كُٹِّي"],
  "മലയാളം": ["مَلَيَاڶَم", "مَلَیاۻم"],
  "കേരളം": ["ک٘یرَڶَم", "كِيرَڶَم", "كيرَڶَم", "كيرَۻَم"],
  "സ്ഥലം": ["سْتَڶَم", "سْتَۻَم"],
  "സമയം": ["سَمَيَم"],
  "അറിയാം": ["اَرِيَام"],
  "അറിയില്ല": ["اَرِييِلَّ"],
  "വായിക്കുക": ["وَايِكُّكَ"],
  "എഴുതുക": ["اِيژُوتُّكَ"],
  "ഹലോ": ["حَلُو", "هَلُو"],
};

// Arabic to Arabi-Malayalam vocabulary and vocalization mappings
export const ARABIC_TO_ARABI_MALAYALAM_VOCABULARY: Record<string, string[]> = {
  "سلام": ["سَلَام", "السَّلَام", "سَلاَمْ"],
  "كتاب": ["كِتَاب", "الكِتَاب", "كِتَابُكَيڶ"],
  "الله": ["اللّٰه", "اَللّٰهْ", "اللّٰهُ"],
  "محمد": ["مُحَمَّد", "مُحَمَّدٌ", "مُحَمَّدْ"],
  "قران": ["قُرْآن", "القُرْآن", "قُرْآنْ"],
  "قرآن": ["قُرْآن", "القُرْآن", "قُرْآنْ"],
  "صلاة": ["صَلَاة", "الصَّلَاة", "صَلَوَات"],
  "مسجد": ["مَسْجِد", "المَسْجِد"],
  "علم": ["عِلْم", "العِلْم"],
  "طالب": ["طَالِب", "طَالِبٌ"],
  "استاذ": ["أُسْتَاذ", "اُسْتَاذْ"],
  "مدرسة": ["مَدْرَسَة", "المَدْرَسَة"],
  "دعاء": ["دُعَاء", "الدُّعَاء"],
  "نور": ["نُور", "النُّور"],
  "حق": ["حَقّ", "الحَقّ"],
  "صبر": ["صَبْر", "الصَّبْر"],
  "شكر": ["شُكْر", "الشُّكْر"],
  "رمضان": ["رَمَضَان", "رَمَضَانْ"],
  "عيد": ["عِيد", "العِيد"],
  "جمعة": ["جُمُعَة", "الجُمُعَة"],
  "حديث": ["حَدِيث", "الحَدِيث"],
  "فقه": ["فِقْه", "الفِقْه"],
  "توبة": ["تَوْبَة"],
  "استغفار": ["اِسْتِغْفَار"],
  "مكة": ["مَكَّة", "مَكَّةُ المُكَرَّمَة"],
  "مدينة": ["مَدِينَة", "المَدِينَةُ المُنَوَّرَة"],
  "جنة": ["جَنَّة", "الجَنَّة"],
  "جهنم": ["جَهَنَّم"],
  "ايمان": ["إِيمَان", "الإِيمَان"],
  "اسلام": ["إِسْلَام", "الإِسْلَام"],
  "احسان": ["إِحْسَان"],
  "رسول": ["رَسُول", "الرَّسُول"],
  "نبي": ["نَبِيّ", "النَّبِيّ"],
  "شيخ": ["شَيْخ", "الشَّيْخ"],
  "بيت": ["بَيْت", "البَيْت"],
  "قلب": ["قَلْب", "القَلْب"],
  "روح": ["رُوح", "الرُّوح"],
  "دنيا": ["دُنْيَا", "الدُّنْيَا"],
  "بركة": ["بَرَكَة", "بَرَكَات"],
  "رحمة": ["رَحْمَة", "رَحْمَةُ اللّٰه"],
};

export interface TransliterationCandidate {
  arabi: string;
  malayalam: string;
  score: number;
}

/**
 * Strips Arabic harakat/tashkeel diacritics for clean base lookup
 */
export function stripArabicDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, "");
}

/**
 * Classical Arabi-Malayalam transliteration engine supporting
 * "o" (inverted damma ٗ U+0657) like "e" (small v ٘ U+0658),
 * full chillaksharam, and authentic Arabi-Malayalam consonants.
 */
export function convertMalayalamToArabiMalayalam(ml: string): string[] {
  const clusters: Record<string, string> = {
    "ച്ച": "چَّ", "ജ്ജ": "جَّ", "ഡ്ഡ": "ڈَّ", "ക്ക": "کَّ", "ത്ത": "تَّ",
    "ദ്ദ": "دَّ", "പ്പ": "پَّ", "ബ്ബ": "بَّ", "മ്മ": "مَّ", "ന്ന": "نَّ",
    "ല്ല": "لَّ", "ട്ട": "ڊَّ", "ര്ര": "ڔَّ", "സ്സ": "سَّ", "ഹ്ഹ": "حَّ",
    "ള്ള": "ڶَّ", "ചേ": "چ٘", "ങ്ങ": "ۼَّ", "ദ്ധ": "دّھ", "സ്വ": "ص",
    "ക്ഷ": "کْشَ", "ജ്ഞ": "جْڿَ", "ശ്ര": "شْرَ", "സ്ര": "سْرَ", "ഹ്ര": "حْرَ",
    "സം": "سَمْ", "ങ്ക": "نْكَ", "ന്റ": "نْڔَ", "റ്റ": "ڔَّ", "ഞ്ച": "ڿْچَ",
    "ണ്ട": "ڹْڈَ", "ന്ത": "نْتَ", "മ്പ": "مْپَ"
  };

  const indepVowels: Record<string, string> = {
    "അ": "اَ", "ആ": "اٰ", "ഇ": "اِ", "ഈ": "اِی", "ഉ": "اُ", "ഊ": "اُو",
    "ഋ": "رْ", "ൠ": "رّْ", "ഌ": "لْ", "ൡ": "لّْ",
    "എ": "ا٘", "ഏ": "ا٘ی", "ഐ": "اَی",
    "ഒ": "اٗ", "ഓ": "اٗو", "ഔ": "اَو"
  };

  const consonants: Record<string, string> = {
    "ക": "کَ", "ഖ": "خَ", "ഗ": "ڰَ", "ഘ": "ڰَّ", "ങ": "ۼَ",
    "ച": "چَ", "ഛ": "چَّ", "ജ": "جَ", "ഝ": "جَّ", "ഞ": "ڿَ",
    "ട": "ڊَ", "ഠ": "ٹَّ", "ഡ": "ڈَ", "ഢ": "ڈَّ", "ണ": "ڹَ",
    "ത": "تَ", "ഥ": "تَّ", "ദ": "دَ", "ധ": "دَ", "ന": "نَ",
    "പ": "پَ", "ഫ": "فَ", "ബ": "بَ", "ഭ": "بَّ", "മ": "مَ",
    "യ": "یَ", "ര": "ڔَ", "ല": "لَ", "വ": "وَ", "ശ": "شَ", "ഷ": "شَّ",
    "സ": "سَ", "ഹ": "حَ", "ള": "ڶَ", "ഴ": "ژَ", "റ": "ڔَ",
    "ൻ": "نْ", "ർ": "رْ", "ൽ": "لْ", "ൾ": "ڶْ", "ൺ": "ڹْ", "ൿ": "کْ"
  };

  const matras: Record<string, string> = {
    "ാ": "ا", "ി": "ِ", "ീ": "ِي", "ു": "ُ", "ൂ": "ُو",
    "ൃ": "ْر", "െ": "٘", "േ": "٘ی", "ൈ": "يْ",
    "ൊ": "ٗ",   // Arabi-Malayalam inverted damma for short o
    "ോ": "ٗو",  // Arabi-Malayalam inverted damma + waw for long o
    "ൗ": "َو", "്": "ْ", "ം": "مْ"
  };

  let primary = "";
  for (let i = 0; i < ml.length; i++) {
    const three = ml.slice(i, i + 3);
    const two = ml.slice(i, i + 2);
    const one = ml[i]!;
    const next = ml[i + 1];

    if (clusters[three]) {
      primary += clusters[three];
      i += 2;
      continue;
    }
    if (clusters[two]) {
      primary += clusters[two];
      i += 1;
      continue;
    }
    if (indepVowels[one]) {
      primary += indepVowels[one];
      continue;
    }
    if (consonants[one]) {
      let base = consonants[one]!;
      if (next && matras[next]) {
        if (base.endsWith("َ")) base = base.slice(0, -1);
        primary += base + matras[next];
        i++;
        continue;
      }
      primary += base;
      continue;
    }
    if (matras[one]) {
      primary += matras[one];
      continue;
    }
    primary += one;
  }

  // Variant with standard damma/waw for o
  const standardOVariant = primary
    .replace(/اٗو/g, "اُو")
    .replace(/اٗ/g, "اُ")
    .replace(/ٗو/g, "ُو")
    .replace(/ٗ/g, "ُ");

  const results = [primary];
  if (standardOVariant !== primary) {
    results.push(standardOVariant);
  }
  return results;
}

/**
 * Generate high-accuracy Arabi-Malayalam candidates for an input word:
 * 1. English to Arabi-Malayalam (Roman / Manglish phonetics -> ArabiMalayalam)
 * 2. Malayalam to Arabi-Malayalam (Malayalam script -> ArabiMalayalam)
 * 3. Arabic to Arabi-Malayalam (Standard Arabic -> ArabiMalayalam orthography)
 * In ALL cases, all suggestions are pure Arabi-Malayalam, and the LAST suggestion is always the typed text.
 */
export function getTransliterationCandidates(
  word: string,
  mode: "english" | "malayalam" | "arabic" | "arabi" = "english",
): Array<{ text: string }> {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const candidates: Array<{ text: string }> = [];
  const seen = new Set<string>();

  const isMalayalamInput = /[\u0D00-\u0D7F]/.test(trimmed);
  const isArabicInput = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed);

  // 1. ARABIC TO ARABI-MALAYALAM
  if (isArabicInput || mode === "arabic") {
    const unvocalized = stripArabicDiacritics(trimmed);

    // Check direct dictionary
    if (ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[trimmed]) {
      for (const ar of ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[trimmed]!) {
        if (!seen.has(ar) && ar !== trimmed) {
          candidates.push({ text: ar });
          seen.add(ar);
        }
      }
    }
    if (ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[unvocalized]) {
      for (const ar of ARABIC_TO_ARABI_MALAYALAM_VOCABULARY[unvocalized]!) {
        if (!seen.has(ar) && ar !== trimmed) {
          candidates.push({ text: ar });
          seen.add(ar);
        }
      }
    }

    // Arabi-Malayalam phonetic adaptations for Arabic characters:
    // (e.g. ج -> چ, ك -> ڰ, ل -> ڶ, ن -> ڹ, etc.)
    const arabiMalayalamVariation = trimmed
      .replace(/ك/g, "ڰ")
      .replace(/ج/g, "چ");
    if (arabiMalayalamVariation !== trimmed && !seen.has(arabiMalayalamVariation)) {
      candidates.push({ text: arabiMalayalamVariation });
      seen.add(arabiMalayalamVariation);
    }

    const finalCandidates = candidates.slice(0, 5);
    finalCandidates.push({ text: trimmed });
    return finalCandidates;
  }

  // 2. MALAYALAM TO ARABI-MALAYALAM
  if (isMalayalamInput || mode === "malayalam") {
    // Check direct Malayalam vocabulary
    if (MALAYALAM_TO_ARABI_VOCABULARY[trimmed]) {
      for (const ar of MALAYALAM_TO_ARABI_VOCABULARY[trimmed]!) {
        if (!seen.has(ar)) {
          candidates.push({ text: ar });
          seen.add(ar);
        }
      }
    }

    // Convert via dedicated Arabi-Malayalam engine supporting 'o' like 'e'
    const customArabiList = convertMalayalamToArabiMalayalam(trimmed);
    for (const ar of customArabiList) {
      if (!seen.has(ar) && ar !== trimmed) {
        candidates.push({ text: ar });
        seen.add(ar);
      }
    }

    // Also include transliterateToArabic library output
    const arabiResult = transliterateToArabic(trimmed);
    if (arabiResult && !seen.has(arabiResult) && arabiResult !== trimmed) {
      candidates.push({ text: arabiResult });
      seen.add(arabiResult);
    }

    const finalCandidates = candidates.slice(0, 5);
    finalCandidates.push({ text: trimmed });
    return finalCandidates;
  }

  // 3. ENGLISH TO ARABI-MALAYALAM (Roman phonetics e.g. "njan", "salam", "onnu", "poyi")
  const normalized = trimmed.toLowerCase();

  // 3a. Direct English-to-ArabiMalayalam dictionary matches
  if (ARABI_MALAYALAM_VOCABULARY[normalized]) {
    for (const ar of ARABI_MALAYALAM_VOCABULARY[normalized]!) {
      if (!seen.has(ar)) {
        candidates.push({ text: ar });
        seen.add(ar);
      }
    }
  }

  // 3b. Phonetic Malayalam candidates converted to Arabi-Malayalam
  const mlList = manglishToMalayalam(trimmed);
  for (const ml of mlList) {
    if (MALAYALAM_TO_ARABI_VOCABULARY[ml]) {
      for (const ar of MALAYALAM_TO_ARABI_VOCABULARY[ml]!) {
        if (!seen.has(ar)) {
          candidates.push({ text: ar });
          seen.add(ar);
        }
      }
    }
    const customArabiList = convertMalayalamToArabiMalayalam(ml);
    for (const ar of customArabiList) {
      if (!seen.has(ar)) {
        candidates.push({ text: ar });
        seen.add(ar);
      }
    }
    const arabi = transliterateToArabic(ml);
    if (arabi && !seen.has(arabi)) {
      candidates.push({ text: arabi });
      seen.add(arabi);
    }
  }

  // Keep up to 5 candidates, and the LAST suggestion is ALWAYS the typed text
  const finalCandidates = candidates.slice(0, 5);
  finalCandidates.push({ text: trimmed });

  return finalCandidates;
}
