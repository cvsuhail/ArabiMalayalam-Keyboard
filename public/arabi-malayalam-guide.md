# ArabiMalayalam Keyboard and Transliterator

ArabiMalayalam is a free browser-based keyboard for producing Arabi-Malayalam text from conversational Manglish, Malayalam Unicode, or Arabic input.

## What Arabi-Malayalam means

Arabi-Malayalam is an adapted Arabic script used to write Malayalam. Modified letters and vowel marks represent Malayalam sounds that do not exist in standard Arabic. Representative correspondences include ഞ → ݧ, ങ → ڞ, ഗ → ڰ, റ → ڔ, ള → ڶ, ണ → ڹ, and ഴ → ژ.

## Supported input

- Manglish examples: `njan`, `njangalkk`, `evide`, `eppo`, `engane`, `povaam`, and `sukhamano`.
- Malayalam Unicode words, sentences, and paragraphs.
- Arabic script that needs Arabi-Malayalam adaptation.
- Pasted paragraphs while preserving URLs, email addresses, punctuation, spaces, and line breaks.

The engine ranks candidates using curated overrides, registered corpus entries, previous selections, optional model results, Malayalam frequency and context, and a phonetic fallback. The final stage converts Malayalam candidates into Arabi-Malayalam with appropriate vowel marks and consonant behavior.

## Privacy and offline behavior

Documents and learned choices are saved locally in the browser. The core keyboard works offline after installation. A deployment may optionally configure a remote Malayalam transliteration provider for unknown words; the local rules remain available as fallback.

## Important limitations

Arabi-Malayalam spelling can vary by source, region, period, and editorial convention. Suggestions are typing assistance rather than an authoritative linguistic edition. Users should review text intended for publication or historical scholarship.

## Links

- [Open the keyboard](https://arabi-malayalam.cvsuhail.online/)
- [Read about Arabi-Malayalam](https://arabi-malayalam.cvsuhail.online/about-arabi-malayalam)
- [Follow the typing guide](https://arabi-malayalam.cvsuhail.online/how-to-type-arabi-malayalam)
- [View the source repository](https://github.com/CvSuhail/arabiMalayalamKeyboard)
