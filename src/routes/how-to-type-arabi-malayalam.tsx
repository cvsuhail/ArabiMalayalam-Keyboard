import { Link, createFileRoute } from "@tanstack/react-router";
import { SeoArticleLayout } from "../components/SeoArticleLayout";

const SITE_URL = "https://arabi-malayalam.cvsuhail.online";
const canonicalUrl = `${SITE_URL}/how-to-type-arabi-malayalam`;

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to type Arabi-Malayalam online",
  description: "Use Manglish or Malayalam text to create Arabi-Malayalam writing online.",
  totalTime: "PT1M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Open the keyboard",
      text: "Open the free ArabiMalayalam keyboard in a modern browser.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Type or paste",
      text: "Type Manglish or Malayalam, or paste a complete word, sentence, or paragraph.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Choose a suggestion",
      text: "Choose the appropriate Arabi-Malayalam suggestion using touch, Enter, Space, or a number key.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Copy or download",
      text: "Copy the converted text or download the document for later use.",
    },
  ],
};

export const Route = createFileRoute("/how-to-type-arabi-malayalam")({
  head: () => ({
    meta: [
      { title: "How to Type Arabi-Malayalam Online | Free Keyboard" },
      {
        name: "description",
        content:
          "Type Manglish or Malayalam and convert it to Arabi-Malayalam online. Includes examples for njan, evide, eppo, engane and complete paragraphs.",
      },
      { property: "og:url", content: canonicalUrl },
      { property: "og:title", content: "How to Type Arabi-Malayalam Online" },
      {
        property: "og:description",
        content:
          "A practical guide to typing Manglish and Malayalam with the free ArabiMalayalam keyboard.",
      },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(howToSchema) }],
  }),
  component: HowToTypeArabiMalayalam,
});

function HowToTypeArabiMalayalam() {
  return (
    <SeoArticleLayout
      eyebrow="Typing guide"
      title="How to type Arabi-Malayalam online"
      description="Use the free keyboard with Manglish, Malayalam Unicode, or Arabic. Conversion happens as you type, and pasted sentences and paragraphs are handled automatically."
    >
      <ol className="seo-steps">
        <li>
          <strong>Open the keyboard.</strong> It works on phones, tablets, and desktop browsers.
        </li>
        <li>
          <strong>Type or paste text.</strong> Try Manglish such as <code>njan evide povam</code> or
          paste Malayalam directly.
        </li>
        <li>
          <strong>Select the best suggestion.</strong> Tap a candidate, press Enter or Space, or use
          number keys 1–6.
        </li>
        <li>
          <strong>Copy or download.</strong> Your documents stay in the browser and remain available
          offline after installation.
        </li>
      </ol>

      <section>
        <h2>Common Manglish examples</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Malayalam interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>njan</code>
                </td>
                <td>ഞാൻ</td>
              </tr>
              <tr>
                <td>
                  <code>evide</code>
                </td>
                <td>എവിടെ</td>
              </tr>
              <tr>
                <td>
                  <code>eppo</code>
                </td>
                <td>എപ്പോ</td>
              </tr>
              <tr>
                <td>
                  <code>engane</code>
                </td>
                <td>എങ്ങനെ</td>
              </tr>
              <tr>
                <td>
                  <code>povaam</code>
                </td>
                <td>പോവാം</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Does paragraph paste work?</h2>
        <p>
          Yes. Paste a complete Manglish or Malayalam sentence or paragraph into the editor. URLs,
          email addresses, punctuation, and line breaks are preserved while translatable words are
          converted.
        </p>
      </section>

      <section>
        <h2>Can it be installed like a mobile app?</h2>
        <p>
          Yes. Install the Progressive Web App from Safari or Chrome for a full-screen experience,
          offline support, and local document storage.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="seo-primary-link">
          Start typing
        </Link>
        <Link to="/about-arabi-malayalam" className="seo-secondary-link">
          Learn about the script
        </Link>
      </div>
    </SeoArticleLayout>
  );
}
