import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { BuyMeACoffeeButton } from "../BuyMeACoffee";
import { displayName, groupDocuments, userTitle } from "../../lib/db/documentView";
import type { DocumentRecord } from "../../lib/db/db";
import { cn } from "../../lib/utils";

interface DocumentSidebarProps {
  documents: DocumentRecord[];
  currentDocId: string;
  onSelect: (doc: DocumentRecord) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onFeedback: () => void;
  /** Called after any choice that should close the phone drawer. */
  onNavigate?: () => void;
}

/** File list, brand links and support buttons; shared by the desktop column and the phone drawer. */
export function DocumentSidebar({
  documents,
  currentDocId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onFeedback,
  onNavigate,
}: DocumentSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const groups = groupDocuments(documents);

  useEffect(() => {
    if (renamingId) inputRef.current?.select();
  }, [renamingId]);

  const startRename = (doc: DocumentRecord) => {
    setDraft(userTitle(doc));
    setRenamingId(doc.id);
  };
  const finishRename = (save: boolean) => {
    if (save && renamingId) onRename(renamingId, draft.trim());
    setRenamingId(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            onNew();
            onNavigate?.();
          }}
          className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold text-primary hover:bg-primary-soft md:min-h-9"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          New File
        </button>

        {groups.length === 0 && <p className="px-3 text-sm text-muted-foreground">No files yet</p>}
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
            <h2 className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground">
              {group.label}
            </h2>
            {group.docs.map((doc) => {
              const active = doc.id === currentDocId;
              const name = displayName(doc);
              if (renamingId === doc.id) {
                return (
                  <input
                    key={doc.id}
                    ref={inputRef}
                    value={draft}
                    aria-label={`Rename ${name}`}
                    maxLength={80}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => finishRename(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishRename(true);
                      if (e.key === "Escape") finishRename(false);
                    }}
                    className="mx-1 h-9 rounded-lg border border-primary bg-card px-3 text-sm outline-none"
                  />
                );
              }
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "group flex items-center rounded-lg text-sm",
                    active ? "bg-primary-soft text-secondary-foreground" : "hover:bg-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(doc);
                      onNavigate?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    className="min-h-11 min-w-0 flex-1 cursor-pointer truncate px-3 text-left font-medium md:min-h-9"
                  >
                    {name}
                  </button>
                  <div className="flex pr-1 opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Rename ${name}`}
                      onClick={() => startRename(doc)}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground md:size-8"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${name}`}
                      onClick={() => onDelete(doc.id, name)}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-destructive md:size-8"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-sidebar-border p-3 text-center">
        <div className="flex flex-wrap justify-center gap-x-3">
          <Link
            to="/about-arabi-malayalam"
            onClick={onNavigate}
            className="rounded-md py-1 text-xs font-semibold text-primary hover:underline"
          >
            About &amp; typing guide
          </Link>
          <Link
            to="/alphabet"
            onClick={onNavigate}
            className="rounded-md py-1 text-xs font-semibold text-primary hover:underline"
          >
            Alphabet
          </Link>
        </div>
        <p className="text-[11px] leading-tight text-muted-foreground">
          Your files are stored only in this browser
        </p>
        <BuyMeACoffeeButton variant="sidebar" />
        <button
          type="button"
          onClick={() => {
            onFeedback();
            onNavigate?.();
          }}
          className="min-h-9 w-full cursor-pointer rounded-full border border-border bg-card px-3 text-[13px] font-medium hover:bg-muted"
        >
          Tell us your feedback
        </button>
        <p className="text-[11px] text-muted-foreground">
          Made with ❤️ by{" "}
          <a
            href="https://www.cvsuhail.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            CvSuhail
          </a>
        </p>
      </div>
    </div>
  );
}
