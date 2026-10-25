import type { ReactNode } from "react";
import { Info, Keyboard, MessageSquare, Moon, MoreVertical, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import type { EditorSettings } from "../../lib/settings";
import { ToolButton } from "./ToolButton";

/** Visual switch for a menu row; the row itself carries the checkbox semantics. */
function SwitchGlyph({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
        on ? "bg-primary" : "bg-muted-foreground/40",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-primary-foreground shadow-sm transition-transform",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <DropdownMenuItem
      role="menuitemcheckbox"
      aria-checked={checked}
      // Switching a preference should not close the menu.
      onSelect={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="gap-3 py-2.5"
    >
      {icon}
      <span>
        {label}
        {hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}
      </span>
      <SwitchGlyph on={checked} />
    </DropdownMenuItem>
  );
}

interface SettingsMenuProps {
  settings: EditorSettings;
  onChange: (patch: Partial<EditorSettings>) => void;
  onFeedback: () => void;
  /** Label for the shortcut, e.g. "⌘L" or "Ctrl+L". */
  shortcutLabel: string;
}

export function SettingsMenu({ settings, onChange, onFeedback, shortcutLabel }: SettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolButton label="Settings">
          <MoreVertical className="size-4" />
        </ToolButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <ToggleRow
          icon={<Moon className="size-4" />}
          label="Dark theme"
          checked={settings.theme === "dark"}
          onToggle={() => onChange({ theme: settings.theme === "dark" ? "light" : "dark" })}
        />
        <ToggleRow
          icon={<Sparkles className="size-4" />}
          label="Show word suggestions"
          checked={settings.showSuggestions}
          onToggle={() => onChange({ showSuggestions: !settings.showSuggestions })}
        />
        <ToggleRow
          icon={<Keyboard className="size-4" />}
          label="Language switch shortcut"
          hint={shortcutLabel}
          checked={settings.languageShortcut}
          onToggle={() => onChange({ languageShortcut: !settings.languageShortcut })}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-3 py-2.5" onSelect={onFeedback}>
          <MessageSquare className="size-4" />
          Tell us your feedback
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-3 py-2.5">
          <Link to="/about-arabi-malayalam">
            <Info className="size-4" />
            About
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
