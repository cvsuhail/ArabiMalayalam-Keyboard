/** Available Font choices for Arabi-Malayalam and Malayalam preview */
export const FONT_FAMILIES = [
  {
    id: "default",
    name: "Default (Amiri)",
    font: "'Amiri', serif",
    googleQuery: "Amiri:wght@400;700",
  },
  {
    id: "noto-naskh",
    name: "Noto Naskh Arabic",
    font: "'Noto Naskh Arabic', serif",
    googleQuery: "Noto+Naskh+Arabic:wght@400;500;600;700",
  },
  {
    id: "scheherazade",
    name: "Scheherazade New",
    font: "'Scheherazade New', serif",
    googleQuery: "Scheherazade+New:wght@400;700",
  },
  {
    id: "lateef",
    name: "Lateef (Nastaliq)",
    font: "'Lateef', serif",
    googleQuery: "Lateef:wght@400;600;700",
  },
  {
    id: "aref-ruqaa",
    name: "Aref Ruqaa",
    // Has no ڿ ۼ ڊ ڗ ڹ ۻ ۺ ڔ; those letters come from Noto Naskh Arabic.
    font: "'Aref Ruqaa', 'Noto Naskh Arabic', serif",
    googleQuery: "Aref+Ruqaa:wght@400;700",
    fallbackId: "noto-naskh",
  },
  {
    id: "noto-sans-ar",
    name: "Noto Sans Arabic",
    font: "'Noto Sans Arabic', sans-serif",
    googleQuery: "Noto+Sans+Arabic:wght@400;500;600;700",
  },
  {
    id: "reem-kufi",
    name: "Reem Kufi",
    // Has no ڿ ۼ ڊ ڗ ڹ ۻ ۺ ڔ or the e/o marks; those come from Noto Naskh Arabic.
    font: "'Reem Kufi', 'Noto Naskh Arabic', sans-serif",
    googleQuery: "Reem+Kufi:wght@400;500;600;700",
    fallbackId: "noto-naskh",
  },
  {
    id: "harmattan",
    name: "Harmattan",
    font: "'Harmattan', sans-serif",
    googleQuery: "Harmattan:wght@400;700",
  },
  {
    id: "noto-malayalam",
    name: "Noto Sans Malayalam",
    font: "'Noto Sans Malayalam', sans-serif",
    googleQuery: "Noto+Sans+Malayalam:wght@400;500;600;700",
  },
  {
    id: "manjari",
    name: "Manjari",
    font: "'Manjari', sans-serif",
    googleQuery: "Manjari:wght@400;700",
  },
];

export type FontChoice = (typeof FONT_FAMILIES)[number];

export function loadFont(font: FontChoice): void {
  if (typeof document === "undefined") return;
  // A font missing Arabi-Malayalam letters names the font they fall back to.
  const fallback = FONT_FAMILIES.find((f) => f.id === font.fallbackId);
  if (fallback) loadFont(fallback);
  if (document.querySelector(`[data-app-font="${font.id}"]`)) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `https://fonts.googleapis.com/css2?family=${font.googleQuery}&display=swap`;
  stylesheet.dataset["appFont"] = font.id;
  document.head.append(stylesheet);
}
