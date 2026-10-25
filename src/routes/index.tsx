import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/react";
import type { Transaction } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Plus, Copy, Trash2, Check, X, Menu, MessageCircle } from "lucide-react";
import { DocumentSidebar } from "../components/editor/DocumentSidebar";
import { EditorDock } from "../components/editor/EditorDock";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { LanguageToggle } from "../components/editor/LanguageToggle";
import { SettingsMenu } from "../components/editor/SettingsMenu";
import { useEditorSettings } from "../lib/settings";
import { VOICE_LANGUAGES, useVoiceTyping, type VoiceLanguage } from "../lib/voice/useVoiceTyping";
import { FONT_FAMILIES, loadFont, type FontChoice } from "../components/editor/fonts";
import { toast } from "sonner";
import type { SmartCandidate } from "../lib/transliteration/smartManglishLayer";
import type { DocumentRecord } from "../lib/db/documents";
import { deriveTitle, userTitle } from "../lib/db/documentView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ property: "og:url", content: "https://arabi-malayalam.cvsuhail.online/" }],
    links: [{ rel: "canonical", href: "https://arabi-malayalam.cvsuhail.online/" }],
  }),
  component: ArabiMalayalamEditor,
});

let smartEnginePromise: Promise<typeof import("../lib/transliteration/smartManglishLayer")> | null =
  null;
let smartEngineConfigured = false;

async function loadSmartEngine() {
  smartEnginePromise ??= import("../lib/transliteration/smartManglishLayer");
  const engine = await smartEnginePromise;
  if (!smartEngineConfigured) {
    engine.loadUserPreferences();
    // The word list ranks suggestions; typing works (phonetically) until it arrives.
    void engine.loadLexicon();
    const endpoint = import.meta.env["VITE_MALAYALAM_TRANSLITERATION_ENDPOINT"];
    engine.setMalayalamProvider(endpoint ? engine.createHttpMalayalamProvider(endpoint) : null);
    smartEngineConfigured = true;
  }
  return engine;
}

/**
 * Suggestions per word: nine candidates plus the typed text. Many Manglish
 * spellings fit several words, so the list has room for the one the user meant.
 * Keys 1–9 and 0 pick them.
 */
const SUGGESTION_COUNT = 10;
const SHORTCUT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/** Typing one of these right after a word commits the word's top suggestion. */
const COMMIT_CHARACTER = /^[\s.,!?;:)\]}"”…،؟]$/u;
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿ]/u;

const loadDocumentStore = () => import("../lib/db/documents");

const EDITOR_PLACEHOLDER = "Type Manglish (njan, evide, engane), Malayalam, or Arabic…";
const ENGLISH_PLACEHOLDER = "Type in English…";
const EMPTY_DOCUMENT_HTML = "<p></p>";
const DEFAULT_FONT_SIZE = 26;
const WORD_BEFORE_CARET = /[\p{L}\p{M}0-9']+$/u;
/** Transaction meta marking edits the transliteration layer made itself. */
const ARABI_EDIT = "arabiEdit";

interface WordState {
  text: string;
  /** Document positions of the word the caret is at the end of. */
  start: number;
  end: number;
}
const NO_WORD: WordState = { text: "", start: 0, end: 0 };

interface SuggestionState {
  list: SmartCandidate[];
  /** The word `list` was computed for; it can lag behind fast typing. */
  word: string;
  active: number;
  pos: { top: number; left: number } | null;
}
const NO_SUGGESTIONS: SuggestionState = { list: [], word: "", active: 0, pos: null };

interface EditorHandlers {
  create: (editor: Editor) => void;
  update: (editor: Editor, transaction: Transaction) => void;
  selection: (editor: Editor, transaction: Transaction) => void;
  keyDown: (event: KeyboardEvent) => boolean;
  paste: (event: ClipboardEvent) => boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainTextToHtml(plainText: string): string {
  if (!plainText) return EMPTY_DOCUMENT_HTML;
  return plainText
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/** Stored rich HTML, or paragraphs rebuilt from text for documents saved as one raw <p>. */
function htmlForDocument(doc: DocumentRecord): string {
  if (!doc.contentHtml || doc.contentHtml === `<p>${doc.plainText}</p>`) {
    return plainTextToHtml(doc.plainText);
  }
  return doc.contentHtml;
}

/** Where the suggestion popup goes: under the word, relative to the paper card. */
function suggestionPosition(
  editor: Editor,
  paper: HTMLElement,
  wordStart: number,
): { top: number; left: number } {
  const caret = editor.view.coordsAtPos(wordStart);
  const paperRect = paper.getBoundingClientRect();
  // The popup is w-56 (224px); keep it inside the paper.
  const left = Math.max(16, Math.min(paperRect.width - 240, caret.left - paperRect.left));
  return { top: caret.bottom - paperRect.top + 6, left };
}

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img src="/favicon.png" alt="" className="size-8 shrink-0 rounded-lg object-contain" />
      <span className="truncate text-[15px] font-extrabold tracking-tight">ArabiMalayalam</span>
    </div>
  );
}

function ArabiMalayalamEditor() {
  const [currentDocId, setCurrentDocId] = useState<string>("");
  // Only a name the user typed; empty shows the document's first words instead.
  const [title, setTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [word, setWordState] = useState<WordState>(NO_WORD);
  const [sug, setSugState] = useState<SuggestionState>(NO_SUGGESTIONS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [settings, updateSettings] = useEditorSettings();
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+L");
  const isEnglish = settings.inputLanguage === "english";

  // Formatting state
  const [selectedFont, setSelectedFont] = useState<FontChoice>(FONT_FAMILIES[0]!);

  // Document list and auto-save
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpenedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchedRef = useRef(false);
  const previousMalayalamRef = useRef<string | undefined>(undefined);
  const editorRef = useRef<Editor | null>(null);
  const handlersRef = useRef<EditorHandlers | null>(null);
  const lastDocSizeRef = useRef(0);
  const focusOnReadyRef = useRef(false);
  // HTML the editor starts from; a new editor is built whenever the document changes.
  const initialContentRef = useRef<string>(EMPTY_DOCUMENT_HTML);

  // The editor's callbacks outlive a render, so they read the live word and
  // suggestions from refs that are written together with the state.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const wordRef = useRef<WordState>(word);
  const sugRef = useRef<SuggestionState>(sug);

  const updateWord = (next: WordState) => {
    wordRef.current = next;
    setWordState(next);
  };
  const updateSuggestions = (patch: Partial<SuggestionState>) => {
    sugRef.current = { ...sugRef.current, ...patch };
    setSugState(sugRef.current);
  };
  const clearWord = () => {
    if (wordRef.current.text) updateWord(NO_WORD);
    if (sugRef.current.list.length > 0 || sugRef.current.pos) updateSuggestions(NO_SUGGESTIONS);
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions: [
        StarterKit.configure({
          blockquote: false,
          code: false,
          codeBlock: false,
          heading: false,
          horizontalRule: false,
          link: false,
          strike: false,
        }),
        TextAlign.configure({ types: ["paragraph"] }),
        TextStyle,
        Color,
        FontSize,
        // Typing right after highlighted text should not extend the highlight.
        Highlight.extend({ inclusive: false }).configure({ multicolor: true }),
        Placeholder.configure({
          placeholder: () =>
            settingsRef.current.inputLanguage === "english"
              ? ENGLISH_PLACEHOLDER
              : EDITOR_PLACEHOLDER,
        }),
      ],
      content: initialContentRef.current,
      editorProps: {
        attributes: () => ({
          dir: settingsRef.current.inputLanguage === "english" ? "ltr" : "rtl",
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": "Arabi-Malayalam transliteration editor",
          spellcheck: "false",
        }),
        handleKeyDown: (_view, event) => handlersRef.current?.keyDown(event) ?? false,
        handlePaste: (_view, event) => handlersRef.current?.paste(event) ?? false,
      },
      onCreate: ({ editor: created }) => handlersRef.current?.create(created),
      onUpdate: ({ editor: updated, transaction }) =>
        handlersRef.current?.update(updated, transaction),
      onSelectionUpdate: ({ editor: moved, transaction }) =>
        handlersRef.current?.selection(moved, transaction),
    },
    [currentDocId],
  );
  editorRef.current = editor;

  // Warm up the transliteration engine and word list before the first keystroke.
  useEffect(() => {
    const warmUp = () => void loadSmartEngine();
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warmUp, { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = window.setTimeout(warmUp, 300);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      drawerWasOpenedRef.current = true;
      requestAnimationFrame(() => drawerCloseButtonRef.current?.focus());
    } else if (drawerWasOpenedRef.current) {
      drawerWasOpenedRef.current = false;
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, [isMobileMenuOpen]);

  // Open a stored document: the editor is rebuilt from it (which also resets undo history).
  const openDocument = (doc: DocumentRecord) => {
    initialContentRef.current = htmlForDocument(doc);
    previousMalayalamRef.current = undefined;
    clearWord();
    setTitle(userTitle(doc));
    setCurrentDocId(doc.id);
  };

  // Initialize from IndexedDB
  useEffect(() => {
    let mounted = true;
    async function loadDocs() {
      try {
        const { listDocuments, createDocument } = await loadDocumentStore();
        const docs = await listDocuments();
        if (!mounted) return;
        setDocuments(docs);
        if (docs.length > 0 && docs[0]) {
          openDocument(docs[0]);
        } else {
          const newDoc = await createDocument("manglish");
          if (!mounted) return;
          setDocuments([newDoc]);
          openDocument(newDoc);
        }
      } catch (e) {
        console.error("IndexedDB load error:", e);
      }
    }
    loadDocs();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus the editor once the one for a freshly created document exists.
  useEffect(() => {
    if (editor && focusOnReadyRef.current) {
      focusOnReadyRef.current = false;
      editor.commands.focus("end");
    }
  }, [editor]);

  // A language switch changes the writing direction and drops any half-typed word.
  useEffect(() => {
    clearWord();
    if (editor?.isInitialized) editor.view.dispatch(editor.state.tr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, settings.inputLanguage]);

  useEffect(() => {
    if (!settings.showSuggestions) updateSuggestions(NO_SUGGESTIONS);
  }, [settings.showSuggestions]);

  useEffect(() => {
    setShortcutLabel(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘L" : "Ctrl+L");
  }, []);

  // Cmd/Ctrl+L flips between Arabi-Malayalam and English.
  useEffect(() => {
    if (!settings.languageShortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "l")
        return;
      e.preventDefault();
      const next = settingsRef.current.inputLanguage === "english" ? "arabi" : "english";
      updateSettings({ inputLanguage: next });
      toast(next === "english" ? "English" : "Arabi-Malayalam");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settings.languageShortcut, updateSettings]);

  // Tell assistive tech which suggestion is highlighted.
  useEffect(() => {
    if (!editor?.isInitialized) return;
    const dom = editor.view.dom;
    if (sug.list.length > 0) {
      dom.setAttribute("aria-controls", "transliteration-suggestions");
      dom.setAttribute("aria-activedescendant", `transliteration-suggestion-${sug.active}`);
    } else {
      dom.removeAttribute("aria-controls");
      dom.removeAttribute("aria-activedescendant");
    }
  }, [editor, sug.list.length, sug.active]);

  // Debounced auto-save of the open document.
  const saveDocument = (ed: Editor, plain: string, titleOverride?: string) => {
    setIsSaved(false);
    const docId = currentDocId;
    const docTitle = titleOverride ?? title;
    const contentHtml = ed.getHTML();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!docId) return;
      try {
        const { updateDocument, listDocuments } = await loadDocumentStore();
        await updateDocument(docId, { plainText: plain, contentHtml, title: docTitle });
        setIsSaved(true);
        setDocuments(await listDocuments());
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 500);
  };

  // Generate transliteration candidates and position the popup under the word
  useEffect(() => {
    if (!word.text.trim() || !settings.showSuggestions || isEnglish) return;
    let cancelled = false;

    const refreshSuggestions = async () => {
      try {
        const { getSmartTransliterationCandidates } = await loadSmartEngine();
        const previousMalayalam = previousMalayalamRef.current;
        const candidates = await getSmartTransliterationCandidates(
          word.text,
          SUGGESTION_COUNT,
          previousMalayalam ? { previousMalayalam } : {},
        );
        if (cancelled) return;
        const ed = editorRef.current;
        const paper = paperRef.current;
        const pos = ed?.isInitialized && paper ? suggestionPosition(ed, paper, word.start) : null;
        updateSuggestions({ list: candidates, word: word.text, active: 0, pos });
      } catch (err) {
        if (!cancelled) console.error("Transliteration / caret calculation error:", err);
      }
    };

    void refreshSuggestions();
    return () => {
      cancelled = true;
    };
  }, [word.text, word.start, settings.showSuggestions, isEnglish]);

  // Keep the highlighted suggestion visible inside the scrollable list. Only the
  // list scrolls; scrollIntoView would also move the page on phones.
  const suggestionListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = suggestionListRef.current;
    const option = list?.querySelector<HTMLElement>(`#transliteration-suggestion-${sug.active}`);
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) {
      list.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [sug.active, sug.list]);

  const rememberChoice = (typedWord: string, suggestion: SmartCandidate) => {
    if (!suggestion.malayalam || suggestion.source === "typed") return;
    const malayalam = suggestion.malayalam;
    void loadSmartEngine().then(({ learnSelection }) => {
      learnSelection(typedWord, malayalam, suggestion.text);
    });
    previousMalayalamRef.current = malayalam;
  };

  // Insert chosen suggestion in place of the typed word
  const applySuggestion = (suggestion: SmartCandidate) => {
    const ed = editorRef.current;
    const typed = wordRef.current;
    if (!ed?.isInitialized || !typed.text) return;
    const tr = ed.state.tr
      .insertText(`${suggestion.text} `, typed.start, typed.end)
      .setMeta(ARABI_EDIT, true);
    ed.view.dispatch(tr);
    rememberChoice(typed.text, suggestion);
    ed.view.focus();
  };

  // Keyboard navigation for suggestions dropdown
  const handleEditorKeyDown = (e: KeyboardEvent): boolean => {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return false;
    if (!settingsRef.current.showSuggestions || settingsRef.current.inputLanguage === "english") {
      return false;
    }
    const { list, word: suggestedFor, active } = sugRef.current;
    if (list.length === 0) return false;
    // Suggestions may still belong to an earlier prefix of the word (e.g. "nja"
    // while "njan" is typed). Then committing keys fall through and the update
    // handler commits the current word with fresh candidates.
    const fresh = suggestedFor === wordRef.current.text;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      updateSuggestions({ active: (active + step + list.length) % list.length });
      return true;
    }
    if ((e.key === "Enter" || e.key === " ") && fresh) {
      const target = list[active] ?? list[0];
      if (!target) return false;
      e.preventDefault();
      applySuggestion(target);
      return true;
    }
    const shortcut = SHORTCUT_KEYS.indexOf(e.key);
    if (fresh && shortcut >= 0 && list[shortcut]) {
      e.preventDefault();
      applySuggestion(list[shortcut]!);
      return true;
    }
    if (e.key === "Escape") {
      updateSuggestions({ list: [], pos: null });
    }
    return false;
  };

  /**
   * Replace `typed` (still sitting at `start`, followed by the separator the
   * user just typed) with its best suggestion. Mobile keyboards don't report
   * Space or punctuation through keydown, so this runs from the update event.
   */
  const commitWordBeforeSeparator = async (typed: string, start: number) => {
    const s = sugRef.current;
    const ready = s.word === typed && s.list.length > 0;
    let choice = ready ? (s.list[s.active] ?? s.list[0]) : undefined;
    if (!choice) {
      const { getSmartTransliterationCandidates } = await loadSmartEngine();
      const previousMalayalam = previousMalayalamRef.current;
      [choice] = await getSmartTransliterationCandidates(
        typed,
        SUGGESTION_COUNT,
        previousMalayalam ? { previousMalayalam } : {},
      );
    }

    const ed = editorRef.current;
    if (!ed?.isInitialized || !choice || choice.text === typed) return;
    const end = start + typed.length;
    if (end > ed.state.doc.content.size || ed.state.doc.textBetween(start, end) !== typed) return; // edited meanwhile
    ed.view.dispatch(ed.state.tr.insertText(choice.text, start, end).setMeta(ARABI_EDIT, true));
    rememberChoice(typed, choice);
  };

  /** The Latin word being typed right before the caret, if any. */
  const analyseWord = (ed: Editor) => {
    const { selection } = ed.state;
    if (!selection.empty) return clearWord();
    const { $from } = selection;
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
    const match = before.match(WORD_BEFORE_CARET);
    if (!match) return clearWord();
    updateWord({ text: match[0], start: $from.pos - match[0].length, end: $from.pos });
  };

  const handleEditorUpdate = (ed: Editor, transaction: Transaction) => {
    const plain = ed.getText({ blockSeparator: "\n" });
    setText(plain);
    saveDocument(ed, plain);

    const size = ed.state.doc.content.size;
    const grewByOne = size - lastDocSizeRef.current === 1;
    lastDocSizeRef.current = size;

    // English types Latin letters as they are.
    if (settingsRef.current.inputLanguage === "english") {
      clearWord();
      return;
    }

    // A single separator typed straight after the active word commits it.
    const typed = wordRef.current;
    const { $from } = ed.state.selection;
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
    const separator = before.slice(-1);
    if (
      !transaction.getMeta(ARABI_EDIT) &&
      grewByOne &&
      ed.state.selection.empty &&
      typed.text &&
      COMMIT_CHARACTER.test(separator) &&
      $from.pos - 1 === typed.end &&
      before.endsWith(typed.text + separator) &&
      !ARABIC_SCRIPT.test(typed.text)
    ) {
      void commitWordBeforeSeparator(typed.text, typed.start);
    }

    analyseWord(ed);
  };

  // Moving the caret away from the word closes its suggestions.
  const handleEditorSelection = (ed: Editor, transaction: Transaction) => {
    touchedRef.current = true;
    if (transaction.docChanged) return;
    const typed = wordRef.current;
    if (typed.text && (!ed.state.selection.empty || ed.state.selection.from !== typed.end)) {
      clearWord();
    }
  };

  /** Insert plain text (blank lines become empty paragraphs) at `range`, else at the caret. */
  const insertPlainText = (ed: Editor, value: string, range?: { from: number; to: number }) => {
    const lines = value.split(/\r?\n/);
    const content: JSONContent[] =
      lines.length === 1
        ? [{ type: "text", text: value }]
        : lines.map((line) => ({
            type: "paragraph",
            ...(line ? { content: [{ type: "text", text: line }] } : {}),
          }));
    if (!value) return;
    const target = range ?? { from: ed.state.selection.from, to: ed.state.selection.to };
    ed.chain().focus().insertContentAt(target, content).run();
    clearWord();
  };

  // Convert pasted Malayalam or Manglish, including complete sentences and paragraphs.
  const handleEditorPaste = (e: ClipboardEvent): boolean => {
    const pastedText = e.clipboardData?.getData("text/plain");
    const ed = editorRef.current;
    if (!pastedText || !ed?.isInitialized) return false;
    e.preventDefault();

    const docBefore = ed.state.doc;
    const { from, to } = ed.state.selection;
    void (async () => {
      const { transliterateSmartPastedText } = await loadSmartEngine();
      const convertedText = await transliterateSmartPastedText(pastedText);
      if (ed.isDestroyed) return;
      // Keep the selection the user pasted over unless they edited meanwhile.
      insertPlainText(ed, convertedText, ed.state.doc === docBefore ? { from, to } : undefined);
    })();
    return true;
  };

  handlersRef.current = {
    create: (ed) => {
      lastDocSizeRef.current = ed.state.doc.content.size;
      setText(ed.getText({ blockSeparator: "\n" }));
    },
    update: handleEditorUpdate,
    selection: handleEditorSelection,
    keyDown: handleEditorKeyDown,
    paste: handleEditorPaste,
  };

  // Create New File
  const handleNewFile = async () => {
    const { createDocument, listDocuments } = await loadDocumentStore();
    const newDoc = await createDocument("manglish");
    focusOnReadyRef.current = true;
    openDocument(newDoc);
    setDocuments(await listDocuments());
    toast.success("Created new document");
  };

  // Select document from sidebar
  const handleSelectDoc = (doc: DocumentRecord) => {
    if (doc.id !== currentDocId) openDocument(doc);
  };

  // Prompt custom modal to delete document
  const requestDeleteDoc = (id: string, docTitle?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDocToDelete({ id, title: docTitle || "Untitled Document" });
  };

  // Perform confirmed document deletion
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const { deleteDocument, listDocuments } = await loadDocumentStore();
    const { id } = docToDelete;
    await deleteDocument(id);
    const remaining = await listDocuments();
    setDocuments(remaining);
    if (id === currentDocId) {
      if (remaining.length > 0 && remaining[0]) {
        handleSelectDoc(remaining[0]);
      } else {
        handleNewFile();
      }
    }
    toast.success("Document deleted");
    setDocToDelete(null);
  };

  // Send Feedback directly via WhatsApp to +919562770397
  const handleSendFeedback = () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      toast.error("Please enter your message before sending feedback.");
      return;
    }
    const message = `*Feedback from ArabiMalayalam App:*\n\n${trimmed}`;
    const url = `https://wa.me/919562770397?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setFeedbackText("");
    setShowFeedbackModal(false);
    toast.success("Opening WhatsApp to send your feedback...");
  };

  // Copy document text
  const handleCopy = async () => {
    if (!text.trim()) {
      toast.error("Nothing to copy!");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Copy with fonts, colours and alignment (pastes into Word, Docs and email)
  const handleCopyStyled = async () => {
    if (!editor?.isInitialized || !text.trim()) {
      toast.error("Nothing to copy!");
      return;
    }
    try {
      const html = `<div dir="rtl" style="font-family:${selectedFont.font};font-size:${DEFAULT_FONT_SIZE}px">${editor.getHTML()}</div>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      toast.success("Copied with styles!");
    } catch {
      toast.error("Could not copy with styles in this browser.");
    }
  };

  // Legacy code for software that cannot shape Arabic; it only reads right in an ARML font.
  const handleCopyArml = async () => {
    if (!text.trim()) {
      toast.error("Nothing to copy!");
      return;
    }
    const { toArmlDetailed } = await import("../lib/arml");
    const result = toArmlDetailed(text);
    await navigator.clipboard.writeText(result.text);
    toast.success("Copied as ARML", { description: "Paste it where an ARML font is applied." });
    if (result.latinLetters > 0) {
      toast.warning(
        `${result.latinLetters} Latin letters were kept as typed. Give them a Latin font.`,
      );
    }
    if (result.unmapped.length > 0) {
      toast.warning(`No ARML glyph for ${result.unmapped.join(" ")}; left out.`);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || deriveTitle(text) || "document").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded document");
  };

  const handleRename = async (id: string, name: string) => {
    const { renameDocument, listDocuments } = await loadDocumentStore();
    await renameDocument(id, name);
    if (id === currentDocId) setTitle(name);
    setDocuments(await listDocuments());
  };

  const sidebar = (onNavigate?: () => void) => (
    <DocumentSidebar
      documents={documents}
      currentDocId={currentDocId}
      onSelect={handleSelectDoc}
      onNew={handleNewFile}
      onRename={handleRename}
      onDelete={(id, name) => requestDeleteDoc(id, name)}
      onFeedback={() => setShowFeedbackModal(true)}
      {...(onNavigate ? { onNavigate } : {})}
    />
  );

  // Voice typing: finished phrases are inserted at the caret as they are heard.
  const handleVoicePhrase = async (transcript: string, language: VoiceLanguage) => {
    const ed = editorRef.current;
    if (!ed?.isInitialized) return;
    // Malayalam speech arrives in Malayalam script; convert it like pasted text.
    let phrase = transcript;
    if (language === "ml-IN") {
      const { transliterateSmartPastedText } = await loadSmartEngine();
      phrase = await transliterateSmartPastedText(transcript);
    }
    if (ed.isDestroyed) return;
    const { $from } = ed.state.selection;
    const previous = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 1),
      $from.parentOffset,
    );
    const gap = previous && !/\s/.test(previous) ? " " : "";
    insertPlainText(ed, `${gap}${phrase} `);
  };

  const voice = useVoiceTyping({
    language: settings.voiceLanguage,
    onFinal: handleVoicePhrase,
    onProblem: (message) => toast.error(message),
  });

  const toggleVoiceTyping = () => {
    const ed = editorRef.current;
    if (!voice.listening && ed?.isInitialized && !touchedRef.current) {
      // Nobody has placed the caret yet: dictate at the end, not the top.
      ed.commands.focus("end");
    }
    voice.toggle();
  };

  const wasListeningRef = useRef(false);
  useEffect(() => {
    if (voice.listening && !wasListeningRef.current) {
      const label = VOICE_LANGUAGES.find((l) => l.value === settings.voiceLanguage)?.label;
      toast.success(`Listening… speak in ${label}.`);
    }
    wasListeningRef.current = voice.listening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.listening]);

  // Dictation belongs to the file it was started in.
  useEffect(() => {
    voice.stop();
    touchedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocId]);

  return (
    <div className="flex h-dvh min-h-svh w-full overflow-hidden overscroll-none bg-background font-sans text-foreground antialiased">
      {/* MOBILE DRAWER BACKDROP */}
      {isMobileMenuOpen && (
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in duration-200"
          aria-label="Close document menu"
        />
      )}

      {/* MOBILE SLIDE-OVER DRAWER */}
      <aside
        aria-label="Documents"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        className={`no-print md:hidden fixed inset-y-0 left-0 z-50 flex w-72 max-w-[84vw] select-none flex-col bg-sidebar pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <BrandMark />
          <button
            ref={drawerCloseButtonRef}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{sidebar(() => setIsMobileMenuOpen(false))}</div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        aria-label="Documents"
        className="no-print hidden w-60 shrink-0 select-none flex-col border-r border-sidebar-border bg-sidebar md:flex"
      >
        <div className="p-4">
          <BrandMark />
        </div>
        <div className="min-h-0 flex-1">{sidebar()}</div>
      </aside>

      {/* MAIN CONTAINER */}
      <main
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
        id="keyboard-editor"
        aria-hidden={isMobileMenuOpen}
        inert={isMobileMenuOpen}
      >
        {/* TOP MOBILE APP BAR (Native App Header) */}
        <header className="no-print md:hidden flex min-h-14 items-center justify-between px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] bg-card/95 backdrop-blur-xl border-b border-border shrink-0 z-30 select-none shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(true)}
              className="-ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-muted text-foreground cursor-pointer active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" strokeWidth={2.25} />
            </button>
            <img
              src="/favicon.png"
              alt="ArabiMalayalam"
              className="w-7 h-7 object-contain rounded-lg shrink-0"
            />
            <div className="flex items-center min-w-0 pr-1">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (editor?.isInitialized) saveDocument(editor, text, e.target.value);
                }}
                className="text-sm font-extrabold text-foreground bg-transparent border-0 focus:outline-none focus:bg-muted rounded px-1 truncate max-w-[140px] xs:max-w-[200px]"
                placeholder="Untitled Document"
                aria-label="Document title"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleNewFile}
              className="min-h-11 px-3 rounded-xl bg-primary-soft text-primary hover:bg-accent transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-xs shadow-2xs active:scale-95"
              aria-label="Create new document"
            >
              <Plus className="w-4 h-4" strokeWidth={2.75} />
              <span>New</span>
            </button>
            <button
              onClick={handleCopy}
              className="min-h-11 min-w-11 rounded-xl hover:bg-muted text-foreground flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              aria-label="Copy document text"
            >
              <Copy className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* DOCUMENT WORKSPACE */}
        <div className="editor-workspace flex flex-1 flex-col items-center overflow-y-auto sm:px-4 sm:pb-4 md:px-6 md:pb-6">
          <div className="flex w-full max-w-[900px] flex-1 flex-col">
            <div className="no-print sticky top-0 z-20 px-2.5 max-md:border-b max-md:bg-card/95 max-md:backdrop-blur-md md:static md:px-0 md:pt-2">
              <EditorToolbar
                editor={editor}
                font={selectedFont}
                onFontChange={(f) => {
                  loadFont(f);
                  setSelectedFont(f);
                }}
                defaultFontSize={DEFAULT_FONT_SIZE}
                defaultAlignment={isEnglish ? "left" : "right"}
                onPrint={() => window.print()}
              >
                <span
                  role="status"
                  className="hidden items-center gap-1 whitespace-nowrap text-xs font-semibold text-muted-foreground md:flex"
                >
                  {isSaved ? (
                    <>
                      <Check className="size-3.5 text-primary" strokeWidth={2.75} /> Saved
                    </>
                  ) : (
                    "Saving…"
                  )}
                </span>
                <SettingsMenu
                  settings={settings}
                  onChange={updateSettings}
                  onFeedback={() => setShowFeedbackModal(true)}
                  shortcutLabel={shortcutLabel}
                />
              </EditorToolbar>
            </div>

            {/* Paper: edge-to-edge on a phone, a card with the dock along its bottom edge on desktop */}
            <div
              ref={paperRef}
              className="print-surface relative flex min-h-[calc(100dvh-8rem)] flex-1 flex-col rounded-none border-0 bg-paper p-4 pb-28 shadow-none sm:rounded-xl sm:border sm:border-border sm:p-8 sm:shadow-paper md:p-10 md:pb-6"
            >
              <div
                id="editor-surface"
                className="arabitype-editor flex flex-1 flex-col font-medium text-paper-foreground"
                style={{
                  fontFamily: selectedFont.font,
                  fontSize: `${DEFAULT_FONT_SIZE}px`,
                  lineHeight: "2.2",
                }}
                onFocus={() => loadFont(selectedFont)}
              >
                <EditorContent editor={editor} className="flex flex-1 flex-col" />
              </div>

              {/* FLOATING SUGGESTIONS POPUP (EXACTLY UNDER THE WORD BEING TYPED) */}
              {settings.showSuggestions && !isEnglish && sug.list.length > 0 && sug.pos && (
                <div
                  style={{
                    top: `${sug.pos.top}px`,
                    left: `${sug.pos.left}px`,
                  }}
                  ref={suggestionListRef}
                  id="transliteration-suggestions"
                  role="listbox"
                  aria-label="Transliteration suggestions"
                  // Keep focus in the editor so a tap doesn't close the phone keyboard.
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute z-50 w-56 max-w-[calc(100vw-36px)] max-h-[min(26rem,48vh)] overflow-y-auto overscroll-contain bg-popover border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-75 select-none"
                >
                  <div className="flex flex-col gap-0.5">
                    {sug.list.map((candidate, idx) => {
                      const isSelected = idx === sug.active;
                      const isTyped = candidate.source === "typed";
                      const hint =
                        !isTyped && candidate.malayalam !== candidate.text
                          ? candidate.malayalam
                          : undefined;
                      return (
                        <button
                          type="button"
                          key={`${idx}-${candidate.text}`}
                          id={`transliteration-suggestion-${idx}`}
                          onClick={() => applySuggestion(candidate)}
                          role="option"
                          aria-selected={isSelected}
                          title={isTyped ? "Keep exactly what you typed" : undefined}
                          className={`w-full px-3 py-1 flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                            isSelected
                              ? "bg-primary-soft text-primary font-bold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden w-full">
                            <span className="text-sm opacity-70 font-mono font-bold shrink-0">
                              {SHORTCUT_KEYS[idx] ?? ""}.
                            </span>
                            <span className="flex flex-col items-start min-w-0 leading-tight">
                              <span
                                className={`text-lg font-bold truncate max-w-full ${
                                  isTyped ? "opacity-75 font-mono text-base" : ""
                                }`}
                                style={{ fontFamily: isTyped ? "monospace" : selectedFont.font }}
                              >
                                {candidate.text}
                              </span>
                              {hint && (
                                <span
                                  lang="ml"
                                  className="text-xs font-normal text-muted-foreground truncate max-w-full"
                                >
                                  {hint}
                                </span>
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <EditorDock
                isListening={voice.listening}
                onToggleVoice={toggleVoiceTyping}
                voiceLanguage={settings.voiceLanguage}
                onVoiceLanguage={(voiceLanguage) => updateSettings({ voiceLanguage })}
                interimText={voice.interim}
                onCopyText={handleCopy}
                onCopyStyled={handleCopyStyled}
                onCopyArml={handleCopyArml}
                onDownload={handleDownload}
              >
                <LanguageToggle
                  value={settings.inputLanguage}
                  onChange={(inputLanguage) => updateSettings({ inputLanguage })}
                />
              </EditorDock>
            </div>
          </div>
        </div>
      </main>

      {/* FEEDBACK (SENDS VIA WHATSAPP TO +919562770397) */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tell us your feedback</DialogTitle>
            <DialogDescription>Opens a WhatsApp chat with us (+91 95627 70397).</DialogDescription>
          </DialogHeader>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            aria-label="Your feedback"
            placeholder="What can we improve in ArabiMalayalam? Write your thoughts, suggestions, or bug reports here..."
            rows={4}
            className="w-full resize-none rounded-lg border border-input bg-transparent p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendFeedback}>
              <MessageCircle className="size-4" /> Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={docToDelete !== null}
        onOpenChange={(open) => !open && setDocToDelete(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              “{docToDelete?.title}” will be removed from this browser. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="size-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
