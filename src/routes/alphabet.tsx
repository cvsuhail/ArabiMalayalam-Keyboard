import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "../components/SiteHeader";
import { Button } from "../components/ui/button";
import { FONT_FAMILIES, loadFont } from "../components/editor/fonts";
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
  type Letter,
} from "../lib/transliteration/alphabet";

const SITE_URL = "https://arabi-malayalam.cvsuhail.online";
const canonicalUrl = `${SITE_URL}/alphabet`;
const TITLE = "Arabi-Malayalam Alphabet: Letters, Vowel Signs and Spelling Guide";
const DESCRIPTION =
  "The complete Arabi-Malayalam alphabet: every Malayalam letter with its Arabi-Malayalam spelling, the letters added to Arabic, vowel signs, a full syllable chart and spelling rules.";

/** Fonts that draw Arabic script; the Malayalam-only fonts in the editor list are left out. */
const ARABIC_FONTS = FONT_FAMILIES.filter((font) => !/malayalam|manjari/i.test(font.id));

const faq = [
  {
    question: "How many letters does Arabi-Malayalam have?",
    answer: `This guide covers ${CONSONANTS.length} Malayalam consonants and ${VOWELS.length} vowels. They are written with Arabic letters plus ${ADDED_LETTERS.length} letters added to Arabic for Malayalam sounds.`,
  },
  {
    question: "Why does Arabi-Malayalam need extra letters?",
    answer:
      "Malayalam has sounds that Arabic does not, such as the retroflex ṭ, ḍ and ṇ, the palatal ñ, the velar ṅ, ḷ, ḻ and the two r sounds. Arabi-Malayalam adds dotted and modified letters for them, and ھ to mark aspirated consonants.",
  },
  {
    question: "How is a long ā written in Arabi-Malayalam?",
    answer:
      "As a fatha followed by alef. Long ī is a kasra followed by yeh, and long ū is a damma followed by waw. Two extra marks write the Malayalam e and o vowels.",
  },
  {
    question: "Is Arabi-Malayalam a different language from Malayalam?",
    answer:
      "No. It is Malayalam written in Arabic script. Read aloud, it has the same sounds and meaning as Malayalam. Words of Arabic origin keep their Arabic spelling.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl,
    inLanguage: "en",
    about: "Arabi-Malayalam script",
    author: { "@type": "Person", name: "CvSuhail", url: "https://www.cvsuhail.online/" },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ArabiMalayalam", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Alphabet", item: canonicalUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

export const Route = createFileRoute("/alphabet")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:url", content: canonicalUrl },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: jsonLd.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data),
    })),
  }),
  component: AlphabetPage,
});

const SECTIONS = [
  ["vowels", "Vowels"],
  ["consonants", "Consonants"],
  ["chart", "Syllable chart"],
  ["rules", "Spelling rules"],
  ["loanwords", "Arabic words"],
  ["try", "Try it"],
  ["faq", "Questions"],
] as const;

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`Copied ${text}`);
}

/** Arabi-Malayalam text, drawn right to left in the font chosen on the page. */
function Arabi({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span
      dir="rtl"
      lang="ml-Arab"
      className={className}
      style={{ fontFamily: "var(--arabi-font)" }}
    >
      {children}
    </span>
  );
}

function LetterCard({ letter }: { letter: Letter }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => copy(letter.arabi)}
        aria-label={`${letter.ml} ${letter.sound}: ${letter.arabi}. Copy`}
        className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary hover:bg-primary-soft"
      >
        <span className="text-sm text-muted-foreground">
          {letter.ml} · {letter.sound}
        </span>
        <Arabi className="text-5xl leading-[1.6]">{letter.arabi}</Arabi>
        {letter.extra ? (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
            added letter · {letter.addedCodePoints.join(" ")}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Arabic letter</span>
        )}
      </button>
    </li>
  );
}

function AlphabetPage() {
  const [fontId, setFontId] = useState(ARABIC_FONTS[0]!.id);
  const font = ARABIC_FONTS.find((f) => f.id === fontId) ?? ARABIC_FONTS[0]!;

  useEffect(() => loadFont(font), [font]);

  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      style={{ "--arabi-font": font.font } as React.CSSProperties}
    >
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary">
          Alphabet guide
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          The Arabi-Malayalam alphabet
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          Arabi-Malayalam writes Malayalam in Arabic script. Because Malayalam has sounds Arabic
          does not, the script added {ADDED_LETTERS.length} letters and two vowel marks. This guide
          shows every letter, how vowels are written, and the spelling rules the keyboard follows.
          It is generated from the keyboard&apos;s own conversion tables, so what you see here is
          what the keyboard types. Tap any letter or syllable to copy it.
        </p>

        <div className="no-print mt-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            Font
            <select
              value={fontId}
              onChange={(e) => setFontId(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            >
              {ARABIC_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Print this guide
          </Button>
        </div>

        <nav aria-label="Sections" className="no-print mt-6 flex flex-wrap gap-2">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium hover:bg-primary-soft"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="added" className="mt-10" aria-labelledby="added-title">
          <h2 id="added-title" className="text-2xl font-extrabold">
            Letters added to Arabic
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            These {ADDED_LETTERS.length} letters are not in the basic Arabic alphabet. Most are an
            Arabic letter with extra dots; ھ writes ഹ and also marks aspirated consonants.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {ADDED_LETTERS.map((added) => (
              <li key={added.arabi}>
                <button
                  type="button"
                  onClick={() => copy(added.arabi)}
                  aria-label={`${added.arabi} writes ${added.ml.join(" ")}. Copy`}
                  className="flex w-full cursor-pointer flex-col items-center rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary hover:bg-primary-soft"
                >
                  <Arabi className="text-5xl leading-[1.6]">{added.arabi}</Arabi>
                  <span className="text-sm font-semibold">{added.ml.join(" ")}</span>
                  <span className="text-[11px] text-muted-foreground">{added.codePoint}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="vowels" className="mt-12" aria-labelledby="vowels-title">
          <h2 id="vowels-title" className="text-2xl font-extrabold">
            Vowels
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Each vowel is shown at the start of a word, and after the consonant ക to show how it is
            written on a letter. Vowels are always written as marks, never left out.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[32rem] text-center">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="p-3 text-left font-semibold">
                    Malayalam
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Sound
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Start of a word
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    After ക
                  </th>
                </tr>
              </thead>
              <tbody>
                {VOWELS.map((vowel) => (
                  <tr key={vowel.ml} className="border-b border-border last:border-0">
                    <td className="p-2 text-left text-xl">{vowel.ml}</td>
                    <td className="p-2 text-muted-foreground">{vowel.sound}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => copy(vowel.initial)}
                        aria-label={`${vowel.initial}. Copy`}
                        className="cursor-pointer rounded-md px-3 hover:bg-primary-soft"
                      >
                        <Arabi className="text-3xl leading-[1.8]">{vowel.initial}</Arabi>
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => copy(vowel.afterKa)}
                        aria-label={`${vowel.afterKa}. Copy`}
                        className="cursor-pointer rounded-md px-3 hover:bg-primary-soft"
                      >
                        <Arabi className="text-3xl leading-[1.8]">{vowel.afterKa}</Arabi>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="consonants" className="mt-12" aria-labelledby="consonants-title">
          <h2 id="consonants-title" className="text-2xl font-extrabold">
            Consonants
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            The {CONSONANTS.length} Malayalam consonants in the traditional order. This keyboard
            writes ഖ with ق; words that need خ come from the Arabic-words list below.
          </p>
          {CONSONANT_GROUPS.map((group) => (
            <div key={group.title} className="mt-6">
              <h3 className="text-lg font-bold">{group.title}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {group.letters.map((letter) => (
                  <LetterCard key={letter.ml} letter={letter} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="chart" className="mt-12" aria-labelledby="chart-title">
          <h2 id="chart-title" className="text-2xl font-extrabold">
            Syllable chart
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Every consonant with every vowel, as the keyboard writes it. Scroll sideways on a phone.
          </p>
          <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-card print:max-h-none">
            <table className="w-full min-w-[56rem] border-collapse text-center">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-card p-2 text-left font-semibold"
                  >
                    Letter
                  </th>
                  {VOWELS.map((vowel) => (
                    <th key={vowel.ml} scope="col" className="p-2 font-semibold">
                      {vowel.sound}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONSONANTS.map((consonant) => (
                  <tr key={consonant.ml} className="border-b border-border last:border-0">
                    <th
                      scope="row"
                      className="sticky left-0 bg-card p-2 text-left text-lg font-semibold"
                    >
                      {consonant.ml}
                    </th>
                    {syllableRow(consonant).map((cell) => (
                      <td key={cell.ml} className="p-0">
                        <button
                          type="button"
                          onClick={() => copy(cell.arabi)}
                          aria-label={`${cell.ml}: ${cell.arabi}. Copy`}
                          className="w-full cursor-pointer px-1 py-1 hover:bg-primary-soft"
                        >
                          <Arabi className="text-2xl leading-[1.8]">{cell.arabi}</Arabi>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="rules" className="mt-12" aria-labelledby="rules-title">
          <h2 id="rules-title" className="text-2xl font-extrabold">
            Spelling rules
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {SPELLING_RULES.map((rule) => (
              <article key={rule.title} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-bold">{rule.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{rule.text}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {rule.examples.map((example) => (
                    <li key={example.ml}>
                      <button
                        type="button"
                        onClick={() => copy(example.arabi)}
                        aria-label={`${example.ml}, ${example.note}: ${example.arabi}. Copy`}
                        className="flex cursor-pointer flex-col items-center rounded-lg bg-muted px-3 py-1 hover:bg-primary-soft"
                      >
                        <Arabi className="text-3xl leading-[1.7]">{example.arabi}</Arabi>
                        <span className="text-xs text-muted-foreground">
                          {example.ml} · {example.note}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-bold">Chillu letters</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {CHILLUS.map((chillu) => (
                  <li key={chillu.ml} className="rounded-lg bg-muted px-3 py-1 text-center">
                    <Arabi className="text-3xl leading-[1.7]">{chillu.arabi}</Arabi>
                    <div className="text-xs text-muted-foreground">{chillu.ml}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-bold">Numbers</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {DIGITS.map((digit) => (
                  <li key={digit.ml} className="rounded-lg bg-muted px-3 py-1 text-center">
                    <Arabi className="text-3xl leading-[1.7]">{digit.arabi}</Arabi>
                    <div className="text-xs text-muted-foreground">{digit.ml}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="loanwords" className="mt-12" aria-labelledby="loanwords-title">
          <h2 id="loanwords-title" className="text-2xl font-extrabold">
            Words of Arabic origin
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Words that came from Arabic keep their Arabic spelling instead of being written letter
            by letter from the Malayalam. The keyboard offers these first, so സ്വലാത്ത് becomes
            صَلَاة and not the sound-for-sound spelling beside it.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[36rem] text-center">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="p-3 text-left font-semibold">
                    Malayalam
                  </th>
                  <th scope="col" className="p-3 text-left font-semibold">
                    Meaning
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Arabic spelling (used)
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Letter by letter
                  </th>
                </tr>
              </thead>
              <tbody>
                {LOANWORDS.map((word) => (
                  <tr key={word.ml} className="border-b border-border last:border-0">
                    <td className="p-2 text-left text-lg">{word.ml}</td>
                    <td className="p-2 text-left text-sm text-muted-foreground">{word.meaning}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => copy(word.spelling)}
                        aria-label={`${word.spelling}. Copy`}
                        className="cursor-pointer rounded-md px-3 hover:bg-primary-soft"
                      >
                        <Arabi className="text-3xl leading-[1.8]">{word.spelling}</Arabi>
                      </button>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      <Arabi className="text-2xl leading-[1.8]">{word.letterByLetter}</Arabi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TryIt />

        <section id="faq" className="mt-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-extrabold">
            Questions
          </h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {faq.map(({ question, answer }) => (
              <details key={question} className="group p-4" open>
                <summary className="cursor-pointer font-bold">{question}</summary>
                <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="no-print mt-10 text-sm text-muted-foreground">
          Ready to write?{" "}
          <Link to="/" className="font-semibold text-primary underline underline-offset-2">
            Open the keyboard
          </Link>
          , read{" "}
          <Link
            to="/how-to-type-arabi-malayalam"
            className="font-semibold text-primary underline underline-offset-2"
          >
            how to type Arabi-Malayalam
          </Link>
          , or try the{" "}
          <Link to="/fonts" className="font-semibold text-primary underline underline-offset-2">
            ARML fonts
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

/** A small converter: type Malayalam, see it in Arabi-Malayalam. */
function TryIt() {
  const [text, setText] = useState("കേരളം");
  const [converted, setConverted] = useState("");

  useEffect(() => {
    let active = true;
    void import("../lib/transliteration/smartManglishLayer").then(
      ({ transliterateMalayalamText }) => {
        if (active) setConverted(transliterateMalayalamText(text));
      },
    );
    return () => {
      active = false;
    };
  }, [text]);

  return (
    <section id="try" className="no-print mt-12" aria-labelledby="try-title">
      <h2 id="try-title" className="text-2xl font-extrabold">
        Try it
      </h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Type or paste Malayalam and see how it is written in Arabi-Malayalam. To type in English
        letters, use the keyboard.
      </p>
      <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Malayalam
          <textarea
            lang="ml"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-y rounded-lg border border-input bg-transparent p-3 text-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <div className="grid gap-1 text-sm font-medium">
          Arabi-Malayalam
          <div
            dir="rtl"
            lang="ml-Arab"
            aria-live="polite"
            className="min-h-24 rounded-lg bg-muted p-3 text-3xl leading-[1.9]"
            style={{ fontFamily: "var(--arabi-font)" }}
          >
            {converted}
          </div>
        </div>
      </div>
    </section>
  );
}
