/**
 * Deterministic Malayalam -> Arabi-Malayalam transliterator.
 *
 * The tables intentionally contain no inherent vowel. The parser first reads
 * a complete Malayalam syllable (including conjuncts) and only then appends
 * the appropriate Arabic vowel mark. This prevents combinations such as
 * `ക്കി` from receiving both fat-ha and kasra.
 */

const FATHA = "َ";
const KASRA = "ِ";
const DAMMA = "ُ";
const SUKUN = "ْ";
const SHADDA = "ّ";
const INVERTED_DAMMA = "ٗ";

const INDEPENDENT_VOWELS: Record<string, string> = {
  അ: `ا${FATHA}`,
  ആ: "اٰ",
  ഇ: `ا${KASRA}`,
  ഈ: `ا${KASRA}ی`,
  ഉ: `ا${DAMMA}`,
  ഊ: `ا${DAMMA}و`,
  ഋ: `ر${SUKUN}`,
  ൠ: `ر${SHADDA}${SUKUN}`,
  ഌ: `ل${SUKUN}`,
  ൡ: `ل${SHADDA}${SUKUN}`,
  എ: "ا٘",
  ഏ: "ا٘ی",
  ഐ: `ا${FATHA}ی`,
  ഒ: `ا${INVERTED_DAMMA}`,
  ഓ: `ا${INVERTED_DAMMA}و`,
  ഔ: `ا${FATHA}و`,
  // Archaic independent ii.
  ൟ: `ا${KASRA}ی`,
};

/** Malayalam consonants without their inherent /a/. */
const CONSONANTS: Record<string, string> = {
  ക: "ک",
  ഖ: "خ",
  ഗ: "گ",
  ഘ: `گ${SHADDA}`,
  ങ: "ۼ",
  ച: "چ",
  ഛ: `چ${SHADDA}`,
  ജ: "ج",
  ഝ: `ج${SHADDA}`,
  ഞ: "ڿ",
  ട: "ڊ",
  ഠ: `ٹ${SHADDA}`,
  ഡ: "ڈ",
  ഢ: `ڈ${SHADDA}`,
  ണ: "ڹ",
  ത: "ت",
  ഥ: `ت${SHADDA}`,
  ദ: "د",
  ധ: "د",
  ന: "ن",
  ഩ: "ن",
  പ: "پ",
  ഫ: "ف",
  ബ: "ب",
  ഭ: `ب${SHADDA}`,
  മ: "م",
  യ: "ی",
  ര: "ڔ",
  ല: "ل",
  വ: "و",
  ശ: "ش",
  ഷ: `ش${SHADDA}`,
  സ: "س",
  ഹ: "ح",
  ള: "ۻ",
  ഴ: "ژ",
  റ: "ر",
  ഺ: "ر",
};

/** Dependent vowels. U+0D57 is the modern AU length mark. */
const VOWEL_SIGNS: Record<string, string> = {
  "ാ": "ا",
  "ി": KASRA,
  "ീ": `${KASRA}ي`,
  "ു": DAMMA,
  "ൂ": `${DAMMA}و`,
  "ൃ": `${SUKUN}ر`,
  "ൄ": `${SUKUN}ر${SHADDA}`,
  "ൢ": `${SUKUN}ل`,
  "ൣ": `${SUKUN}ل${SHADDA}`,
  "െ": "٘",
  "േ": "٘ی",
  "ൈ": `${FATHA}ی`,
  "ൊ": INVERTED_DAMMA,
  "ോ": `${INVERTED_DAMMA}و`,
  "ൌ": `${FATHA}و`,
  "ൗ": `${FATHA}و`,
};

const VIRAMAS = new Set(["്", "഻", "഼"]);

const SYLLABLE_MODIFIERS: Record<string, string> = {
  "ഀ": `ن${SUKUN}`, // combining anusvara above
  "ഁ": `ن${SUKUN}`, // candrabindu / nasalisation
  "ം": `م${SUKUN}`, // anusvara
  "ഃ": `ح${SUKUN}`, // visarga
};

const CHILLUS: Record<string, string> = {
  ൺ: `ڹ${SUKUN}`,
  ൻ: `ن${SUKUN}`,
  ർ: `ر${SUKUN}`,
  ൽ: `ل${SUKUN}`,
  ൾ: `ۻ${SUKUN}`,
  ൿ: `ک${SUKUN}`,
  ൔ: `م${SUKUN}`,
  ൕ: `ی${SUKUN}`,
  ൖ: `ژ${SUKUN}`,
};

const DIGITS_AND_PUNCTUATION: Record<string, string> = {
  "൦": "۰",
  "൧": "۱",
  "൨": "۲",
  "൩": "۳",
  "൪": "۴",
  "൫": "۵",
  "൬": "۶",
  "൭": "۷",
  "൮": "۸",
  "൯": "۹",
  "൹": "۔",
};

/**
 * Irregular conjunct bases. Regular conjuncts are produced automatically as
 * consonant+sukun+consonant; doubled consonants use shadda.
 */
const CONJUNCTS: Record<string, string> = {
  ക്‌ഷ: `ک${SUKUN}ش`, // defensive form containing a ZWNJ
  ക്ഷ: `ک${SUKUN}ش`,
  ജ്ഞ: `ج${SUKUN}ڿ`,
  ശ്ര: `ش${SUKUN}ر`,
  സ്ര: `س${SUKUN}ر`,
  ഹ്ര: `ح${SUKUN}ر`,
  സ്വ: "ص",
  ദ്ധ: `د${SHADDA}ھ`,
  ങ്ക: `ن${SUKUN}ک`,
  ന്റ: `ن${SUKUN}ڔ`,
  റ്റ: `ڔ${SHADDA}`,
  ഞ്ച: `ڿ${SUKUN}چ`,
  ണ്ട: `ڹ${SUKUN}ڈ`,
  ന്ത: `ن${SUKUN}ت`,
  മ്പ: `م${SUKUN}پ`,
};

const SPECIAL_PHRASES: Array<[string, string]> = [
  ["ബിസ്മില്ലാഹി റഹ്മാനി റഹീം", "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ"],
  ["അസ്സലാമു അലൈക്കും", "اَلسَّلامُ عَلَيْكُم"],
  ["മുഹമ്മദ്", "مُحَمَّدْ"],
  ["അള്ളാഹു", "اللهُ"],
  ["അല്ലാഹു", "اللهُ"],
  ["അള്ളാഹ്", "اللهُ"],
  ["അല്ലാഹ്", "اللهُ"],
  ["(സ്വ)", "ﷺ"],
];

const JOINERS = new Set(["\u200C", "\u200D"]);

function replaceSpecialPhrases(text: string): string {
  return SPECIAL_PHRASES.reduce(
    (result, [source, target]) => result.split(source).join(target),
    text,
  );
}

function renderConjunct(source: string, letters: string[]): string {
  const irregular = CONJUNCTS[source];
  if (irregular) return irregular;

  let rendered = "";
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i]!;
    const next = letters[i + 1];
    if (next && letter === next) {
      rendered += letter + SHADDA;
      i += 1;
      continue;
    }
    rendered += letter + (next ? SUKUN : "");
  }
  return rendered;
}

/** Convert Malayalam text while preserving non-Malayalam content verbatim. */
export function transliterateMalayalamToArabic(input: string): string {
  const chars = Array.from(replaceSpecialPhrases(input.normalize("NFC")));
  let result = "";

  for (let i = 0; i < chars.length; i++) {
    const current = chars[i]!;

    if (INDEPENDENT_VOWELS[current]) {
      result += INDEPENDENT_VOWELS[current];
      continue;
    }
    if (CHILLUS[current]) {
      result += CHILLUS[current];
      continue;
    }
    if (DIGITS_AND_PUNCTUATION[current]) {
      result += DIGITS_AND_PUNCTUATION[current];
      continue;
    }
    if (SYLLABLE_MODIFIERS[current]) {
      result += SYLLABLE_MODIFIERS[current];
      continue;
    }

    const firstLetter = CONSONANTS[current];
    if (firstLetter) {
      const sourceParts = [current];
      const letters = [firstLetter];
      let cursor = i;
      let explicitVirama = false;

      while (VIRAMAS.has(chars[cursor + 1] ?? "")) {
        const virama = chars[cursor + 1]!;
        let nextIndex = cursor + 2;
        const joiner = JOINERS.has(chars[nextIndex] ?? "") ? chars[nextIndex++] : undefined;
        const nextChar = chars[nextIndex];
        const nextLetter = nextChar ? CONSONANTS[nextChar] : undefined;

        if (!nextLetter || joiner === "\u200D") {
          // A terminal virama (including legacy consonant+virama+ZWJ chillu).
          explicitVirama = true;
          cursor = joiner ? nextIndex - 1 : cursor + 1;
          break;
        }

        sourceParts.push(virama);
        if (joiner) sourceParts.push(joiner);
        sourceParts.push(nextChar!);
        letters.push(nextLetter);
        cursor = nextIndex;
      }

      let rendered = renderConjunct(sourceParts.join(""), letters);
      const following = chars[cursor + 1];
      if (explicitVirama) {
        rendered += SUKUN;
      } else if (following && VOWEL_SIGNS[following]) {
        rendered += VOWEL_SIGNS[following];
        cursor += 1;
      } else {
        rendered += FATHA;
      }

      while (SYLLABLE_MODIFIERS[chars[cursor + 1] ?? ""]) {
        rendered += SYLLABLE_MODIFIERS[chars[cursor + 1]!]!;
        cursor += 1;
      }

      result += rendered;
      i = cursor;
      continue;
    }

    // Keep malformed/standalone signs usable instead of silently dropping them.
    if (VOWEL_SIGNS[current]) {
      result += VOWEL_SIGNS[current];
    } else if (VIRAMAS.has(current)) {
      result += SUKUN;
    } else if (current === "ൎ") {
      result += `ر${SUKUN}`; // dot reph
    } else {
      result += current;
    }
  }

  return result;
}

/** Alternate spelling that uses regular damma for Malayalam o/oo. */
export function withStandardOMarks(text: string): string {
  return text.replaceAll(INVERTED_DAMMA, DAMMA);
}
