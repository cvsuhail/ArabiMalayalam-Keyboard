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
  name: "ArabiMalayalam",
  alternateName: [
    "Arabi Malayalam Keyboard",
    "Arabi-Malayalam Transliterator",
    "അറബി-മലയാളം കീബോർഡ്",
    "اَرَبِ مَلَیَالَمْ",
  ],
  url: "https://arabimalayalam.online/",
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Arabi-Malayalam (അറബി-മലയാളം)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Arabi-Malayalam is a historical writing system developed in the Malabar region of Kerala, India. It adapts the Arabic alphabet with modified characters (such as ݧ for ഞ, ڞ for ങ, ڰ for ഗ, ڔ for റ, ڶ for ള, ڹ for ണ) to accurately represent all Malayalam phonetic sounds.",
      },
    },
    {
      "@type": "Question",
      name: "How does the ArabiMalayalam keyboard transliteration work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply type in English (Manglish like 'njan', 'sukhamanu', 'keralam'), Malayalam script ('ഞാൻ', 'കേരളം'), or Arabic. The intelligent transliterator provides real-time Arabi-Malayalam suggestions beneath your active cursor.",
      },
    },
    {
      "@type": "Question",
      name: "Can I install ArabiMalayalam as an app on my phone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, ArabiMalayalam is a full Progressive Web App (PWA). You can install it on iOS Safari (Share > Add to Home Screen) or Android Chrome with offline support.",
      },
    },
    {
      "@type": "Question",
      name: "Does ArabiMalayalam require an internet connection?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No! Once loaded, ArabiMalayalam runs completely in your device browser. Transliteration and document auto-saving in IndexedDB work 100% offline.",
      },
    },
  ],
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
      { title: "ArabiMalayalam | Arabic, English & Malayalam to Arabi-Malayalam" },
      {
        name: "description",
        content:
          "Instant intelligent Arabi-Malayalam keyboard and transliterator. Convert English (Manglish), Malayalam, and Arabic directly into authentic Arabi-Malayalam script with offline PWA support.",
      },
      {
        name: "keywords",
        content:
          "arabi malayalam, arabi malayalam keyboard, arabi-malayalam transliteration, manglish to arabi malayalam, malayalam to arabi malayalam, arabic to arabi malayalam, mappila malayalam, arabi malayalam fonts, pwa keyboard, cvsuhail, അറബി മലയാളം, اَرَبِ مَلَیَالَمْ",
      },
      { name: "author", content: "CvSuhail" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "bingbot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:site_name", content: "ArabiMalayalam" },
      { property: "og:url", content: "https://arabimalayalam.online/" },
      { property: "og:title", content: "ArabiMalayalam - Arabic, English & Malayalam to Arabi-Malayalam" },
      {
        property: "og:description",
        content:
          "Instant intelligent Arabi-Malayalam keyboard and transliterator. Convert English (Manglish), Malayalam, and Arabic directly into authentic Arabi-Malayalam script.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ml_IN" },
      { property: "og:locale:alternate", content: "ar_SA" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "ArabiMalayalam Keyboard & Editor" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@CvSuhail" },
      { name: "twitter:creator", content: "@CvSuhail" },
      { name: "twitter:title", content: "ArabiMalayalam | Arabic, English & Malayalam to Arabi-Malayalam" },
      {
        name: "twitter:description",
        content:
          "Easily convert Arabic, English, and Malayalam to Arabi-Malayalam script in real-time with offline PWA support.",
      },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://arabimalayalam.online/" },
      { rel: "alternate", href: "https://arabimalayalam.online/", hrefLang: "x-default" },
      { rel: "alternate", href: "https://arabimalayalam.online/", hrefLang: "en" },
      { rel: "alternate", href: "https://arabimalayalam.online/", hrefLang: "ml" },
      { rel: "alternate", href: "https://arabimalayalam.online/", hrefLang: "ar" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Aref+Ruqaa:wght@400;700&family=Harmattan:wght@400;700&family=Inter:wght@400;500;600;700&family=Lateef:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Reem+Kufi:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap",
      },
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
        children: JSON.stringify(webAppSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqSchema),
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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
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
