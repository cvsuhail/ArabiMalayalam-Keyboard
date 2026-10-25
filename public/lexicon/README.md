# Malayalam word-frequency list

`ml-words.txt` holds the 30,000 most frequent Malayalam words, one
`word<TAB>count` pair per line. ArabiMalayalam uses it to rank keyboard
suggestions and offer word completions.

- Source: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords),
  `content/2018/ml/ml_50k.txt`, derived from the OpenSubtitles 2018 corpus.
- Licence: [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  This derived list is shared under the same licence.
- Changes: legacy chillu spellings folded into atomic chillus, tokenizer
  fragments and non-Malayalam tokens removed, list truncated. See
  `scripts/build-lexicon.mjs` in the ArabiMalayalam repository.
