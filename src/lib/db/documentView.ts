import type { DocumentRecord } from "./db";

/** Document titles and grouping: pure helpers, safe to import without loading IndexedDB. */

const NEW_FILE = "New File";
/** Names older versions stored for untitled documents. */
const LEGACY_TITLES = new Set(["Untitled", "Untitled Document", "Untitled document", "njan"]);

export function deriveTitle(plainText: string): string {
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const words = cleaned.split(" ").slice(0, 5).join(" ");
  return words.length > 60 ? `${words.slice(0, 60)}…` : words;
}

/** Only a name the user gave the document. */
export function userTitle(doc: Pick<DocumentRecord, "title">): string {
  const name = doc.title.trim();
  return LEGACY_TITLES.has(name) ? "" : name;
}

/** The name shown in the sidebar: the user's, else the first words, else "New File". */
export function displayName(doc: Pick<DocumentRecord, "title" | "plainText">): string {
  return userTitle(doc) || deriveTitle(doc.plainText) || NEW_FILE;
}

export type DocumentGroupLabel = "Today" | "Yesterday" | "Previous 7 Days" | "Older";

export function groupDocuments(
  docs: DocumentRecord[],
): Array<{ label: DocumentGroupLabel; docs: DocumentRecord[] }> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets: Record<DocumentGroupLabel, DocumentRecord[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  for (const doc of docs) {
    if (doc.updatedAt >= today) buckets.Today.push(doc);
    else if (doc.updatedAt >= yesterday) buckets.Yesterday.push(doc);
    else if (doc.updatedAt >= weekAgo) buckets["Previous 7 Days"].push(doc);
    else buckets.Older.push(doc);
  }

  return (Object.keys(buckets) as DocumentGroupLabel[])
    .map((label) => ({ label, docs: buckets[label] }))
    .filter((group) => group.docs.length > 0);
}
