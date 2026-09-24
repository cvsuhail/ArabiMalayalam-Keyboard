import Dexie, { type Table } from "dexie";

export interface DocumentRecord {
  id: string;
  title: string;
  contentHtml: string;
  plainText: string;
  inputMode: "manglish" | "malayalam" | "english";
  createdAt: number;
  updatedAt: number;
}

export interface LearnedWordRecord {
  input: string;
  target: string;
  selectionCount: number;
  updatedAt: number;
}

export interface CustomWordRecord {
  id?: number;
  source: string;
  target: string;
  createdAt: number;
}

class ArabiTypeDb extends Dexie {
  documents!: Table<DocumentRecord, string>;
  learnedWords!: Table<LearnedWordRecord, string>;
  customWords!: Table<CustomWordRecord, number>;

  constructor() {
    super("arabitype");
    this.version(1).stores({
      documents: "id, updatedAt, title",
      learnedWords: "input, updatedAt",
      customWords: "++id, source",
    });
  }
}

let instance: ArabiTypeDb | null = null;

/** Lazily create the database; browser-only (IndexedDB is not on the server). */
export function getDb(): ArabiTypeDb {
  if (!instance) instance = new ArabiTypeDb();
  return instance;
}

/** Recover from corrupted local data by rebuilding the database. */
export async function resetDb(): Promise<void> {
  const db = getDb();
  await db.delete();
  instance = null;
  getDb();
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
