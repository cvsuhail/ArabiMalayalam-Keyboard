import { Link, createFileRoute } from "@tanstack/react-router";
import { SeoArticleLayout } from "../components/SeoArticleLayout";

const SITE_URL = "https://arabi-malayalam.cvsuhail.online";
const canonicalUrl = `${SITE_URL}/about-arabi-malayalam`;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is Arabi-Malayalam? Script, Sounds and Online Keyboard",
  description:
    "Learn what Arabi-Malayalam is, how its adapted Arabic letters represent Malayalam sounds, and how to type it online.",
  mainEntityOfPage: canonicalUrl,
  author: { "@type": "Person", name: "CvSuhail", url: "https://www.cvsuhail.online/" },
  publisher: { "@type": "Organization", name: "ArabiMalayalam", url: `${SITE_URL}/` },
  inLanguage: ["en-IN", "ml-IN", "ar"],
};

export const Route = createFileRoute("/about-arabi-malayalam")({
  head: () => ({
    meta: [
      { title: "What Is Arabi-Malayalam? Script, Alphabet & Keyboard" },
      {
        name: "description",
        content:
          "Learn about Arabi-Malayalam, its special Arabic letters for Malayalam sounds, and use the free online Manglish and Malayalam keyboard.",
      },
      { property: "og:url", content: canonicalUrl },
      { property: "og:title", content: "What Is Arabi-Malayalam? Script, Alphabet & Keyboard" },
      {
        property: "og:description",
        content: "A concise guide to the Arabi-Malayalam writing system and its online keyboard.",
      },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(articleSchema) }],
  }),
  component: AboutArabiMalayalam,
});

function AboutArabiMalayalam() {
  return (
    <SeoArticleLayout
      eyebrow="Script guide"
      title="What is Arabi-Malayalam?"
      description="Arabi-Malayalam (അറബി-മലയാളം) writes the Malayalam language with an adapted Arabic script. It is closely associated with the Mappila literary tradition of Kerala's Malabar region."
    >
      <section>
        <h2>A script built for Malayalam sounds</h2>
        <p>
          Standard Arabic does not contain every sound used in Malayalam. Arabi-Malayalam therefore
          uses additional and modified letters to represent sounds such as <strong>ഞ (nja)</strong>,
          <strong> ങ (nga)</strong>, <strong>ഴ (zha)</strong>, <strong>ള (lla)</strong>, and the
          retroflex consonants used in Malayalam.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Malayalam</th>
                <th>Arabi-Malayalam</th>
                <th>Roman sound</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ഞ</td>
                <td lang="ar" dir="rtl">
                  ݧ
                </td>
                <td>nja</td>
              </tr>
              <tr>
                <td>ങ</td>
                <td lang="ar" dir="rtl">
                  ڞ
                </td>
                <td>nga</td>
              </tr>
              <tr>
                <td>ഴ</td>
                <td lang="ar" dir="rtl">
                  ژ
                </td>
                <td>zha</td>
              </tr>
              <tr>
                <td>ള</td>
                <td lang="ar" dir="rtl">
                  ڶ
                </td>
                <td>lla</td>
              </tr>
              <tr>
                <td>ണ</td>
                <td lang="ar" dir="rtl">
                  ڹ
                </td>
                <td>nna</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Type it with the ArabiMalayalam keyboard</h2>
        <p>
          The keyboard accepts conversational Manglish, Malayalam Unicode, and Arabic input. Words
          such as <code>njan</code>, <code>evide</code>, <code>eppo</code>, <code>engane</code>, and
          <code>povaam</code> receive contextual Arabi-Malayalam suggestions while you type.
        </p>
        <p>
          <Link to="/how-to-type-arabi-malayalam">Read the step-by-step typing guide</Link>, or open
          the editor and begin writing immediately.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="seo-primary-link">
          Open the free keyboard
        </Link>
        <Link to="/how-to-type-arabi-malayalam" className="seo-secondary-link">
          How to type Arabi-Malayalam
        </Link>
      </div>
    </SeoArticleLayout>
  );
}
