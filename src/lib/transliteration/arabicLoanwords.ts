/**
 * Arabic-origin words that Arabi-Malayalam writes in their original Arabic
 * spelling rather than letter-by-letter from Malayalam (صَلَاة, not സലാത്ത്
 * spelled out). Each entry lists the Malayalam spellings and the common
 * Manglish spellings that should offer the Arabic form.
 *
 * Arabic spellings use standard Arabic orthography with full vowel marks.
 */

interface Loanword {
  arabic: string;
  malayalam: string[];
  roman: string[];
}

const LOANWORDS: Loanword[] = [
  // Names and phrases of faith
  { arabic: "اللّٰه", malayalam: ["അല്ലാഹ്", "അള്ളാഹ്", "അല്ലാഹ"], roman: ["allah", "allaah"] }, // not "alla": that is അല്ല
  { arabic: "اللّٰهُ", malayalam: ["അല്ലാഹു", "അള്ളാഹു"], roman: ["allahu", "allaahu"] },
  {
    arabic: "بِسْمِ اللّٰه",
    malayalam: ["ബിസ്മില്ലാഹ്", "ബിസ്മില്ല"],
    roman: ["bismillah", "bismillaah", "bismilla"],
  },
  {
    arabic: "اَلْحَمْدُ لِلّٰه",
    malayalam: ["അൽഹംദുലില്ലാഹ്", "അല്ഹംദുലില്ലാഹ്"],
    roman: ["alhamdulillah", "alhamdulilla", "alhamdhulillah", "alhamdulillaah"],
  },
  {
    arabic: "إِنْ شَاءَ اللّٰه",
    malayalam: ["ഇൻശാ അല്ലാഹ്", "ഇൻഷാ അല്ലാഹ്", "ഇൻശാഅല്ലാഹ്"],
    roman: ["inshaallah", "inshallah", "inshaalla", "inshalla"],
  },
  {
    arabic: "مَا شَاءَ اللّٰه",
    malayalam: ["മാശാ അല്ലാഹ്", "മാഷാ അല്ലാഹ്", "മാശാഅല്ലാഹ്"],
    roman: ["mashaallah", "mashallah", "maashaallah"],
  },
  {
    arabic: "سُبْحَانَ اللّٰه",
    malayalam: ["സുബ്ഹാനല്ലാഹ്"],
    roman: ["subhanallah", "subhaanallah"],
  },
  {
    arabic: "أَسْتَغْفِرُ اللّٰه",
    malayalam: ["അസ്തഗ്ഫിറുല്ലാഹ്"],
    roman: ["astaghfirullah", "asthaghfirullah"],
  },
  { arabic: "جَزَاكَ اللّٰه", malayalam: ["ജസാകല്ലാഹ്"], roman: ["jazakallah", "jazaakallah"] },
  { arabic: "اللّٰهُ أَكْبَر", malayalam: ["അല്ലാഹു അക്ബർ"], roman: ["allahuakbar"] },
  {
    arabic: "اَلسَّلَامُ عَلَيْكُمْ",
    malayalam: ["അസ്സലാമു അലൈക്കും"],
    roman: ["assalamualaikum", "asalamualaikum"],
  },
  { arabic: "سَلَام", malayalam: ["സലാം"], roman: ["salam", "salaam"] },
  { arabic: "آمِين", malayalam: ["ആമീൻ"], roman: ["ameen", "aameen", "amin"] },
  {
    arabic: "مُحَمَّد",
    malayalam: ["മുഹമ്മദ്"],
    roman: ["muhammad", "muhammed", "mohammed", "muhamed"],
  },
  { arabic: "نَبِيّ", malayalam: ["നബി"], roman: ["nabi"] },
  { arabic: "رَسُول", malayalam: ["റസൂൽ", "റസൂല്"], roman: ["rasool", "rasul", "rasoolu"] },
  { arabic: "صَحَابِيّ", malayalam: ["സ്വഹാബി", "സഹാബി"], roman: ["swahabi", "sahabi"] },

  // Scripture and learning
  {
    arabic: "قُرْآن",
    malayalam: ["ഖുർആൻ", "ഖുറാൻ"],
    roman: ["quran", "quraan", "khuran", "khuraan", "qur'an"],
  },
  {
    arabic: "حَدِيث",
    malayalam: ["ഹദീസ്", "ഹദീഥ്"],
    roman: ["hadees", "hadith", "hadeeth", "hadis"],
  },
  { arabic: "آيَة", malayalam: ["ആയത്ത്"], roman: ["ayath", "aayath", "ayat", "ayah"] },
  {
    arabic: "سُورَة",
    malayalam: ["സൂറത്ത്", "സൂറ"],
    roman: ["surah", "soorath", "surath", "soora"],
  },
  { arabic: "كِتَاب", malayalam: ["കിതാബ്"], roman: ["kithab", "kitab", "kithaab", "kitaab"] },
  { arabic: "عِلْم", malayalam: ["ഇൽമ്", "ഇല്മ്"], roman: ["ilm"] },
  {
    arabic: "مَدْرَسَة",
    malayalam: ["മദ്രസ", "മദ്റസ"],
    roman: ["madrasa", "madrassa", "madrasah"],
  },
  { arabic: "دَرْس", malayalam: ["ദർസ്"], roman: ["dars"] },
  {
    arabic: "أُسْتَاذ",
    malayalam: ["ഉസ്താദ്"],
    roman: ["usthad", "ustad", "usthaad", "ustaad", "usthadh"],
  },
  { arabic: "عَالِم", malayalam: ["ആലിം"], roman: ["aalim", "alim"] },
  { arabic: "حَافِظ", malayalam: ["ഹാഫിള്", "ഹാഫിസ്"], roman: ["hafiz", "haafiz"] },
  { arabic: "كَلِمَة", malayalam: ["കലിമ"], roman: ["kalima", "kalimah"] },

  // Worship and practice
  {
    arabic: "صَلَاة",
    malayalam: ["സ്വലാത്ത്", "സ്വലാത്", "സലാത്ത്"],
    roman: ["swalath", "swalah", "salath", "salah"],
  },
  { arabic: "دُعَاء", malayalam: ["ദുആ"], roman: ["dua", "duaa"] },
  { arabic: "ذِكْر", malayalam: ["ദിക്ർ"], roman: ["dhikr", "zikr", "dikr"] },
  { arabic: "تَسْبِيح", malayalam: ["തസ്ബീഹ്"], roman: ["thasbeeh", "tasbih", "tasbeeh"] },
  { arabic: "أَذَان", malayalam: ["അദാൻ"], roman: ["adhan", "adhaan", "azan", "azaan"] },
  { arabic: "وُضُوء", malayalam: ["വുളൂഅ്", "വുളു"], roman: ["wudu", "wudhu", "vulu", "wuzu"] },
  { arabic: "زَكَاة", malayalam: ["സകാത്ത്", "സക്കാത്ത്"], roman: ["zakath", "zakat", "zakaath"] },
  {
    arabic: "صَدَقَة",
    malayalam: ["സ്വദഖ", "സദഖ"],
    roman: ["sadaqa", "swadaqa", "sadakha", "swadakha", "sadaqah"],
  },
  { arabic: "حَجّ", malayalam: ["ഹജ്ജ്"], roman: ["hajj", "haj"] },
  { arabic: "عُمْرَة", malayalam: ["ഉംറ"], roman: ["umrah", "umra"] },
  { arabic: "سُنَّة", malayalam: ["സുന്നത്ത്"], roman: ["sunnath", "sunnah", "sunnat"] },
  { arabic: "تَوْبَة", malayalam: ["തൗബ"], roman: ["thouba", "thowba", "tawba", "taubah"] },
  { arabic: "خُطْبَة", malayalam: ["ഖുതുബ", "ഖുത്ബ"], roman: ["khutba", "khuthba", "khutbah"] },
  { arabic: "مَوْلِد", malayalam: ["മൗലിദ്"], roman: ["maulid", "moulid", "mawlid"] },
  { arabic: "زِيَارَة", malayalam: ["സിയാറത്ത്"], roman: ["ziyarath", "ziyarat"] },
  { arabic: "نِكَاح", malayalam: ["നിക്കാഹ്"], roman: ["nikah", "nikkah", "nikaah"] },
  { arabic: "مَهْر", malayalam: ["മഹർ"], roman: ["mahr", "mahar"] },
  { arabic: "حَلَال", malayalam: ["ഹലാൽ"], roman: ["halal", "halaal"] },
  { arabic: "حَرَام", malayalam: ["ഹറാം"], roman: ["haram", "haraam"] },

  // Places, times, people
  { arabic: "مَسْجِد", malayalam: ["മസ്ജിദ്"], roman: ["masjid"] },
  { arabic: "مَكَّة", malayalam: ["മക്ക"], roman: ["makkah", "makka", "mecca"] },
  { arabic: "مَدِينَة", malayalam: ["മദീന"], roman: ["madeena", "madina", "madinah"] },
  {
    arabic: "رَمَضَان",
    malayalam: ["റമദാൻ", "റമളാൻ", "റംസാൻ"],
    roman: ["ramadan", "ramadhan", "ramzan", "ramalan"],
  },
  { arabic: "عِيد", malayalam: ["ഈദ്"], roman: ["eid", "eed"] },
  { arabic: "جُمُعَة", malayalam: ["ജുമുഅ", "ജുമാ"], roman: ["juma", "jumua", "jumuah", "jumah"] },
  { arabic: "إِمَام", malayalam: ["ഇമാം"], roman: ["imam", "imaam"] },
  { arabic: "شَيْخ", malayalam: ["ശൈഖ്"], roman: ["sheikh", "shaikh", "shaykh"] },
  { arabic: "قَاضِي", malayalam: ["ഖാസി"], roman: ["qazi", "khazi", "qadi"] },
  { arabic: "جَمَاعَة", malayalam: ["ജമാഅത്ത്"], roman: ["jamaath", "jamaat", "jamath"] },
  { arabic: "أُمَّة", malayalam: ["ഉമ്മത്ത്"], roman: ["ummath", "ummah"] },

  // Belief and character
  { arabic: "إِيمَان", malayalam: ["ഈമാൻ"], roman: ["iman", "imaan", "eeman", "eemaan"] },
  { arabic: "إِسْلَام", malayalam: ["ഇസ്ലാം"], roman: ["islam", "islaam"] },
  { arabic: "إِحْسَان", malayalam: ["ഇഹ്സാൻ"], roman: ["ihsan", "ihsaan"] },
  { arabic: "مُؤْمِن", malayalam: ["മുഅ്മിൻ"], roman: ["mumin", "muhmin"] },
  { arabic: "جَنَّة", malayalam: ["ജന്നത്ത്", "ജന്നത്"], roman: ["jannath", "jannah", "jannat"] },
  { arabic: "جَهَنَّم", malayalam: ["ജഹന്നം"], roman: ["jahannam", "jahannum"] },
  {
    arabic: "دُنْيَا",
    malayalam: ["ദുനിയാവ്", "ദുൻയാവ്", "ദുനിയ"],
    roman: ["dunya", "duniya", "dunyaa"],
  },
  {
    arabic: "آخِرَة",
    malayalam: ["ആഖിറത്ത്", "ആഖിറ"],
    roman: ["akhira", "aakhira", "akhirah", "akhirath", "aakhirath"],
  },
  { arabic: "قِيَامَة", malayalam: ["ഖിയാമത്ത്"], roman: ["qiyamath", "khiyamath", "qiyamah"] },
  { arabic: "شَيْطَان", malayalam: ["ശൈത്താൻ"], roman: ["shaithan", "shaitan", "shaithaan"] },
  { arabic: "جِنّ", malayalam: ["ജിന്ന്"], roman: ["jinn"] },
  { arabic: "رُوح", malayalam: ["റൂഹ്"], roman: ["rooh", "ruh"] },
  { arabic: "قَلْب", malayalam: ["ഖൽബ്"], roman: ["qalb", "khalb"] },
  { arabic: "نُور", malayalam: ["നൂർ"], roman: ["noor", "nur"] },
  { arabic: "حَقّ", malayalam: ["ഹഖ്"], roman: ["haqq", "haq"] },
  { arabic: "صَبْر", malayalam: ["സ്വബ്ർ", "സബ്ർ"], roman: ["sabr", "swabr"] },
  { arabic: "شُكْر", malayalam: ["ശുക്ർ"], roman: ["shukr"] },
  { arabic: "رَحْمَة", malayalam: ["റഹ്മത്ത്"], roman: ["rahmath", "rahmat", "rahma"] },
  { arabic: "بَرَكَة", malayalam: ["ബറകത്ത്"], roman: ["barakath", "barakat", "baraka"] },
  { arabic: "أَدَب", malayalam: ["അദബ്"], roman: ["adab"] },
  { arabic: "أَخْلَاق", malayalam: ["അഖ്ലാഖ്"], roman: ["akhlaq", "akhlaaq", "akhlak"] },

  // ص words, which Mappila Malayalam spells with സ്വ (the engine reads native സ്വ as سْو)
  {
    arabic: "صَحِيح",
    malayalam: ["സ്വഹീഹ്", "സഹീഹ്"],
    roman: ["swaheeh", "swahih", "saheeh", "sahih"],
  },
  {
    arabic: "صَالِح",
    malayalam: ["സ്വാലിഹ്", "സാലിഹ്"],
    roman: ["swalih", "swaalih", "salih", "saalih"],
  },
  { arabic: "صُوفِيّ", malayalam: ["സ്വൂഫി", "സൂഫി"], roman: ["swoofi", "swufi", "sufi", "soofi"] },
  { arabic: "صُبْح", malayalam: ["സ്വുബ്ഹ്", "സുബ്ഹ്"], roman: ["swubh", "subh"] },
  {
    arabic: "صِرَاط",
    malayalam: ["സ്വിറാത്ത്", "സിറാത്ത്"],
    roman: ["swirath", "sirath", "sirat"],
  },
];

const BY_MALAYALAM = new Map<string, string>();
const BY_ROMAN = new Map<string, { arabic: string; malayalam: string }>();

for (const entry of LOANWORDS) {
  for (const ml of entry.malayalam) BY_MALAYALAM.set(ml.normalize("NFC"), entry.arabic);
  for (const roman of entry.roman) {
    BY_ROMAN.set(roman.replace(/[^a-z]/g, ""), {
      arabic: entry.arabic,
      malayalam: entry.malayalam[0]!,
    });
  }
}

/** Arabic spelling for a Malayalam word of Arabic origin, if known. */
export function arabicSpellingForMalayalam(malayalam: string): string | undefined {
  return BY_MALAYALAM.get(malayalam.normalize("NFC").trim());
}

/** Arabic spelling (and its Malayalam form) for a Manglish loanword, if known. */
export function arabicLoanwordForRoman(
  roman: string,
): { arabic: string; malayalam: string } | undefined {
  return BY_ROMAN.get(roman.toLowerCase().replace(/[^a-z]/g, ""));
}

/** Malayalam spellings of all loanwords, for registering with the lexicon. */
export function loanwordMalayalamSpellings(): string[] {
  return [...BY_MALAYALAM.keys()];
}
