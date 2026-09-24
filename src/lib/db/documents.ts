import { createId, getDb, type DocumentRecord } from "./db";
export type { DocumentRecord } from "./db";

const UNTITLED = "Untitled document";

export function deriveTitle(plainText: string): string {
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (!cleaned) return UNTITLED;
  const words = cleaned.split(" ").slice(0, 5).join(" ");
  return words.length > 60 ? `${words.slice(0, 60)}…` : words;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return getDb().documents.orderBy("updatedAt").reverse().toArray();
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  return getDb().documents.get(id);
}

export async function createDocument(
  inputMode: DocumentRecord["inputMode"] = "manglish",
): Promise<DocumentRecord> {
  const now = Date.now();
  const doc: DocumentRecord = {
    id: createId(),
    title: "",
    contentHtml: "",
    plainText: "",
    inputMode,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().documents.put(doc);
  return doc;
}

export async function updateDocument(
  id: string,
  patch: Partial<Omit<DocumentRecord, "id" | "createdAt">>,
): Promise<void> {
  await getDb().documents.update(id, { ...patch, updatedAt: Date.now() });
}

export async function renameDocument(id: string, title: string): Promise<void> {
  await updateDocument(id, { title });
}

export async function deleteDocument(id: string): Promise<void> {
  await getDb().documents.delete(id);
}

export async function duplicateDocument(id: string): Promise<DocumentRecord | undefined> {
  const source = await getDocument(id);
  if (!source) return undefined;
  const now = Date.now();
  const copy: DocumentRecord = {
    ...source,
    id: createId(),
    title: `${source.title || deriveTitle(source.plainText)} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().documents.put(copy);
  return copy;
}

export async function clearAllDocuments(): Promise<void> {
  await getDb().documents.clear();
}

export function documentTitle(doc: DocumentRecord): string {
  return doc.title.trim() || deriveTitle(doc.plainText);
}

export type DocumentGroupLabel =
  | "Today"
  | "Yesterday"
  | "Previous 7 Days"
  | "Older";

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
