# Recon map: manglish.app (web)

Scope: the editor — layout, formatting toolbar, suggestion popup, document
sidebar, settings menu, copy/voice dock. Restyle target for the
ArabiMalayalam keyboard. Image insert and table insert are deliberately out.
For: ArabiMalayalam (arabi-malayalam.cvsuhail.online), the user's own product.
Keeps its own name, logo, dotted background and "Buy me a Kattan Chai" button.
Date: 2026-10-26

Method: public site, used as an anonymous visitor in the in-app browser at
human speed. No code, bundles or network calls read. The phone layout could not
be observed (Cloudflare re-challenged the mobile user agent); the existing
ArabiMalayalam phone layout (drawer + bottom dock) is kept.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site = the app | https://www.manglish.app/ | editor loads directly, no account |
| 2 | ⋮ menu → About | https://www.manglish.app/ | not opened (out of scope) |

## Core loop

Type Manglish, pick the right Malayalam word from a popup under the cursor,
format the document, copy it out (plain, styled, or FML for DTP software).

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Editor | `/` | write a document | sidebar, toolbar, paper, language toggle, voice + copy dock | empty (placeholder), filled |
| S02 | Suggestion popup | type a word | pick a transliteration | numbered list card, active row tint, typed text last | open, updating |
| S03 | Font menu | toolbar "Default ▾" | choose document font | scrolling list, names drawn in own font, check on selected | open |
| S04 | Alignment popover | toolbar align ▾ | set paragraph alignment | 4 icon buttons, active tinted | open |
| S05 | List popover | toolbar list ▾ | bullets / numbering | 2 icon buttons | open |
| S06 | Colour picker | toolbar A / marker | text colour, highlight | 10×8 swatch grid | open |
| S07 | Settings menu | toolbar ⋮ | preferences | 3 toggles (dark theme, word suggestions, language shortcut ⌘L), feedback, about | light, dark |
| S08 | Copy menu | dock Copy ▾ | copy formats | Copy as FML, Copy text only, Copy with styles | open |
| S09 | File row | sidebar hover | manage documents | rename (pencil), delete (trash) | hover, selected |

## Flows

```
F01 Write and copy a Malayalam paragraph
    S01 -> type -> S02 (Space/number picks) -> ... -> S08 Copy text only
    happy path clicks: 2 (focus editor, Copy) + typing
    edge: popup lags a keystroke behind; user wants the typed Latin word (last row)

F02 Format a document
    S01 -> select text -> B/I/U, S06 colour, S04 align, S05 list, size −/+
    happy path clicks: 2-3 per format
    edge: format with nothing selected applies to the next typed text

F03 Manage documents
    S01 sidebar -> + New File / pick a file / S09 rename or delete
    happy path clicks: 1
    edge: deleting the open file; empty title shows first words

F04 Switch input language
    S01 -> toggle മലയാളം | English (or ⌘L)
    happy path clicks: 1

F05 Change preferences
    S01 -> ⋮ -> S07 toggle dark theme / suggestions / shortcut
    happy path clicks: 2
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Icon button (toolbar) | plain, with ▾ caret | default, hover, active (green tint), disabled | S01 |
| Pill select | font family | closed, open | S01, S03 |
| Stepper | font size − n + | default, min/max | S01 |
| Popover | list, icon row, swatch grid, menu | open | S03-S08 |
| Toggle switch | on (green), off (grey) | default, focus | S07 |
| Suggestion card | numbered rows | active row, hover | S02 |
| Segmented toggle | language | selected (green tint) | S01 |
| Pill button | Voice Typing, Copy split button | default, hover, listening | S01 |
| Sidebar row | file | default, selected (green tint), hover (rename/delete) | S01, S09 |
| Outline button | "Tell us your feedback" | default, hover | S01 |

## Inferred data model

```
Document  id, title, content (rich HTML), plainText, updatedAt
          evidence: S01 sidebar list grouped by "Today", title from first words
          confidence: high (ArabiMalayalam already stores the same in IndexedDB)

Settings  theme (light | dark), showSuggestions, languageShortcut, inputLanguage,
          fontFamily, fontSize
          evidence: S07 toggles, S01 toggle and toolbar
          confidence: medium (stored per browser)
```

Relationships: Settings 1 per browser; Document n per browser.

## Feature matrix

See `features.csv`. Must: 16, should: 8, could: 2, skip: 3.

## Out of scope (cannot or should not be cloned)

- The Manglish name, logo, wording and Malayalam font list: ArabiMalayalam keeps
  its own brand and offers Arabic-script fonts.
- Image insert and table insert: not wanted.
- FML copy: replaced by the ArabiMalayalam equivalent, AML.
- Plain grey page background: ArabiMalayalam keeps its dotted background.

## Size

Screens 9, flows 5, entities 2. Hard parts: moving the editor from a plain
textarea to a rich-text editor while keeping the suggestion popup, phone
keyboard commits and caret handling; right-to-left Arabic inside the rich
editor; AML copy (needs the AML encoding). Size: M.
