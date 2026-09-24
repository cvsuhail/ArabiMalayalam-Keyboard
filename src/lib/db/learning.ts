import { getDb, type CustomWordRecord, type LearnedWordRecord } from "./db";

/** Local-only learning: remember which suggestion the user picks for a word. */
export async function recordSelection(input: string, target: string): Promise<void> {
  const key = input.toLowerCase();
  const db = getDb();
  const existing = await db.learnedWords.get(key);
  await db.learnedWords.put({
    input: key,
    target,
    selectionCount: existing && existing.target === target ? existing.selectionCount + 1 : 1,
    updatedAt: Date.now(),
  });
}

export async function listLearnedWords(): Promise<LearnedWordRecord[]> {
  return getDb().learnedWords.toArray();
}

export async function clearLearnedWords(): Promise<void> {
  await getDb().learnedWords.clear();
}

export async function addCustomWord(source: string, target: string): Promise<void> {
  await getDb().customWords.add({
    source: source.trim().toLowerCase(),
    target: target.trim(),
    createdAt: Date.now(),
  });
}

export async function listCustomWords(): Promise<CustomWordRecord[]> {
  return getDb().customWords.orderBy("source").toArray();
}

export async function deleteCustomWord(id: number): Promise<void> {
  await getDb().customWords.delete(id);
}
