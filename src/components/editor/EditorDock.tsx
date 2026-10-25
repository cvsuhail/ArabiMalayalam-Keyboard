import type { ReactNode } from "react";
import { ChevronUp, Copy, Download, Mic, MicOff, Palette, Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

interface EditorDockProps {
  isListening: boolean;
  onToggleVoice: () => void;
  onCopyText: () => void;
  onCopyStyled: () => void;
  onCopyArml: () => void;
  onDownload: () => void;
  /** Left-hand slot, e.g. the language toggle. */
  children?: ReactNode;
}

const PILL =
  "flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 text-[13px] font-semibold shadow-xs transition-colors hover:bg-muted max-md:h-11";

/**
 * Voice and copy controls. On desktop it is the bottom row of the paper; on a phone
 * it floats above the keyboard area so it stays reachable while scrolling.
 */
export function EditorDock({
  isListening,
  onToggleVoice,
  onCopyText,
  onCopyStyled,
  onCopyArml,
  onDownload,
  children,
}: EditorDockProps) {
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 md:pointer-events-auto md:static md:z-auto md:mt-auto md:justify-between md:px-0 md:pt-6 max-md:flex-col max-md:items-center max-md:gap-2">
      <div className="pointer-events-auto">{children}</div>
      <div className="pointer-events-auto flex items-center gap-2 max-md:rounded-full max-md:bg-background/90 max-md:p-1 max-md:shadow-lg max-md:backdrop-blur">
        <button
          type="button"
          onClick={onToggleVoice}
          aria-pressed={isListening}
          className={cn(
            PILL,
            isListening && "animate-pulse border-primary bg-primary-soft text-primary",
          )}
        >
          {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          {isListening ? "Listening…" : "Voice Typing"}
        </button>

        <div className="flex items-center rounded-full border border-border bg-card shadow-xs">
          <button
            type="button"
            onClick={onCopyText}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-l-full px-4 text-[13px] font-semibold transition-colors hover:bg-muted max-md:h-11"
          >
            <Copy className="size-4" />
            Copy
          </button>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Copy options"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-r-full transition-colors hover:bg-muted max-md:h-11 max-md:w-11"
              >
                <ChevronUp className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="min-w-52">
              <DropdownMenuItem onSelect={onCopyText}>
                <Copy className="size-4" /> Copy text only
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCopyStyled}>
                <Palette className="size-4" /> Copy with styles
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCopyArml}>
                <Type className="size-4" /> Copy as ARML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDownload}>
                <Download className="size-4" /> Download as .txt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
