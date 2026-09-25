import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Copy,
  Mic,
  MicOff,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Check,
  AlignCenter,
  Bold,
  Italic,
  Underline,
  X,
  Menu,
  MessageCircle,
} from "lucide-react";
import { BuyMeACoffeeButton, BuyMeACoffeeIcon } from "../components/BuyMeACoffee";
import { toast } from "sonner";
import type { SmartCandidate } from "../lib/transliteration/smartManglishLayer";
import type { DocumentRecord } from "../lib/db/documents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ property: "og:url", content: "https://arabi-malayalam.cvsuhail.online/" }],
    links: [{ rel: "canonical", href: "https://arabi-malayalam.cvsuhail.online/" }],
  }),
  component: ArabiMalayalamEditor,
});

/** Available Font choices for Arabi-Malayalam and Malayalam preview */
const FONT_FAMILIES = [
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
    font: "'Aref Ruqaa', serif",
    googleQuery: "Aref+Ruqaa:wght@400;700",
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
    font: "'Reem Kufi', sans-serif",
    googleQuery: "Reem+Kufi:wght@400;500;600;700",
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

type FontChoice = (typeof FONT_FAMILIES)[number];

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void | Promise<void>) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

let smartEnginePromise: Promise<typeof import("../lib/transliteration/smartManglishLayer")> | null =
  null;
let smartEngineConfigured = false;

async function loadSmartEngine() {
  smartEnginePromise ??= import("../lib/transliteration/smartManglishLayer");
  const engine = await smartEnginePromise;
  if (!smartEngineConfigured) {
    engine.loadUserPreferences();
    const endpoint = import.meta.env["VITE_MALAYALAM_TRANSLITERATION_ENDPOINT"];
    engine.setMalayalamProvider(endpoint ? engine.createHttpMalayalamProvider(endpoint) : null);
    smartEngineConfigured = true;
  }
  return engine;
}

const loadDocumentStore = () => import("../lib/db/documents");

function deriveTitle(plainText: string): string {
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled document";
  const words = cleaned.split(" ").slice(0, 5).join(" ");
  return words.length > 60 ? `${words.slice(0, 60)}…` : words;
}

function loadFont(font: FontChoice): void {
  if (typeof document === "undefined" || document.querySelector(`[data-app-font="${font.id}"]`)) {
    return;
  }
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `https://fonts.googleapis.com/css2?family=${font.googleQuery}&display=swap`;
  stylesheet.dataset["appFont"] = font.id;
  document.head.append(stylesheet);
}

function appendHistory(previous: string[], next: string): string[] {
  if (previous.at(-1) === next) return previous;
  return [...previous.slice(-59), next];
}

/** Precise Caret Offset Calculator for Textarea */
function calculateCaretOffset(
  element: HTMLTextAreaElement,
  position: number,
  direction: "rtl" | "ltr" = "ltr",
  textAlign: "left" | "center" | "right" = "left",
): { top: number; left: number; height: number } {
  const div = document.createElement("div");
  const style = window.getComputedStyle(element);

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.top = "0";
  div.style.left = "-9999px";
  div.style.width = `${element.clientWidth}px`;
  div.style.fontFamily = style.fontFamily;
  div.style.fontSize = style.fontSize;
  div.style.lineHeight = style.lineHeight;
  div.style.padding = style.padding;
  div.style.border = style.border;
  div.style.boxSizing = style.boxSizing;
  div.style.direction = direction;
  div.style.textAlign = textAlign;

  const textBefore = element.value.substring(0, position);
  div.textContent = textBefore;

  const span = document.createElement("span");
  span.textContent = element.value.substring(position, position + 1) || "|";
  div.appendChild(span);

  document.body.appendChild(div);
  const left = span.offsetLeft;
  const top = span.offsetTop;
  const height = span.offsetHeight || parseInt(style.fontSize, 10) * 1.5;
  document.body.removeChild(div);

  return { top, left, height };
}

function ArabiMalayalamEditor() {
  const [currentDocId, setCurrentDocId] = useState<string>("");
  const [title, setTitle] = useState<string>("Untitled Document");
  const [text, setText] = useState<string>("");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [wordRange, setWordRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [suggestions, setSuggestions] = useState<SmartCandidate[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Formatting state: RTL by default for Arabi-Malayalam, LTR for Manglish
  const [selectedFont, setSelectedFont] = useState<FontChoice>(FONT_FAMILIES[0]!);
  const [fontSize, setFontSize] = useState<number>(26);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("right");

  // Document list and auto-save
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showBottomMore, setShowBottomMore] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [showFontDropdown, setShowFontDropdown] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

  // Undo / Redo history stack
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpenedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const previousMalayalamRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isMobileMenuOpen) {
      drawerWasOpenedRef.current = true;
      requestAnimationFrame(() => drawerCloseButtonRef.current?.focus());
    } else if (drawerWasOpenedRef.current) {
      drawerWasOpenedRef.current = false;
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, [isMobileMenuOpen]);

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
          const first = docs[0];
          setCurrentDocId(first.id);
          setTitle(first.title || "Untitled Document");
          setText(first.plainText || "");
          setHistoryStack([first.plainText || ""]);
        } else {
          const newDoc = await createDocument("manglish");
          if (!mounted) return;
          setCurrentDocId(newDoc.id);
          setTitle("njan");
          setText("");
          setDocuments([newDoc]);
          setHistoryStack([""]);
        }
      } catch (e) {
        console.error("IndexedDB load error:", e);
      }
    }
    loadDocs();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced auto-save
  const triggerAutoSave = (newText: string, newTitle: string) => {
    setIsSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentDocId) return;
      try {
        const { updateDocument, listDocuments } = await loadDocumentStore();
        await updateDocument(currentDocId, {
          plainText: newText,
          contentHtml: `<p>${newText}</p>`,
          title: newTitle || deriveTitle(newText) || "Untitled Document",
        });
        setIsSaved(true);
        const docs = await listDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 500);
  };

  // Generate transliteration candidates and position dropdown directly under the word
  useEffect(() => {
    let cancelled = false;

    if (!currentWord.trim()) {
      setSuggestions([]);
      setSuggestionPos(null);
      return () => {
        cancelled = true;
      };
    }

    const updateSuggestions = async () => {
      try {
        const { getSmartTransliterationCandidates } = await loadSmartEngine();
        const previousMalayalam = previousMalayalamRef.current;
        const candidates = await getSmartTransliterationCandidates(
          currentWord,
          6,
          previousMalayalam ? { previousMalayalam } : {},
        );
        if (cancelled) return;
        setSuggestions(candidates);
        setActiveSuggestionIdx(0);

        // Compute pixel coordinates relative to the white paper canvas
        if (textareaRef.current && paperRef.current) {
          const isRtl = textAlign === "right";
          const coords = calculateCaretOffset(
            textareaRef.current,
            wordRange.start,
            isRtl ? "rtl" : "ltr",
            textAlign,
          );
          const paperRect = paperRef.current.getBoundingClientRect();
          const textareaRect = textareaRef.current.getBoundingClientRect();

          // Position dropdown directly under the active word
          const relTop = textareaRect.top - paperRect.top + coords.top + coords.height + 6;
          let relLeft = textareaRect.left - paperRect.left + coords.left;

          if (isRtl) {
            // In RTL mode, align the dropdown to sit nicely beneath the right-aligned word
            relLeft = relLeft - 180;
          }

          // Ensure dropdown doesn't overflow the paper boundary
          const minLeft = 16;
          const maxLeft = Math.max(16, paperRect.width - 210);
          relLeft = Math.max(minLeft, Math.min(maxLeft, relLeft));

          setSuggestionPos({ top: relTop, left: relLeft });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Transliteration / caret calculation error:", err);
        }
      }
    };

    void updateSuggestions();
    return () => {
      cancelled = true;
    };
  }, [currentWord, wordRange.start, textAlign]);

  // Insert chosen suggestion into text
  const applySuggestion = (suggestion: SmartCandidate) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const before = text.slice(0, wordRange.start);
    const after = text.slice(wordRange.end);
    const replacement = suggestion.text + " ";
    const updated = before + replacement + after;
    const newPos = wordRange.start + replacement.length;

    setHistoryStack((prev) => appendHistory(prev, updated));
    setRedoStack([]);

    if (suggestion.malayalam) {
      void loadSmartEngine().then(({ learnSelection }) => {
        learnSelection(currentWord, suggestion.malayalam!);
      });
      previousMalayalamRef.current = suggestion.malayalam;
    }

    setText(updated);
    setCurrentWord("");
    setSuggestions([]);
    setSuggestionPos(null);
    triggerAutoSave(updated, title);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Keyboard navigation for suggestions dropdown
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const target = suggestions[activeSuggestionIdx];
        if (target) applySuggestion(target);
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        const target = suggestions[activeSuggestionIdx] || suggestions[0];
        if (target) applySuggestion(target);
        return;
      }
      if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
        const num = parseInt(e.key, 10) - 1;
        if (suggestions[num]) {
          e.preventDefault();
          applySuggestion(suggestions[num]!);
          return;
        }
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setSuggestionPos(null);
        return;
      }
    }

    // If a remote/corpus lookup is still pending, Space should still commit
    // the best available transliteration instead of leaving Roman text behind.
    if (e.key === " " && currentWord.trim()) {
      e.preventDefault();
      const { getSmartTransliterationCandidates } = await loadSmartEngine();
      const requestedWord = currentWord;
      const previousMalayalam = previousMalayalamRef.current;
      const candidates = await getSmartTransliterationCandidates(
        requestedWord,
        6,
        previousMalayalam ? { previousMalayalam } : {},
      );
      const activeText = textareaRef.current?.value.slice(wordRange.start, wordRange.end);
      if (activeText === requestedWord) {
        const target = candidates[0];
        if (target) applySuggestion(target);
      }
    }
  };

  // Handle typing & isolate active word before caret
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;

    setHistoryStack((prev) => appendHistory(prev, val));
    setRedoStack([]);

    setText(val);
    triggerAutoSave(val, title);

    const leftText = val.slice(0, pos);
    const match = leftText.match(/[\p{L}\p{M}0-9']+$/u);
    if (match) {
      const start = pos - match[0].length;
      setCurrentWord(match[0]);
      setWordRange({ start, end: pos });
    } else {
      setCurrentWord("");
      setSuggestions([]);
      setSuggestionPos(null);
    }
  };

  // Convert pasted Malayalam or Manglish, including complete sentences and paragraphs.
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text/plain");
    if (!pastedText) return;

    e.preventDefault();

    const el = e.currentTarget;
    const valueBeforeConversion = el.value;
    const initialSelectionStart = el.selectionStart;
    const initialSelectionEnd = el.selectionEnd;
    const { transliterateSmartPastedText } = await loadSmartEngine();
    const convertedText = await transliterateSmartPastedText(pastedText);
    const valueUnchanged = el.value === valueBeforeConversion;
    const selectionStart = valueUnchanged ? initialSelectionStart : el.selectionStart;
    const selectionEnd = valueUnchanged ? initialSelectionEnd : el.selectionEnd;
    const currentValue = el.value;
    const updated =
      currentValue.slice(0, selectionStart) + convertedText + currentValue.slice(selectionEnd);
    const newCaretPosition = selectionStart + convertedText.length;

    setHistoryStack((prev) => appendHistory(prev, updated));
    setRedoStack([]);
    setText(updated);
    setCurrentWord("");
    setSuggestions([]);
    setSuggestionPos(null);
    triggerAutoSave(updated, title);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCaretPosition, newCaretPosition);
    });
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyStack.length > 1) {
      const current = historyStack[historyStack.length - 1];
      const previous = historyStack[historyStack.length - 2];
      if (current !== undefined && previous !== undefined) {
        setRedoStack((prev) => [...prev, current]);
        setHistoryStack((prev) => prev.slice(0, -1));
        setText(previous);
        triggerAutoSave(previous, title);
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      if (next !== undefined) {
        setRedoStack((prev) => prev.slice(0, -1));
        setHistoryStack((prev) => appendHistory(prev, next));
        setText(next);
        triggerAutoSave(next, title);
      }
    }
  };

  // Create New File
  const handleNewFile = async () => {
    const { createDocument, listDocuments } = await loadDocumentStore();
    const newDoc = await createDocument("manglish");
    setCurrentDocId(newDoc.id);
    setTitle("Untitled");
    setText("");
    setHistoryStack([""]);
    setRedoStack([]);
    previousMalayalamRef.current = undefined;
    const docs = await listDocuments();
    setDocuments(docs);
    toast.success("Created new document");
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Select document from sidebar
  const handleSelectDoc = (doc: DocumentRecord) => {
    setCurrentDocId(doc.id);
    setTitle(doc.title || "Untitled Document");
    setText(doc.plainText || "");
    setHistoryStack([doc.plainText || ""]);
    setRedoStack([]);
    previousMalayalamRef.current = undefined;
    setSuggestions([]);
    setSuggestionPos(null);
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
    if (!text) {
      toast.error("Nothing to copy!");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Voice Typing
  const toggleVoiceTyping = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice typing is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Voice typing stopped.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ml-IN";

      recognition.onresult = async (event: SpeechRecognitionEventLike) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result?.isFinal) {
            transcript += result[0].transcript + " ";
          }
        }
        if (transcript) {
          const { convertMalayalamToArabiMalayalam, transliterateToArabic } =
            await import("../lib/transliteration/enhancedTransliterator");
          const converted =
            convertMalayalamToArabiMalayalam(transcript)[0] || transliterateToArabic(transcript);
          const updated = (text ? text + " " : "") + converted;
          setText(updated);
          triggerAutoSave(updated, title);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      toast.success("Listening... speak now in Malayalam or English.");
    } catch (e) {
      console.error(e);
      toast.error("Could not start microphone.");
    }
  };

  return (
    <div className="flex h-dvh min-h-svh w-full overflow-hidden overscroll-none bg-[#fafafa] dark:bg-[#121212] text-[#202124] dark:text-[#e8eaed] font-sans antialiased">
      {/* MOBILE DRAWER BACKDROP */}
      {isMobileMenuOpen && (
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in duration-200"
          aria-label="Close document menu"
        />
      )}

      {/* MOBILE SLIDE-OVER DRAWER (Native App Navigation) */}
      <aside
        aria-label="Documents"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[84vw] bg-white dark:bg-[#181a1b] shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col gap-4 overflow-hidden">
          {/* Header with App Icon, Name, and Close X button */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="ArabiMalayalam Logo"
                className="w-8 h-8 object-contain rounded-xl shadow-xs shrink-0"
              />
              <span className="font-extrabold text-lg tracking-tight text-[#202124] dark:text-[#e8eaed]">
                ArabiMalayalam
              </span>
            </div>
            <button
              ref={drawerCloseButtonRef}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#5f6368] cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* New Document Button */}
          <button
            onClick={() => {
              handleNewFile();
              setIsMobileMenuOpen(false);
            }}
            className="flex min-h-11 items-center gap-2.5 px-3.5 text-sm font-bold text-[#137333] dark:text-[#a3e635] bg-[#eaf4ed] dark:bg-[#203328] hover:bg-[#dcefe3] rounded-xl transition-colors cursor-pointer w-full text-left shadow-xs"
          >
            <Plus className="w-5 h-5" strokeWidth={2.75} />
            <span>New Document</span>
          </button>

          {/* Documents List */}
          <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100dvh-270px)] pr-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] px-3 py-1">
              Documents
            </span>
            {documents.length === 0 ? (
              <div className="text-sm font-bold text-[#5f6368] px-3 py-2">No documents</div>
            ) : (
              documents.map((doc) => {
                const isActive = doc.id === currentDocId;
                const displayTitle = doc.title || deriveTitle(doc.plainText) || "Untitled";
                return (
                  <div
                    key={doc.id}
                    className={`group flex items-center rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#dcefe3] dark:bg-[#1b3d2b] text-[#1b4332] dark:text-[#a3e635]"
                        : "text-[#3c4043] dark:text-[#bdc1c6] hover:bg-[#f1f3f4] dark:hover:bg-[#202124]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectDoc(doc);
                        setIsMobileMenuOpen(false);
                      }}
                      className="min-w-0 flex-1 truncate px-3 py-3 text-left font-bold"
                      aria-current={isActive ? "page" : undefined}
                    >
                      {displayTitle}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => requestDeleteDoc(doc.id, displayTitle, e)}
                      className="mr-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                      aria-label={`Delete ${displayTitle}`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom of Mobile Drawer */}
        <div className="p-4 border-t border-[#f1f3f4] dark:border-[#2d3135] flex flex-col gap-2.5">
          <BuyMeACoffeeButton variant="mobile" />
          <button
            onClick={() => {
              setShowFeedbackModal(true);
              setIsMobileMenuOpen(false);
            }}
            className="min-h-11 w-full px-3 text-xs font-bold text-[#3c4043] dark:text-[#e8eaed] bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl hover:bg-[#f8f9fa] dark:hover:bg-[#2d3135] transition-colors cursor-pointer text-center"
          >
            Tell us your feedback
          </button>
          <div className="text-center text-xs font-bold text-[#5f6368] dark:text-[#9aa0a6] pt-1">
            <Link
              to="/about-arabi-malayalam"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mb-2 block rounded-lg py-2 text-[#137333] dark:text-[#a3e635] hover:underline"
            >
              About Arabi-Malayalam
            </Link>
            Build with ❤️ by{" "}
            <a
              href="https://www.cvsuhail.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-[#137333] underline decoration-1 underline-offset-2 dark:text-[#a3e635]"
            >
              CvSuhail
            </a>
          </div>
        </div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        aria-label="Documents"
        className="hidden md:flex w-64 border-r border-[#e8eaed] dark:border-[#2d3135] bg-white dark:bg-[#181a1b] flex-col justify-between shrink-0 select-none"
      >
        {/* Top: Logo & New File */}
        <div className="p-4 flex flex-col gap-4">
          {/* Logo with public/favicon.png */}
          <div className="flex items-center gap-3 px-1 py-1">
            <img
              src="/favicon.png"
              alt="ArabiMalayalam Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-extrabold text-lg tracking-tight text-[#202124] dark:text-[#e8eaed] m-0 leading-tight">
                Arabi-Malayalam Keyboard
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                Manglish · Malayalam · Arabic
              </p>
            </div>
          </div>

          {/* New File Button */}
          <button
            onClick={handleNewFile}
            className="flex items-center gap-2.5 px-3 py-2 text-base font-bold text-[#2d6a4f] dark:text-[#a3e635] hover:bg-[#eaf4ed] dark:hover:bg-[#203328] rounded-xl transition-colors cursor-pointer w-full text-left"
          >
            <Plus className="w-5 h-5 text-[#2d6a4f] dark:text-[#a3e635]" strokeWidth={2.75} />
            <span>New File</span>
          </button>

          {/* Section: Today */}
          <div className="mt-4 flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-270px)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] px-3 py-1">
              Today
            </span>
            {documents.length === 0 ? (
              <div className="text-sm font-bold text-[#5f6368] px-3 py-2">No documents</div>
            ) : (
              documents.map((doc) => {
                const isActive = doc.id === currentDocId;
                const displayTitle = doc.title || deriveTitle(doc.plainText) || "Untitled";
                return (
                  <div
                    key={doc.id}
                    className={`group flex items-center rounded-xl text-base font-bold transition-all ${
                      isActive
                        ? "bg-[#dcefe3] dark:bg-[#1b3d2b] text-[#1b4332] dark:text-[#a3e635]"
                        : "text-[#3c4043] dark:text-[#bdc1c6] hover:bg-[#f1f3f4] dark:hover:bg-[#202124]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectDoc(doc)}
                      className="min-w-0 flex-1 truncate px-3 py-2.5 text-left font-bold"
                      aria-current={isActive ? "page" : undefined}
                    >
                      {displayTitle}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => requestDeleteDoc(doc.id, displayTitle, e)}
                      className="mr-1 flex min-h-9 min-w-9 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 group-focus-within:opacity-100"
                      aria-label={`Delete ${displayTitle}`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom of Sidebar */}
        <div className="p-4 border-t border-[#f1f3f4] dark:border-[#2d3135] flex flex-col gap-2.5">
          <Link
            to="/about-arabi-malayalam"
            className="rounded-lg py-1 text-center text-xs font-bold text-[#137333] dark:text-[#a3e635] hover:underline"
          >
            About & typing guide
          </Link>
          <p className="text-xs font-bold leading-tight text-[#5f6368] dark:text-[#9aa0a6]">
            Your files are stored only in this browser
          </p>
          <BuyMeACoffeeButton variant="sidebar" />
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full py-2 px-3 text-sm font-bold text-[#3c4043] dark:text-[#e8eaed] bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl hover:bg-[#f8f9fa] dark:hover:bg-[#2d3135] transition-colors cursor-pointer text-center"
          >
            Tell us your feedback
          </button>
          <p className="text-center text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
            Made with ❤️ by{" "}
            <a
              href="https://www.cvsuhail.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#137333] underline decoration-1 underline-offset-2 dark:text-[#a3e635]"
            >
              CvSuhail
            </a>
          </p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative"
        id="keyboard-editor"
        aria-hidden={isMobileMenuOpen}
        inert={isMobileMenuOpen}
      >
        {/* TOP MOBILE APP BAR (Native App Header) */}
        <header className="md:hidden flex min-h-14 items-center justify-between px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] bg-white/95 dark:bg-[#181a1b]/95 backdrop-blur-xl border-b border-[#dadce0] dark:border-[#2d3135] shrink-0 z-30 select-none shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(true)}
              className="-ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] cursor-pointer active:scale-95"
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
                  triggerAutoSave(text, e.target.value);
                }}
                className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed] bg-transparent border-0 focus:outline-none focus:bg-black/5 dark:focus:bg-white/10 rounded px-1 truncate max-w-[140px] xs:max-w-[200px]"
                placeholder="Untitled Document"
                aria-label="Document title"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleNewFile}
              className="min-h-11 px-3 rounded-xl bg-[#eaf4ed] dark:bg-[#203328] text-[#137333] dark:text-[#a3e635] hover:bg-[#dcefe3] transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-xs shadow-2xs active:scale-95"
              aria-label="Create new document"
            >
              <Plus className="w-4 h-4" strokeWidth={2.75} />
              <span>New</span>
            </button>
            <button
              onClick={handleCopy}
              className="min-h-11 min-w-11 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#3c4043] dark:text-[#e8eaed] flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              aria-label="Copy document text"
            >
              <Copy className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* DOCUMENT PAPER CANVAS */}
        <div className="editor-workspace flex-1 overflow-y-auto p-0 sm:p-4 md:p-8 flex flex-col items-center relative">
          {/* WRAPPER FOR TOOLBAR AND PAPER */}
          <div className="w-full max-w-[850px] flex flex-col">
            {/* TOP TOOLBAR: Sticky on mobile for effortless editing without scrolling, transparent on desktop */}
            <div className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#181a1b]/95 backdrop-blur-md border-b border-[#dadce0]/80 dark:border-[#2d3135] md:static md:bg-transparent md:border-b-0 py-1.5 px-2.5 md:px-0 flex items-center justify-between select-none gap-1 sm:gap-2 shadow-2xs md:shadow-none">
              <div className="flex w-full items-center justify-start gap-1 overflow-x-auto overscroll-x-contain md:w-auto md:gap-3">
                {/* Undo */}
                <button
                  onClick={handleUndo}
                  disabled={historyStack.length <= 1}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer md:min-h-8 md:min-w-8 md:rounded-lg"
                  aria-label="Undo"
                >
                  <Undo2
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#202124] dark:text-[#e8eaed]"
                    strokeWidth={2.5}
                  />
                </button>

                {/* Redo */}
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer md:min-h-8 md:min-w-8 md:rounded-lg"
                  aria-label="Redo"
                >
                  <Redo2
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#202124] dark:text-[#e8eaed]"
                    strokeWidth={2.5}
                  />
                </button>

                <div className="h-4 sm:h-5 w-[1.5px] bg-[#cfd4dc] dark:bg-[#3c4043] mx-0.5 sm:mx-1" />

                {/* Font Selector Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#202124] transition-colors hover:bg-black/5 dark:text-[#e8eaed] dark:hover:bg-white/10 sm:text-sm md:min-h-8 md:rounded-lg"
                    aria-haspopup="listbox"
                    aria-expanded={showFontDropdown}
                    aria-controls="font-picker"
                  >
                    <span className="truncate max-w-[70px] sm:max-w-none">
                      {selectedFont.name.replace(/ \(.*\)/, "")}
                    </span>
                    <ChevronDown
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#202124] dark:text-[#e8eaed]"
                      strokeWidth={2.5}
                    />
                  </button>

                  {showFontDropdown && (
                    <div
                      id="font-picker"
                      role="listbox"
                      aria-label="Editor font"
                      className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl shadow-xl py-1.5 z-50"
                    >
                      <div className="px-3.5 py-1 text-xs uppercase font-extrabold text-[#5f6368] tracking-wider">
                        Select Font
                      </div>
                      {FONT_FAMILIES.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            loadFont(f);
                            setSelectedFont(f);
                            setShowFontDropdown(false);
                            toast.success(`Font changed to ${f.name}`);
                          }}
                          className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#f1f3f4] dark:hover:bg-[#2d3135] text-sm font-bold transition-colors cursor-pointer ${
                            selectedFont.id === f.id
                              ? "bg-[#eaf4ed] dark:bg-[#203328] text-[#137333] dark:text-[#a3e635]"
                              : "text-[#202124] dark:text-[#e8eaed]"
                          }`}
                          style={{ fontFamily: f.font }}
                          role="option"
                          aria-selected={selectedFont.id === f.id}
                        >
                          <span>{f.name}</span>
                          <span className="text-base opacity-75">سَلَام</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-4 sm:h-5 w-[1.5px] bg-[#cfd4dc] dark:bg-[#3c4043] mx-0.5 sm:mx-1" />

                {/* Bold */}
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition-colors cursor-pointer sm:text-sm md:min-h-8 md:min-w-8 md:rounded-lg ${
                    isBold
                      ? "bg-[#137333] text-white shadow-xs"
                      : "text-[#202124] dark:text-[#e8eaed] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label="Bold"
                  aria-pressed={isBold}
                >
                  <Bold className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
                </button>

                {/* Italic */}
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer sm:text-sm md:min-h-8 md:min-w-8 md:rounded-lg ${
                    isItalic
                      ? "bg-[#137333] text-white shadow-xs"
                      : "text-[#202124] dark:text-[#e8eaed] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label="Italic"
                  aria-pressed={isItalic}
                >
                  <Italic className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.75} />
                </button>

                {/* Underline */}
                <button
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer sm:text-sm md:min-h-8 md:min-w-8 md:rounded-lg ${
                    isUnderline
                      ? "bg-[#137333] text-white shadow-xs"
                      : "text-[#202124] dark:text-[#e8eaed] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label="Underline"
                  aria-pressed={isUnderline}
                >
                  <Underline className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.75} />
                </button>

                {/* Align Center */}
                <button
                  onClick={() => setTextAlign((prev) => (prev === "center" ? "right" : "center"))}
                  className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-colors cursor-pointer md:min-h-8 md:min-w-8 md:rounded-lg ${
                    textAlign === "center"
                      ? "bg-[#137333] text-white shadow-xs"
                      : "text-[#202124] dark:text-[#e8eaed] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label={textAlign === "center" ? "Align text right" : "Align text center"}
                  aria-pressed={textAlign === "center"}
                >
                  <AlignCenter className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.75} />
                </button>
              </div>

              {/* Right Autosave Status: only on desktop */}
              <div className="hidden md:flex text-xs font-bold text-[#5f6368] dark:text-[#9aa0a6] items-center gap-1.5 shrink-0">
                {isSaved ? (
                  <span className="text-[#137333] dark:text-[#a3e635] flex items-center gap-1 font-bold">
                    <Check className="w-4 h-4" strokeWidth={2.75} /> Saved
                  </span>
                ) : (
                  <span className="font-bold">Saving...</span>
                )}
              </div>
            </div>

            {/* White Paper Sheet: Edge-to-edge native note style on mobile, elevated sheet on desktop */}
            <div
              ref={paperRef}
              className="w-full min-h-[calc(100dvh-156px)] sm:min-h-[750px] bg-white dark:bg-[#1e1e1e] border-0 sm:border border-[#dadce0] dark:border-[#2d3135] rounded-none sm:rounded-xl shadow-none sm:shadow-[0_2px_14px_rgba(0,0,0,0.06)] p-4 sm:p-8 md:p-12 pb-36 sm:pb-16 relative flex flex-col mb-2"
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onFocus={() => loadFont(selectedFont)}
                dir={textAlign === "right" ? "rtl" : "ltr"}
                aria-label="Arabi-Malayalam transliteration editor"
                aria-controls={suggestions.length > 0 ? "transliteration-suggestions" : undefined}
                aria-activedescendant={
                  suggestions.length > 0
                    ? `transliteration-suggestion-${activeSuggestionIdx}`
                    : undefined
                }
                placeholder="Type Manglish (njan, evide, engane), Malayalam, or Arabic…"
                style={{
                  fontFamily: selectedFont.font,
                  fontSize: `${fontSize}px`,
                  fontWeight: isBold ? "bold" : "normal",
                  fontStyle: isItalic ? "italic" : "normal",
                  textDecoration: isUnderline ? "underline" : "none",
                  textAlign: textAlign,
                  lineHeight: "2.2",
                }}
                className="w-full h-full flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-[#202124] dark:text-[#e8eaed] font-medium"
              />

              {/* FLOATING SUGGESTIONS POPUP (EXACTLY UNDER THE WORD BEING TYPED) */}
              {suggestions.length > 0 && suggestionPos && (
                <div
                  style={{
                    top: `${suggestionPos.top}px`,
                    left: `${suggestionPos.left}px`,
                  }}
                  id="transliteration-suggestions"
                  role="listbox"
                  aria-label="Transliteration suggestions"
                  className="absolute z-50 w-52 max-w-[calc(100vw-36px)] bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-75 select-none"
                >
                  <div className="flex flex-col gap-1">
                    {suggestions.map((sug, idx) => {
                      const isSelected = idx === activeSuggestionIdx;
                      const isLastCandidate = idx === suggestions.length - 1;
                      return (
                        <button
                          type="button"
                          key={idx}
                          id={`transliteration-suggestion-${idx}`}
                          onClick={() => applySuggestion(sug)}
                          role="option"
                          aria-selected={isSelected}
                          className={`w-full px-3 py-2 flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                            isSelected
                              ? "bg-[#dcefe3] dark:bg-[#1b3d2b] text-[#137333] dark:text-[#a3e635] font-bold"
                              : "text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#2d3135]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden w-full">
                            <span className="text-sm opacity-70 font-mono font-bold shrink-0">
                              {idx + 1}.
                            </span>
                            <span
                              className={`text-lg font-bold truncate ${
                                isLastCandidate ? "opacity-75 font-mono text-base" : ""
                              }`}
                              style={{
                                fontFamily: isLastCandidate ? "monospace" : selectedFont.font,
                              }}
                            >
                              {sug.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FLOATING DOCK */}
        <div className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30 px-3">
          <div className="pointer-events-auto bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-xl border border-[#dadce0] dark:border-[#3c4043] rounded-2xl sm:rounded-full shadow-lg px-2.5 sm:px-3 py-1 flex items-center gap-1 sm:gap-2.5">
            {/* Voice Typing */}
            <button
              onClick={toggleVoiceTyping}
              className={`min-h-11 px-3 sm:px-4 text-sm font-bold rounded-xl sm:rounded-full flex items-center gap-2 transition-colors cursor-pointer active:scale-95 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "hover:bg-[#f1f3f4] dark:hover:bg-[#2d3135] text-[#3c4043] dark:text-[#e8eaed]"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" strokeWidth={2.5} />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#5f6368]" strokeWidth={2.5} />
                  <span>Voice Typing</span>
                </>
              )}
            </button>

            <div className="h-5 w-[1.5px] bg-[#dadce0] dark:bg-[#3c4043]" />

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="min-h-11 px-3 sm:px-4 text-sm font-bold rounded-xl sm:rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#2d3135] text-[#3c4043] dark:text-[#e8eaed] flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <Copy className="w-4 h-4 text-[#5f6368]" strokeWidth={2.5} />
              <span>Copy</span>
            </button>

            {/* Chevron toggle for extra tools */}
            <button
              onClick={() => setShowBottomMore(!showBottomMore)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl sm:rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#2d3135] text-[#5f6368] cursor-pointer active:scale-95"
              aria-label={showBottomMore ? "Hide document tools" : "Show document tools"}
              aria-expanded={showBottomMore}
              aria-controls="document-tools"
            >
              {showBottomMore ? (
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Extra Tools Drawer / Mobile Bottom Action Sheet */}
        {showBottomMore && (
          <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-auto flex justify-center pointer-events-none z-40 animate-in fade-in slide-in-from-bottom-2">
            <div
              id="document-tools"
              className="pointer-events-auto bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-bold w-full max-w-sm sm:max-w-md"
            >
              <span className="text-[#5f6368] dark:text-[#9aa0a6] text-xs">
                {text.trim() ? text.trim().split(/\s+/).length : 0} words · {text.length} characters
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title.replace(/\s+/g, "-") || "document"}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Downloaded document");
                  }}
                  className="px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#2d3135] hover:bg-[#e8eaed] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={2.5} /> Download
                </button>
                <button
                  onClick={(e) => {
                    setShowBottomMore(false);
                    requestDeleteDoc(currentDocId, title, e);
                  }}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FEEDBACK MODAL (SENDS VIA WHATSAPP TO +919562770397) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl w-full max-w-md shadow-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    id="feedback-dialog-title"
                    className="font-extrabold text-base text-[#202124] dark:text-[#e8eaed]"
                  >
                    Tell us your feedback
                  </h2>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-medium">
                    Direct to WhatsApp (+91 95627 70397)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1 rounded-md text-[#5f6368] hover:text-foreground cursor-pointer"
                aria-label="Close feedback dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What can we improve in ArabiMalayalam? Write your thoughts, suggestions, or bug reports here..."
              rows={4}
              className="w-full p-3 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-transparent text-sm font-medium focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
            />

            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-medium hidden xs:inline">
                Opens WhatsApp chat
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFeedback}
                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebc5a] text-white text-xs font-extrabold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl w-full max-w-sm shadow-2xl p-5 flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    id="delete-dialog-title"
                    className="font-extrabold text-base text-[#202124] dark:text-[#e8eaed]"
                  >
                    Delete document?
                  </h2>
                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate max-w-[190px] font-medium">
                    "{docToDelete.title}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocToDelete(null)}
                className="p-1 rounded-md text-[#5f6368] hover:text-foreground cursor-pointer"
                aria-label="Close delete confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              Are you sure you want to delete this document? All content in this document will be
              permanently deleted from your browser storage.
            </p>

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
