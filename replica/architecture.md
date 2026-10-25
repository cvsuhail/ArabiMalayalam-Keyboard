# Architecture: ArabiMalayalam editor restyle + ARML fonts

Inputs: `recon.md`, `features.csv`, existing repo (TanStack Start, Vite, React 19,
Tailwind 4, shadcn/Radix, Dexie, TipTap 3 installed, builds to Cloudflare via nitro).
Date: 2026-10-26

## 1. Stack (keep what exists)

| layer | choice | why |
| --- | --- | --- |
| web app | TanStack Start + React (existing) | already deployed; no rewrite |
| styling | Tailwind 4 + shadcn/Radix, tokens from replica-design | already in repo; popovers/menus/switch exist |
| editor | TipTap 3 (StarterKit, Underline, TextStyle, Color, Highlight, TextAlign, Placeholder) | already installed; Image/Table/Link extensions stay unused |
| local data | Dexie (IndexedDB), existing `documents` table | files stay in the browser, as in the recon |
| suggestion engine | existing `smartManglishLayer` | reused, wired to TipTap through a ProseMirror plugin |
| backend (fonts only) | Cloudflare Workers routes in the same app + D1 + R2 | site already targets Cloudflare; one platform, near-zero cost |
| payments | Razorpay Checkout (UPI/cards, India) with the user's own keys; Stripe as swap | Kerala audience; webhooks verified server-side |
| email | Resend (receipt + download link) | optional, phase 3 |

No new database for the editor work. D1 exists only for the font shop.

## 2. Data

### Browser (Dexie) - editor, no migration needed
`documents` keeps `id, title, contentHtml, plainText, inputMode, createdAt, updatedAt`.
Add `settings` in localStorage: `theme, showSuggestions, langShortcut, inputLanguage,
fontId, fontSize`. TipTap stores rich HTML in `contentHtml` (already the field).

### Cloudflare D1 - font shop: see `schema.sql`
Tables: `fonts` (catalogue), `orders`, `licenses`, `webhook_events` (idempotency).
No user accounts: a purchase is identified by email + order id; the licence key is
emailed and also shown on the success page. Access rule: every download route checks
the licence row in the data layer (no RLS on D1).

## 3. ARML: is it doable? (decision record)

**Yes for the encoding and the copy button; partly for the fonts.**

- Arabi-Malayalam is Arabic script, so normal text is already Unicode. FML exists
  because DTP software cannot shape/reorder Malayalam. ARML plays the same role:
  a legacy, pre-shaped, visual-order code for software that cannot shape Arabic.
- **ARML spec (ours):** each ARML font has the same glyph order. Code points are
  1 byte per glyph in the 0x20-0xFF range (Windows-1252 positions), covering isolated,
  initial, medial and final forms of the Arabic letters + Malayalam-specific extras
  (ڛ ڻ ڽ ڔ etc.), diacritics and digits. Converter: `src/lib/arml/` =
  Unicode -> shape (Arabic presentation forms via a joining table) -> reorder to
  visual order -> map to ARML bytes. Pure TypeScript, unit-testable round trip
  (ARML -> Unicode for the subset that is unambiguous).
- **Copy rule:** copied ARML text only looks right in an ARML font. Copying is free;
  the font is what is paid for. That is exactly the model asked for.
- **Fonts (built, M5a):** `scripts/fonts/build.py` derives each cvsuhail-* font from an
  open-licence (SIL OFL) Arabic font: Amiri, Noto Naskh Arabic, Scheherazade New, Lateef,
  Aref Ruqaa, Reem Kufi, Harmattan, Noto Sans Arabic. Config: `scripts/fonts/fonts.json`
  (names are placeholders). Output: `public/fonts/arml/*.woff2`, previewed at `/fonts`.
  I cannot hand-draw calligraphy; the styles are the sources' styles under new names. Two
  sources lack some Arabi-Malayalam letters, so those glyphs are borrowed from Noto Naskh.
- **Licence correction (2026-10-26):** an earlier version of this document said OFL permits
  selling renamed derivatives. It does not: OFL 1.1 forbids selling the font software "by
  itself", original or modified. Derivatives may be given away, and sold only as part of a
  bundle with real added value, which is a grey area. Decision: **the shop is on hold.**
  The OFL-based fonts are free. Options for charging later: (a) a bundle (fonts plus
  converter licence, support, updates) after legal advice, (b) sell only fonts drawn
  originally by you or a designer, (c) charge for something else, such as a supporter pack.
  Whichever is chosen, OFL texts ship next to every derived font.
- **Try-out vs download:** the browser needs the font to preview it, so previews can always
  be saved. Free OFL fonts make that moot. If original paid fonts are added later, serve
  watermarked subset previews and the full file only after verified payment (M5b).

## 4. API (Cloudflare server routes, `src/routes/api/*`)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /api/fonts | catalogue | public | - | fonts[] (id, name, price, preview url) | F06 |
| GET /fonts/preview/:id.woff2 | watermarked preview font | public, cached | id | font | F06 |
| POST /api/orders | create Razorpay order | public, rate limited | fontId(s), email | orderId, key | F07 |
| POST /api/webhooks/razorpay | mark paid, create licence | Razorpay (HMAC verified) | event | 200 | F07 |
| GET /api/licence/:key | licence + owned fonts | holder of key | key | fonts[] | F07 |
| GET /api/download/:key/:fontId | 5 min signed R2 URL | holder of key | key, fontId | 302 | F07 |

Jobs: none needed. Webhooks are idempotent via `webhook_events.event_id` unique.
Editor routes need no API (all local).

## 5. Parts that bite

- **Caret + suggestion popup in TipTap:** the current textarea computes caret pixels by
  hand. In ProseMirror use `view.coordsAtPos`. Phone keyboards commit text via IME
  composition: handle `compositionend` and `beforeinput`, test on a real phone.
- **RTL in rich text:** TextAlign "left/right" must mean start/end; set `dir="auto"` per
  paragraph using existing `detectTextDirection`.
- **Copy formats:** text only = `getText()`; with styles = write `text/html` and
  `text/plain` to the clipboard; ARML = converter output, `text/plain`.
- **Webhooks arrive twice:** unique event id, orders updated in one transaction.
- **Prices:** integer paise plus currency column.
- **Service worker:** `sw.js` caches pages; bump its version on deploy so the new UI loads.
- **Fonts and CLS:** preload the selected font, `font-display: swap`.

## 6. Build order

1. **Vertical slice (M1):** TipTap editor on the paper card replacing the textarea,
   suggestion popup working, copy text only. Screens S01, S02. No backend.
2. **Editor must-haves (M2):** toolbar (undo/redo, font, size, B/I/U, colour, highlight,
   align, lists) S03-S06; sidebar rename/delete S09; dock with voice + copy menu S08.
3. **Should-haves (M3):** language toggle + Cmd/Ctrl+L, settings menu + dark theme S07,
   print, feedback, About, day grouping.
4. **ARML engine (M4):** `src/lib/arml/` converter + tests; "Copy as ARML" in S08;
   font menu entries for cvsuhail-* in preview mode.
5. **Font files (M5a, done) and shop (M5b, on hold):** build script `scripts/fonts/build.py`
   and the `/fonts` preview are done. D1 schema, R2 upload, Razorpay checkout, licence page
   and download route wait for a licensing decision and the user's Razorpay keys and
   Cloudflare D1/R2 bindings.
6. **Fixes** from replica-entrepreneur, if run.

## Riskiest parts
1. Moving to TipTap without regressing phone keyboard commits and the suggestion popup.
2. ARML spec and glyph tables: correct Arabic joining/reordering for Malayalam extras.
3. Real, good-looking cvsuhail-* fonts (needs a designer or OFL bases) and paid delivery.

Next step: `/replica-design`.
