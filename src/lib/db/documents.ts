import { createId, getDb, type DocumentRecord } from "./db";
import { deriveTitle } from "./documentView";
export type { DocumentRecord } from "./db";
export {
  deriveTitle,
  displayName,
  groupDocuments,
  userTitle,
  type DocumentGroupLabel,
} from "./documentView";

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
