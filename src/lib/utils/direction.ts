const RTL_RE = /[\u0591-\u07FF\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_RE = /[A-Za-z\u0D00-\u0D7F]/;

export type TextDirection = "rtl" | "ltr" | "auto";

/**
 * Decide the writing direction for a block of text. Mixed content stays
 * "auto" so the browser's bidi algorithm handles it per paragraph.
 */
export function detectTextDirection(text: string): TextDirection {
  const hasRtl = RTL_RE.test(text);
  const hasLtr = LTR_RE.test(text);
  if (hasRtl && !hasLtr) return "rtl";
  if (hasLtr && !hasRtl) return "ltr";
  return "auto";
}
