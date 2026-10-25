/**
 * Deterministic Malayalam -> Arabi-Malayalam transliterator.
 *
 * Letter choices follow the standard Arabi-Malayalam table (ഞ ڿ, ങ ۼ, ട ڊ,
 * ഡ ڗ, ണ ڹ, ള ۻ, ഴ ژ, ഷ ۺ, ര ڔ, റ ر, aspirates with ھ, e ٘, o ٗ), with
 * these house choices where sources differ: ā as fatha + alef (كَا, initial
 * آ), ഹ as ھ, ഖ as ق, and the dotted Arabic yeh ي.
 *
 * The tables intentionally contain no inherent vowel. The parser first reads
 * a complete Malayalam syllable (including conjuncts) and only then appends
 * the appropriate Arabic vowel mark. This prevents combinations such as
 * `ക്കി` from receiving both fat-ha and kasra. Vowel marks sit on the base
 * letter of an aspirate, before its ھ: ഥി -> تِھ. Output is NFC, so marks
 * are in Unicode's canonical order (vowel mark before shadda).
 */

const FATHA = "َ";
const KASRA = "ِ";
const DAMMA = "ُ";
const SUKUN = "ْ";
const SHADDA = "ّ";
const INVERTED_DAMMA = "ٗ";
const ASPIRATE = "ھ";
const YEH = "ي";

const INDEPENDENT_VOWELS: Record<string, string> = {
  അ: `ا${FATHA}`,
  ആ: "آ",
  ഇ: `ا${KASRA}`,
  ഈ: `ا${KASRA}${YEH}`,
  ഉ: `ا${DAMMA}`,
  ഊ: `ا${DAMMA}و`,
  ഋ: `ر${SUKUN}`,
  ൠ: `ر${SHADDA}${SUKUN}`,
  ഌ: `ل${SUKUN}`,
  ൡ: `ل${SHADDA}${SUKUN}`,
  എ: "ا٘",
  ഏ: `ا٘${YEH}`,
  ഐ: `ا${FATHA}${YEH}${SUKUN}`,
  ഒ: `ا${INVERTED_DAMMA}`,
  ഓ: `ا${INVERTED_DAMMA}و`,
  ഔ: `ا${FATHA}و${SUKUN}`,
  // Archaic independent ii.
  ൟ: `ا${KASRA}${YEH}`,
};

/** Malayalam consonants without their inherent /a/. Aspirates end in ھ. */
const CONSONANTS: Record<string, string> = {
  ക: "ك",
  ഖ: "ق",
  ഗ: "گ",
  ഘ: `گ${ASPIRATE}`,
  ങ: "ۼ",
  ച: "چ",
  ഛ: `چ${ASPIRATE}`,
  ജ: "ج",
  ഝ: `ج${ASPIRATE}`,
  ഞ: "ڿ",
  ട: "ڊ",
  ഠ: `ڊ${ASPIRATE}`,
  ഡ: "ڗ",
  ഢ: `ڗ${ASPIRATE}`,
  ണ: "ڹ",
  ത: "ت",
  ഥ: `ت${ASPIRATE}`,
  ദ: "د",
  ധ: `د${ASPIRATE}`,
  ന: "ن",
  ഩ: "ن",
  പ: "پ",
  ഫ: "ف",
  ബ: "ب",
  ഭ: `ب${ASPIRATE}`,
  മ: "م",
  യ: YEH,
  ര: "ڔ",
  ല: "ل",
  വ: "و",
  ശ: "ش",
  ഷ: "ۺ",
  സ: "س",
  ഹ: ASPIRATE, // the letter itself; aspirates are a base letter followed by it
  ള: "ۻ",
  ഴ: "ژ",
  റ: "ر",
  ഺ: "ر",
};

/** Dependent vowels. U+0D57 is the modern AU length mark. */
const VOWEL_SIGNS: Record<string, string> = {
  "ാ": `${FATHA}ا`,
  "ി": KASRA,
  "ീ": `${KASRA}${YEH}`,
  "ു": DAMMA,
  "ൂ": `${DAMMA}و`,
  "ൃ": `${SUKUN}ر${SUKUN}`,
  "ൄ": `${SUKUN}ر${SHADDA}${SUKUN}`,
  "ൢ": `${SUKUN}ل${SUKUN}`,
  "ൣ": `${SUKUN}ل${SHADDA}${SUKUN}`,
  "െ": "٘",
  "േ": `٘${YEH}`,
  "ൈ": `${FATHA}${YEH}${SUKUN}`,
  "ൊ": INVERTED_DAMMA,
  "ോ": `${INVERTED_DAMMA}و`,
  "ൌ": `${FATHA}و${SUKUN}`,
  "ൗ": `${FATHA}و${SUKUN}`,
};

const VIRAMAS = new Set(["്", "഻", "഼"]);

const SYLLABLE_MODIFIERS: Record<string, string> = {
  "ഀ": `ن${SUKUN}`, // combining anusvara above
  "ഁ": `ن${SUKUN}`, // candrabindu / nasalisation
  "ം": `م${SUKUN}`, // anusvara
  "ഃ": `${ASPIRATE}${SUKUN}`, // visarga
};

/** Anusvara before a velar is pronounced ṅ and written with ۼ: ശംഖ്, സംഗീതം. */
const VELARS = new Set(["ക", "ഖ", "ഗ", "ഘ"]);

function renderModifier(mark: string, next: string | undefined): string {
  if (mark === "ം" && next && VELARS.has(next)) return `ۼ${SUKUN}`;
  return SYLLABLE_MODIFIERS[mark]!;
}

const CHILLUS: Record<string, string> = {
  ൺ: `ڹ${SUKUN}`,
  ൻ: `ن${SUKUN}`,
  ർ: `ر${SUKUN}`,
  ൽ: `ل${SUKUN}`,
  ൾ: `ۻ${SUKUN}`,
  ൿ: `ك${SUKUN}`,
  ൔ: `م${SUKUN}`,
  ൕ: `${YEH}${SUKUN}`,
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
 * Conjuncts with a conventional spelling. Everything else is produced
 * regularly: consonant+sukun+consonant, with shadda for doubled letters
 * (including an aspirate doubled on its own base, ദ്ധ -> دّھ). സ്വ is
 * regular (സ്വന്തം -> سْوَنْتَمْ); Arabic ص words such as സ്വലാത്ത് get their
 * spelling from arabicLoanwords.ts.
 */
const CONJUNCTS: Record<string, string> = {
  ങ്ക: `ن${SUKUN}ك`,
  ന്റ: `ن${SUKUN}ڔ`,
  റ്റ: `ڔ${SHADDA}`,
};

/** Multi-word phrases with an established Arabic spelling. */
const SPECIAL_PHRASES: Array<[string, string]> = [
  ["ബിസ്മില്ലാഹി റഹ്മാനി റഹീം", "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ"],
  ["അസ്സലാമു അലൈക്കും", "اَلسَّلَامُ عَلَيْكُمْ"],
  ["(സ്വ)", "ﷺ"],
];

const JOINERS = new Set(["‌", "‍"]);
const LEADING_MARKS = /^[ً-ٰٟ]*/u;

function replaceSpecialPhrases(text: string): string {
  return SPECIAL_PHRASES.reduce(
    (result, [source, target]) => result.split(source).join(target),
    text,
  );
}

// An aspirate is a base letter followed by ھ; ھ on its own is ഹ, not an aspirate.
const isAspirate = (letter: string) => letter.length > 1 && letter.endsWith(ASPIRATE);
const baseOf = (letter: string) => (isAspirate(letter) ? letter.slice(0, -1) : letter);
const tailOf = (letter: string) => (isAspirate(letter) ? ASPIRATE : "");

/**
 * Render a consonant cluster. Returns the body (up to the last base letter)
 * and the tail (ھ of a final aspirate) separately, so the vowel mark can be
 * placed between them.
 */
function renderConjunct(source: string, letters: string[]): { body: string; tail: string } {
  const irregular = CONJUNCTS[source];
  if (irregular) return { body: irregular, tail: "" };

  let body = "";
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i]!;
    const next = letters[i + 1];
    if (next && baseOf(next) === baseOf(letter)) {
      body += baseOf(letter) + SHADDA;
      if (i + 1 === letters.length - 1) return { body, tail: tailOf(next) };
      body += tailOf(next) ? SUKUN + tailOf(next) : SUKUN;
      i += 1;
      continue;
    }
    if (!next) return { body: body + baseOf(letter), tail: tailOf(letter) };
    body += baseOf(letter) + SUKUN + tailOf(letter);
  }
  return { body, tail: "" };
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
      result += renderModifier(current, chars[i + 1]);
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

        if (!nextLetter || joiner === "‍") {
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

      const { body, tail } = renderConjunct(sourceParts.join(""), letters);
      const following = chars[cursor + 1];
      let rendered: string;
      if (explicitVirama) {
        rendered = body + SUKUN + tail;
      } else if (following && VOWEL_SIGNS[following]) {
        const sign = VOWEL_SIGNS[following];
        const marks = LEADING_MARKS.exec(sign)![0];
        rendered = body + marks + tail + sign.slice(marks.length);
        cursor += 1;
      } else {
        rendered = body + FATHA + tail;
      }

      while (SYLLABLE_MODIFIERS[chars[cursor + 1] ?? ""]) {
        rendered += renderModifier(chars[cursor + 1]!, chars[cursor + 2]);
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

  return result.normalize("NFC");
}

/** Alternate spelling that uses regular damma for Malayalam o/oo. */
export function withStandardOMarks(text: string): string {
  return text.replaceAll(INVERTED_DAMMA, DAMMA);
}
