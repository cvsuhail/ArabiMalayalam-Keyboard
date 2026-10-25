import { useCallback, useEffect, useState } from "react";

export interface EditorSettings {
  theme: "light" | "dark";
  /** Show the word list under the typed word; off still converts the top pick on Space. */
  showSuggestions: boolean;
  /** Cmd/Ctrl+L switches the input language. */
  languageShortcut: boolean;
  inputLanguage: "arabi" | "english";
}

export const SETTINGS_KEY = "arabimalayalam-settings";

const DEFAULT_SETTINGS: EditorSettings = {
  theme: "light",
  showSuggestions: true,
  languageShortcut: true,
  inputLanguage: "arabi",
};

/**
 * Runs in <head> before first paint so a dark-theme reader never sees a white flash.
 * Keep in step with `applyTheme` below.
 */
export const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");var d=s.theme?s.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

function readSettings(): EditorSettings {
  try {
    const stored = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? "{}",
    ) as Partial<EditorSettings>;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return {
      ...DEFAULT_SETTINGS,
      theme: systemDark ? "dark" : "light",
      ...stored,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme: EditorSettings["theme"]): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Preferences kept per browser. Defaults render on the server; stored values load after mount. */
export function useEditorSettings(): [EditorSettings, (patch: Partial<EditorSettings>) => void] {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = readSettings();
    setSettings(stored);
    applyTheme(stored.theme);
  }, []);

  const update = useCallback((patch: Partial<EditorSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Private mode or full storage: the choice still applies for this visit.
      }
      if (patch.theme) applyTheme(next.theme);
      return next;
    });
  }, []);

  return [settings, update];
}
