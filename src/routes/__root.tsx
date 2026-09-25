import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";

const SITE_URL = "https://arabi-malayalam.cvsuhail.online";
const SOCIAL_IMAGE_URL = `${SITE_URL}/og-image.png`;

function getGoogleTagManagerId(): string | undefined {
  const candidate = import.meta.env["VITE_GTM_ID"]?.trim();
  return candidate && /^GTM-[A-Z0-9]+$/i.test(candidate) ? candidate.toUpperCase() : undefined;
}

function GoogleTagManagerHead() {
  const containerId = getGoogleTagManagerId();
  if (!containerId) return null;

  const script = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function GoogleTagManagerNoScript() {
  const containerId = getGoogleTagManagerId();
  if (!containerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${SITE_URL}/#webapp`,
  name: "ArabiMalayalam",
  alternateName: [
    "Arabi Malayalam Keyboard",
    "Arabi-Malayalam Transliterator",
    "അറബി-മലയാളം കീബോർഡ്",
    "اَرَبِ مَلَیَالَمْ",
  ],
  url: `${SITE_URL}/`,
  image: SOCIAL_IMAGE_URL,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  softwareVersion: "1.0.0",
  description:
    "Intelligent, real-time Arabi-Malayalam transliterator and typing tool. Convert English (Manglish), Malayalam, and Arabic directly into authentic Arabi-Malayalam script with offline PWA support.",
  inLanguage: ["en", "ml", "ar"],
  author: {
    "@type": "Person",
    name: "CvSuhail",
    url: "https://www.cvsuhail.online/",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Real-time Manglish (English) to Arabi-Malayalam transliteration",
    "Direct Malayalam Unicode to Arabi-Malayalam script conversion",
    "Standard Arabic to Arabi-Malayalam script adaptation",
    "Full Arabi-Malayalam phonetic alphabet support (ݧ, ڞ, ڰ, ڔ, ڶ, ڹ, etc.)",
    "Short vowel diacritics support (e mark ٘ and o mark ٗ)",
    "PWA offline document editor with IndexedDB storage",
    "Speech-to-text Voice typing",
    "Multiple classical Arabic & Malayalam typography fonts",
  ],
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: "ArabiMalayalam",
  alternateName: "Arabi-Malayalam Keyboard",
  description:
    "A free online keyboard for converting Manglish, Malayalam, and Arabic into Arabi-Malayalam script.",
  inLanguage: ["en-IN", "ml-IN", "ar"],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#137333" },
      { name: "application-name", content: "ArabiMalayalam" },
      { name: "apple-mobile-web-app-title", content: "ArabiMalayalam" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Arabi-Malayalam Keyboard | Manglish, Malayalam & Arabic" },
      {
        name: "description",
        content:
          "Free Arabi-Malayalam keyboard. Type Manglish, Malayalam, or Arabic and get instant Arabi-Malayalam script suggestions, with offline PWA support.",
      },
      {
        name: "keywords",
        content:
          "arabi malayalam, arabi malayalam keyboard, arabi-malayalam transliteration, manglish to arabi malayalam, malayalam to arabi malayalam, arabic to arabi malayalam, mappila malayalam, arabi malayalam fonts, pwa keyboard, cvsuhail, അറബി മലയാളം, اَرَبِ مَلَیَالَمْ",
      },
      { name: "author", content: "CvSuhail" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        name: "googlebot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      {
        name: "bingbot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      { property: "og:site_name", content: "ArabiMalayalam" },
      { property: "og:title", content: "Arabi-Malayalam Keyboard | Manglish, Malayalam & Arabic" },
      {
        property: "og:description",
        content:
          "Instant intelligent Arabi-Malayalam keyboard and transliterator. Convert English (Manglish), Malayalam, and Arabic directly into authentic Arabi-Malayalam script.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ml_IN" },
      { property: "og:locale:alternate", content: "ar_SA" },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { property: "og:image:secure_url", content: SOCIAL_IMAGE_URL },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "ArabiMalayalam Keyboard & Editor" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@CvSuhail" },
      { name: "twitter:creator", content: "@CvSuhail" },
      { name: "twitter:title", content: "Arabi-Malayalam Keyboard | Manglish, Malayalam & Arabic" },
      {
        name: "twitter:description",
        content:
          "Easily convert Arabic, English, and Malayalam to Arabi-Malayalam script in real-time with offline PWA support.",
      },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
      { name: "twitter:image:alt", content: "ArabiMalayalam Keyboard & Editor" },
    ],
    links: [
      {
        rel: "alternate",
        type: "text/markdown",
        href: `${SITE_URL}/arabi-malayalam-guide.md`,
      },
      { rel: "describedby", href: `${SITE_URL}/llms.txt` },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { rel: "shortcut icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(webSiteSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(webAppSchema),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <GoogleTagManagerHead />
        <HeadContent />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.debug("SW registration info:", err);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors />
      <PwaInstallPrompt />
    </QueryClientProvider>
  );
}
