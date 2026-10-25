import type { ReactNode } from "react";
import { ChevronUp, Copy, Download, Mic, MicOff, Palette, Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { VOICE_LANGUAGES, type VoiceLanguage } from "../../lib/voice/useVoiceTyping";
import { cn } from "../../lib/utils";

interface EditorDockProps {
  isListening: boolean;
  onToggleVoice: () => void;
  voiceLanguage: VoiceLanguage;
  onVoiceLanguage: (language: VoiceLanguage) => void;
  /** What the microphone is hearing right now, before it is final. */
  interimText: string;
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
  voiceLanguage,
  onVoiceLanguage,
  interimText,
  onCopyText,
  onCopyStyled,
  onCopyArml,
  onDownload,
  children,
}: EditorDockProps) {
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 md:pointer-events-auto md:relative md:z-auto md:mt-auto md:justify-between md:px-0 md:pt-6 max-md:flex-col max-md:items-center max-md:gap-2">
      {isListening && (
        <p
          role="status"
          aria-live="polite"
          className="pointer-events-none max-w-[min(32rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-popover px-4 py-2 text-sm shadow-lg max-md:order-first md:absolute md:bottom-full md:right-0 md:mb-2"
        >
          <span className="font-semibold text-primary">
            {interimText ? "Hearing: " : "Listening… "}
          </span>
          <span className="text-muted-foreground">{interimText || "speak now"}</span>
        </p>
      )}
      <div className="pointer-events-auto">{children}</div>
      <div className="pointer-events-auto flex items-center gap-2 max-md:rounded-full max-md:bg-background/90 max-md:p-1 max-md:shadow-lg max-md:backdrop-blur">
        <div
          className={cn(
            "flex items-center rounded-full border border-border bg-card shadow-xs",
            isListening && "border-primary bg-primary-soft",
          )}
        >
          <button
            type="button"
            onClick={onToggleVoice}
            aria-pressed={isListening}
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-l-full px-4 text-[13px] font-semibold transition-colors hover:bg-muted max-md:h-11",
              isListening && "text-primary hover:bg-primary-soft",
            )}
          >
            {isListening ? (
              <span className="relative flex size-4 items-center justify-center">
                <span className="absolute size-4 animate-ping rounded-full bg-primary/40" />
                <MicOff className="relative size-4" />
              </span>
            ) : (
              <Mic className="size-4" />
            )}
            {isListening ? "Stop" : "Voice Typing"}
          </button>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Voice typing language"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-r-full transition-colors hover:bg-muted max-md:h-11 max-md:w-11"
              >
                <ChevronUp className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="min-w-60">
              <DropdownMenuLabel>I will speak</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={voiceLanguage}
                onValueChange={(value) => onVoiceLanguage(value as VoiceLanguage)}
              >
                {VOICE_LANGUAGES.map((language) => (
                  <DropdownMenuRadioItem key={language.value} value={language.value}>
                    <span>
                      {language.label}
                      <span className="ml-1 text-xs text-muted-foreground">({language.hint})</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
