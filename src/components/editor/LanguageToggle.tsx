import type { EditorSettings } from "../../lib/settings";
import { cn } from "../../lib/utils";

const OPTIONS: Array<{ value: EditorSettings["inputLanguage"]; label: string }> = [
  { value: "arabi", label: "Arabi-Malayalam" },
  { value: "english", label: "English" },
];

interface LanguageToggleProps {
  value: EditorSettings["inputLanguage"];
  onChange: (value: EditorSettings["inputLanguage"]) => void;
}

/** English types Latin letters as they are; Arabi-Malayalam converts Manglish as you type. */
export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Input language"
      className="flex items-center rounded-full border border-border bg-card p-0.5 shadow-xs"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 cursor-pointer rounded-full px-4 text-[13px] transition-colors",
            value === option.value
              ? "bg-primary-soft font-bold text-secondary-foreground"
              : "font-medium text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
