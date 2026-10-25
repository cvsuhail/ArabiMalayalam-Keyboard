import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { toArmlDetailed } from "../lib/arml";

const SITE_URL = "https://arabi-malayalam.cvsuhail.online";
const canonicalUrl = `${SITE_URL}/fonts`;

export const Route = createFileRoute("/fonts")({
  head: () => ({
    meta: [
      { title: "ARML Fonts | Arabi-Malayalam Legacy Encoding" },
      {
        name: "description",
        content:
          "Try the cvsuhail ARML fonts: pre-shaped Arabi-Malayalam fonts for software that cannot shape Arabic. Preview your text and copy it as ARML.",
      },
      { property: "og:url", content: canonicalUrl },
      { property: "og:title", content: "ARML Fonts for Arabi-Malayalam" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
  }),
  component: FontsPage,
});

interface ArmlFont {
  id: string;
  label: string;
  style: string;
  base: string;
  licence: string;
  file: string;
}

const SAMPLE =
  "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ\nاَلسَّلَامُ عَلَيْكُمْ\nڿَانْ ا٘ۼَّن٘ ڔَۻَيۺَمْ";

const familyName = (font: ArmlFont) => `"${font.id}"`;

function FontsPage() {
  const [fonts, setFonts] = useState<ArmlFont[]>([]);
  const [text, setText] = useState(SAMPLE);
  const [size, setSize] = useState(40);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/fonts/arml/fonts.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((list: ArmlFont[]) => active && setFonts(list))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const converted = useMemo(() => toArmlDetailed(text), [text]);

  const fontFaces = fonts
    .map(
      (font) =>
        `@font-face{font-family:${familyName(font)};src:url(/fonts/arml/${font.file}) format("woff2");font-display:swap}`,
    )
    .join("");

  const copyArml = async () => {
    if (!converted.text.trim()) {
      toast.error("Nothing to copy!");
      return;
    }
    await navigator.clipboard.writeText(converted.text);
    toast.success("Copied as ARML", { description: "Paste it where an ARML font is applied." });
  };

  const useLatestDocument = async () => {
    const { listDocuments } = await import("../lib/db/documents");
    const [latest] = await listDocuments();
    if (!latest?.plainText.trim()) {
      toast.info("Your latest file is empty.");
      return;
    }
    setText(latest.plainText);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <style>{fontFaces}</style>
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 rounded-xl font-extrabold">
            <img src="/favicon.png" alt="" className="size-9 rounded-xl" />
            <span>ArabiMalayalam</span>
          </Link>
          <Button asChild>
            <Link to="/">Open keyboard</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary">ARML</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Try the ARML fonts</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          ARML is a legacy code for Arabi-Malayalam, like FML is for Malayalam. Each letter is
          already shaped and each line is stored as it is drawn, so programs that cannot join or
          reorder Arabic still show it correctly once an ARML font is applied. Type or paste your
          text below, see it in every font, and copy it as ARML for free.
        </p>

        <section className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="arml-source" className="text-sm font-bold">
              Your Arabi-Malayalam text
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={useLatestDocument}>
                Use my latest file
              </Button>
              <Button size="sm" onClick={copyArml}>
                <Copy /> Copy as ARML
              </Button>
            </div>
          </div>
          <textarea
            id="arml-source"
            dir="rtl"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-y rounded-lg border border-input bg-transparent p-3 text-xl leading-loose focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ fontFamily: "var(--font-arabi)" }}
          />
          <label className="flex items-center gap-3 text-sm font-medium">
            Size
            <input
              type="range"
              min={20}
              max={72}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="max-w-56 flex-1 accent-primary"
            />
            <span className="w-10 tabular-nums text-muted-foreground">{size}px</span>
          </label>
          {converted.latinLetters > 0 && (
            <p role="status" className="text-sm text-muted-foreground">
              {converted.latinLetters} Latin letters are kept as typed. They need a Latin font in
              your program.
            </p>
          )}
          {converted.unmapped.length > 0 && (
            <p role="status" className="text-sm text-muted-foreground">
              No ARML glyph for {converted.unmapped.join(" ")}; left out.
            </p>
          )}
        </section>

        {failed && (
          <p role="alert" className="mt-8 text-destructive">
            The font list could not be loaded. Please refresh.
          </p>
        )}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {fonts.map((font) => (
            <li
              key={font.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-mono text-sm font-bold">{font.id}</h2>
                <span className="text-xs text-muted-foreground">
                  {font.base.replace(/\[.*\]|-Regular|\.ttf/g, "")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{font.style}</p>
              <div
                dir="ltr"
                lang="ml-Arab"
                aria-label={`${font.label} preview`}
                className="mt-4 min-h-24 whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-left leading-[1.9]"
                style={{ fontFamily: `${familyName(font)}, serif`, fontSize: size }}
              >
                {converted.text}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={`/fonts/arml/${font.licence}`}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  SIL Open Font Licence
                </a>
                <Button variant="outline" size="sm" onClick={copyArml}>
                  <Copy /> Copy ARML
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-3xl text-sm leading-6 text-muted-foreground">
          The previews show the ARML text itself, drawn by each font, not Unicode. Font downloads
          for other programs are coming soon. The fonts are derived from open-licence Arabic fonts
          and renamed as their licences require.
        </p>
      </main>
    </div>
  );
}
