#!/usr/bin/env bash
# Downloads the SIL OFL source fonts the cvsuhail-* ARML fonts are derived from.
# Source: https://github.com/google/fonts (each family folder also holds its OFL.txt).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p sources/licenses

base="https://raw.githubusercontent.com/google/fonts/main/ofl"
fonts=(
  "amiri/Amiri-Regular.ttf"
  "notonaskharabic/NotoNaskhArabic[wght].ttf"
  "scheherazadenew/ScheherazadeNew-Regular.ttf"
  "lateef/Lateef-Regular.ttf"
  "arefruqaa/ArefRuqaa-Regular.ttf"
  "reemkufi/ReemKufi[wght].ttf"
  "harmattan/Harmattan-Regular.ttf"
  "notosansarabic/NotoSansArabic[wdth,wght].ttf"
)

for entry in "${fonts[@]}"; do
  family="${entry%%/*}"
  file="${entry#*/}"
  curl -fsSL --globoff "$base/$family/$file" -o "sources/$file"
  curl -fsSL "$base/$family/OFL.txt" -o "sources/licenses/$family-OFL.txt"
  echo "ok  $file"
done
