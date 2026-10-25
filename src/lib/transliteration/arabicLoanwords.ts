/**
 * Arabic-origin words that Arabi-Malayalam writes in their original Arabic
 * spelling rather than letter-by-letter from Malayalam (صَلَاة, not സലാത്ത്
 * spelled out). Each entry lists the Malayalam spellings and the common
 * Manglish spellings that should offer the Arabic form.
 *
 * Arabic spellings use standard Arabic orthography with full vowel marks.
 */

import { transliterateMalayalamToArabic } from "./malayalamToArabic.ts";

export interface Loanword {
  arabic: string;
  malayalam: string[];
  roman: string[];
}

export const ARABIC_LOANWORDS: readonly Loanword[] = [
  // Names and phrases of faith
  {
    arabic: "اللّٰه",
    malayalam: ["അല്ലാഹ്", "അള്ളാഹ്", "അല്ലാഹ", "അള്ളാ"], // the Mappila form അള്ളാ
    roman: ["allah", "allaah"], // not "alla": that is അല്ല
  },
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
  {
    arabic: "شَيْخ",
    malayalam: ["ശൈഖ്", "ശൈഖ", "ശെയ്ഖ്", "ഷെയ്ഖ്"],
    roman: ["sheikh", "shaikh", "shaykh", "sheik"],
  },
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
  // Sufi tradition, Mappila literature and history (spellings follow Arabic, not the Malayalam sound)
  { arabic: "قَادِرِيّ", malayalam: ["ഖാദിരി"], roman: ["qadiri", "khadiri", "qaadiri"] },
  {
    arabic: "قَادِرِيَّة",
    malayalam: ["ഖാദിരിയ്യ", "ഖാദിരിയ്യ"],
    roman: ["qadiriyya", "khadiriyya", "qadiriya", "khadiriya"],
  },
  {
    arabic: "جِيلَانِيّ",
    malayalam: ["ജീലാനി", "ഗൈലാനി", "കൈലാനി"],
    roman: ["jeelani", "jilani", "jeelaani", "gilani", "kailani"],
  },
  {
    arabic: "مُحْيِي الدِّين",
    malayalam: [
      "മുഹ്‌യിദ്ദീൻ",
      "മുഹ്യിദ്ദീൻ",
      "മുഹ്‌യുദ്ദീൻ",
      "മുഹ്യുദ്ദീൻ",
      "മുഹിയുദ്ദീൻ",
      "മുഹിയിദ്ദീൻ",
    ],
    roman: [
      "muhyiddin",
      "muhyiddeen",
      "muhiyudheen",
      "muhiyuddeen",
      "muhyuddeen",
      "muhyidheen",
      "muhiyidheen",
    ],
  },
  {
    arabic: "عَبْدُ الْقَادِر",
    malayalam: ["അബ്ദുൽ ഖാദിർ", "അബ്ദുൽഖാദിർ", "അബ്ദുൽ ഖാദർ", "അബ്ദുൽ ഖാദിര്"],
    roman: ["abdulqadir", "abdulkhadir", "abdulkhader", "abdulkadir", "abdulkader", "abdulqadar"],
  },
  {
    arabic: "عَبْدُ الرَّحْمَن",
    malayalam: ["അബ്ദുറഹ്മാൻ", "അബ്ദുറഹിമാൻ", "അബ്ദുർറഹ്മാൻ"],
    roman: ["abdurahman", "abdurahiman", "abdurrahman", "abdurahmaan"],
  },
  {
    arabic: "عَبْدُ اللّٰه",
    malayalam: ["അബ്ദുല്ല", "അബ്ദുള്ള"],
    roman: ["abdulla", "abdullah", "abdhulla"],
  },
  { arabic: "عَبْدُ السَّلَام", malayalam: ["അബ്ദുസ്സലാം"], roman: ["abdussalam", "abdusalam"] },
  {
    arabic: "خِلَافَة",
    malayalam: ["ഖിലാഫത്ത്", "ഖിലാഫത്"],
    roman: ["khilafath", "khilafat", "khilaafath"],
  },
  {
    arabic: "قَبْر",
    malayalam: ["ഖബർ", "ഖബ്ർ", "ഖബര്"],
    roman: ["qabr", "khabr", "khabar", "qabar"],
  },
  { arabic: "عِشْق", malayalam: ["ഇശ്ഖ്", "ഇഷ്ക്", "ഇഷ്ഖ്"], roman: ["ishq", "ishk", "ishkh"] },
  {
    arabic: "نِسَاءُ الْإِسْلَام",
    malayalam: ["നിസാഉൽ ഇസ്ലാം", "നിസാഉൽ ഇസ്‌ലാം", "നിസാഉൽഇസ്ലാം"],
    roman: ["nisaulislam", "nisaaulislam"],
  },
  {
    arabic: "طَرِيقَة",
    malayalam: ["ത്വരീഖത്ത്", "ത്വരീഖത്", "ത്വരീഖ"],
    roman: ["thareekath", "tareeqat", "tareekath", "thwareekath", "tariqat"],
  },
  {
    arabic: "أَوْلِيَاء",
    malayalam: ["ഔലിയ", "ഔലിയാ", "ഔലിയാഅ്"],
    roman: ["auliya", "awliya", "auliyaa", "owliya"],
  },
  {
    arabic: "سُلْطَان",
    malayalam: ["സുൽത്താൻ", "സുൽതാൻ"],
    roman: ["sulthan", "sultan", "sulthaan"],
  },
  {
    arabic: "سَيِّد",
    malayalam: ["സയ്യിദ്", "സയ്യിദ്"],
    roman: ["sayyid", "sayyidh", "sayid", "syed", "sayed"],
  },
  { arabic: "وَلِيّ", malayalam: ["വലിയ്യ്"], roman: ["waliyy", "valiyy"] },
  {
    arabic: "هِجْرَة",
    malayalam: ["ഹിജ്റ", "ഹിജ്‌റ", "ഹിജ്റത്ത്"],
    roman: ["hijra", "hijrah", "hijrath"],
  },
  { arabic: "جِهَاد", malayalam: ["ജിഹാദ്"], roman: ["jihad", "jihaad"] },
  { arabic: "شَهِيد", malayalam: ["ശഹീദ്"], roman: ["shaheed", "shahid", "shaheedh"] },
  {
    arabic: "تَقْوَى",
    malayalam: ["തഖ്‌വ", "തഖ്വ", "തഖ്‌വാ"],
    roman: ["taqwa", "thakhwa", "thaqwa", "takhwa"],
  },
  { arabic: "إِخْلَاص", malayalam: ["ഇഖ്‌ലാസ്", "ഇഖ്ലാസ്"], roman: ["ikhlas", "ikhlaas"] },
  {
    arabic: "عِبَادَة",
    malayalam: ["ഇബാദത്ത്", "ഇബാദത്"],
    roman: ["ibadath", "ibadat", "ibaadath"],
  },
  { arabic: "فِقْه", malayalam: ["ഫിഖ്ഹ്", "ഫിഖ്‌ഹ്"], roman: ["fiqh", "fikh", "fiqhu"] },
  { arabic: "تَفْسِير", malayalam: ["തഫ്സീർ"], roman: ["tafseer", "tafsir", "thafseer"] },
  {
    arabic: "تَجْوِيد",
    malayalam: ["തജ്‌വീദ്", "തജ്വീദ്"],
    roman: ["tajweed", "tajwid", "thajweed"],
  },
  { arabic: "بَيْت", malayalam: ["ബൈത്ത്", "ബൈത്"], roman: ["baith", "bayth"] },
  { arabic: "مَوْت", malayalam: ["മൗത്ത്", "മൗത്"], roman: ["mawth", "mauth", "mowth"] },
  { arabic: "إِبْلِيس", malayalam: ["ഇബ്ലീസ്"], roman: ["iblees", "iblis"] },
  { arabic: "مَلَك", malayalam: ["മലക്ക്"], roman: ["malak"] },
  { arabic: "غَيْب", malayalam: ["ഗൈബ്"], roman: ["gaib", "ghaib", "ghayb"] },
  { arabic: "عَذَاب", malayalam: ["അദാബ്", "അസാബ്"], roman: ["azab", "adhab", "azaab"] },
  {
    arabic: "ثَوَاب",
    malayalam: ["സവാബ്", "ഥവാബ്"],
    roman: ["sawab", "swawab", "thawab", "sawaab"],
  },
  {
    arabic: "مُعْجِزَة",
    malayalam: ["മുഅ്ജിസത്ത്", "മുഅ്ജിസ"],
    roman: ["mujiza", "muajiza", "mujisath"],
  },
  { arabic: "كَرَامَة", malayalam: ["കറാമത്ത്"], roman: ["karamath", "karamat", "karaamath"] },
  { arabic: "عَقِيدَة", malayalam: ["അഖീദ"], roman: ["aqeeda", "akheeda", "aqida"] },
  { arabic: "مَذْهَب", malayalam: ["മദ്ഹബ്"], roman: ["madhab", "madhhab", "mazhab"] },
  {
    arabic: "شَرِيعَة",
    malayalam: ["ശരീഅത്ത്", "ശരീഅത്"],
    roman: ["shareeath", "shariath", "shariah", "shareeat"],
  },
  {
    arabic: "حَقِيقَة",
    malayalam: ["ഹഖീഖത്ത്", "ഹഖീഖത്"],
    roman: ["haqeeqath", "haqiqat", "hakeekath"],
  },
  {
    arabic: "مَعْرِفَة",
    malayalam: ["മഅ്‌രിഫത്ത്", "മഅ്രിഫത്ത്"],
    roman: ["marifath", "marifat", "maarifath"],
  },

  // Names of the Prophet's family, companions and prophets, spelled as in Arabic
  {
    arabic: "أَحْمَد",
    malayalam: ["അഹമ്മദ്", "അഹ്മദ്", "അഹമദ്"],
    roman: ["ahmad", "ahammed", "ahmed", "ahamed", "ahammad"],
  },
  {
    arabic: "مُصْطَفَى",
    malayalam: ["മുസ്തഫ", "മുസ്ഥഫ"],
    roman: ["mustafa", "musthafa", "mustapha"],
  },
  {
    arabic: "فَاطِمَة",
    malayalam: ["ഫാത്തിമ", "ഫാത്വിമ"],
    roman: ["fathima", "fatima", "faathima", "fathimath"],
  },
  {
    arabic: "عَائِشَة",
    malayalam: ["ആയിഷ", "ആഇശ", "ആഇഷ", "ആയിശ"],
    roman: ["ayisha", "aisha", "ayesha"],
  },
  { arabic: "خَدِيجَة", malayalam: ["ഖദീജ"], roman: ["khadeeja", "khadija", "khadeja", "qadeeja"] },
  {
    arabic: "زَيْنَب",
    malayalam: ["സൈനബ്", "സൈനബ"],
    roman: ["zainab", "zaynab", "sainab", "sainaba"],
  },
  { arabic: "مَرْيَم", malayalam: ["മർയം", "മറിയം"], roman: ["maryam", "mariyam"] },
  { arabic: "آمِنَة", malayalam: ["ആമിന"], roman: ["amina", "aamina"] },
  { arabic: "حَسَن", malayalam: ["ഹസൻ"], roman: ["hasan", "hassan"] },
  { arabic: "حُسَيْن", malayalam: ["ഹുസൈൻ"], roman: ["husain", "hussain", "husen", "hussein"] },
  { arabic: "عُمَر", malayalam: ["ഉമർ"], roman: ["umar", "omar", "umer"] },
  {
    arabic: "عُثْمَان",
    malayalam: ["ഉസ്മാൻ", "ഉഥ്മാൻ"],
    roman: ["usman", "uthman", "usmaan", "othman"],
  },
  {
    arabic: "أَبُو بَكْر",
    malayalam: ["അബൂബക്കർ", "അബൂബക്കര്", "അബൂബക്ര്"],
    roman: [
      "aboobacker",
      "aboobakar",
      "abubakar",
      "abubakker",
      "aboobakkar",
      "abubakkar",
      "abubacker",
    ],
  },
  { arabic: "بِلَال", malayalam: ["ബിലാൽ"], roman: ["bilal", "bilaal"] },
  { arabic: "خَالِد", malayalam: ["ഖാലിദ്"], roman: ["khalid", "khaalid"] },
  {
    arabic: "يُوسُف",
    malayalam: ["യൂസുഫ്", "യൂസഫ്"],
    roman: ["yusuf", "yoosuf", "yousuf", "yusuff"],
  },
  { arabic: "إِبْرَاهِيم", malayalam: ["ഇബ്രാഹിം"], roman: ["ibrahim", "ibraheem", "ebrahim"] },
  {
    arabic: "إِسْمَاعِيل",
    malayalam: ["ഇസ്മായിൽ", "ഇസ്മാഈൽ"],
    roman: ["ismail", "ismaeel", "ismayil"],
  },
  { arabic: "مُوسَى", malayalam: ["മൂസ", "മൂസാ"], roman: ["moosa", "musa"] },
  { arabic: "عِيسَى", malayalam: ["ഈസ", "ഈസാ"], roman: ["eesa", "eesaa"] },
  { arabic: "سُلَيْمَان", malayalam: ["സുലൈമാൻ"], roman: ["sulaiman", "sulaimaan", "sulayman"] },
  { arabic: "آدَم", malayalam: ["ആദം"], roman: ["adam", "aadam"] },
  { arabic: "دَاوُود", malayalam: ["ദാവൂദ്"], roman: ["dawood", "davood", "dawud"] },
];

const BY_MALAYALAM = new Map<string, string>();
const BY_ROMAN = new Map<string, { arabic: string; malayalam: string }>();

for (const entry of ARABIC_LOANWORDS) {
  for (const ml of entry.malayalam) BY_MALAYALAM.set(ml.normalize("NFC"), entry.arabic);
  for (const roman of entry.roman) {
    BY_ROMAN.set(roman.replace(/[^a-z]/g, ""), {
      arabic: entry.arabic,
      malayalam: entry.malayalam[0]!,
    });
  }
}

/*
 * Inflected forms (ഖബറിൽ, ശൈഖിന്റെ, ഹദീസുകൾ). Malayalam swaps a final chandrakkala or
 * chillu for a vowel sign, so the stem has to be recognised before the ending.
 * Only consonant-final stems and the commonest case endings are handled; anything
 * else falls back to letter-by-letter conversion.
 */
const CASE_ENDINGS: Record<string, readonly string[]> = {
  "ി": ["ൽ", "ന്", "ന്റെ", "നെ", "ലെ", "ലേക്ക്", "നോട്", "നായി", "നാൽ"],
  "ു": ["ം", "കൾ", "മാർ", "മായി"],
};
/** What a stem-final chillu becomes once a vowel sign follows it. */
const CHILLU_BASES: Record<string, readonly string[]> = {
  ൻ: ["ന"],
  ർ: ["ര", "റ"],
  ൽ: ["ല"],
  ൾ: ["ള"],
  ൺ: ["ണ"],
};

interface InflectableStem {
  prefix: string;
  arabic: string;
}

const INFLECTABLE_STEMS: InflectableStem[] = [];
for (const entry of ARABIC_LOANWORDS) {
  if (/\s/.test(entry.arabic)) continue;
  // The Arabic final ة is written ت before an ending (خِلَافَتِ).
  const arabic = entry.arabic.endsWith("ة") ? `${entry.arabic.slice(0, -1)}ت` : entry.arabic;
  for (const raw of entry.malayalam) {
    const ml = raw.normalize("NFC");
    const last = ml.slice(-1);
    if (last === "്") INFLECTABLE_STEMS.push({ prefix: ml.slice(0, -1), arabic });
    else if (CHILLU_BASES[last]) {
      for (const base of CHILLU_BASES[last]!) {
        INFLECTABLE_STEMS.push({ prefix: ml.slice(0, -1) + base, arabic });
      }
    }
  }
}
INFLECTABLE_STEMS.sort((a, b) => b.prefix.length - a.prefix.length);

function arabicSpellingForInflected(word: string): string | undefined {
  for (const { prefix, arabic } of INFLECTABLE_STEMS) {
    if (word.length <= prefix.length + 1 || !word.startsWith(prefix)) continue;
    const vowel = word[prefix.length]!;
    const ending = word.slice(prefix.length + 1);
    if (!CASE_ENDINGS[vowel]?.includes(ending)) continue;
    // Spell the ending on a placeholder letter, then keep everything after the placeholder.
    const tail = transliterateMalayalamToArabic(`ക${vowel}${ending}`).normalize("NFC").slice(1);
    return (arabic + tail).normalize("NFC");
  }
  return undefined;
}

/** Arabic spelling for a Malayalam word of Arabic origin, if known (also with a case ending). */
export function arabicSpellingForMalayalam(malayalam: string): string | undefined {
  const word = malayalam.normalize("NFC").trim();
  return BY_MALAYALAM.get(word) ?? arabicSpellingForInflected(word);
}

const MALAYALAM_LETTERS = "ഀ-ൿ‌‍";
const PHRASES = ARABIC_LOANWORDS.flatMap((entry) =>
  entry.malayalam
    .map((ml) => ml.normalize("NFC"))
    .filter((ml) => /\s/.test(ml))
    .map((ml) => ({
      pattern: new RegExp(
        `(?<![${MALAYALAM_LETTERS}])${ml.replace(/\s+/g, "\\s+")}(?![${MALAYALAM_LETTERS}])`,
        "gu",
      ),
      arabic: entry.arabic,
    })),
);

/** Replace multi-word loanwords (ഇൻശാ അല്ലാഹ്, അബ്ദുൽ ഖാദിർ) in running Malayalam text. */
export function replaceLoanwordPhrases(text: string): string {
  return PHRASES.reduce((result, { pattern, arabic }) => result.replace(pattern, arabic), text);
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
