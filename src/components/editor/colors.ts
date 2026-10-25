/** 10 columns x 8 rows of text and highlight colours: greys first, then seven shades per hue. */
const HUES = [0, 28, 48, 100, 160, 190, 215, 245, 275, 320];
const SHADES: Array<[saturation: number, lightness: number]> = [
  [80, 88],
  [75, 76],
  [70, 64],
  [70, 50],
  [75, 40],
  [80, 30],
  [85, 20],
];

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const value = light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const GREYS = Array.from({ length: 10 }, (_, i) => hslToHex(0, 0, Math.round((i / 9) * 100)));

export const COLOR_COLUMNS = 10;
export const COLOR_SWATCHES: string[] = [
  ...GREYS,
  ...SHADES.flatMap(([saturation, lightness]) =>
    HUES.map((hue) => hslToHex(hue, saturation, lightness)),
  ),
];
