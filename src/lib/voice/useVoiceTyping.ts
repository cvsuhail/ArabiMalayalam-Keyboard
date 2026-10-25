import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceLanguage = "ml-IN" | "en-IN" | "ar-SA";

export const VOICE_LANGUAGES: Array<{ value: VoiceLanguage; label: string; hint: string }> = [
  { value: "ml-IN", label: "Malayalam", hint: "written as Arabi-Malayalam" },
  { value: "en-IN", label: "English (India)", hint: "written in English" },
  { value: "ar-SA", label: "Arabic", hint: "written in Arabic" },
];

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Recognition errors worth telling the person about; the rest (silence, abort) just restart. */
function describeError(code: string, language: VoiceLanguage): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow it in your browser's site settings, then try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "Voice typing needs an internet connection.";
    case "language-not-supported":
      return `This browser cannot recognise ${VOICE_LANGUAGES.find((l) => l.value === language)?.label ?? language}.`;
    default:
      return null;
  }
}

/** Restarts closer together than this, this many times in a row, mean something is wrong. */
const FAST_RESTART_MS = 700;
const MAX_FAST_RESTARTS = 4;

interface Options {
  language: VoiceLanguage;
  /** A finished phrase. Called in order; the previous call finishes first. */
  onFinal: (transcript: string, language: VoiceLanguage) => void | Promise<void>;
  /** Something the person should know: permission blocked, no mic, offline... */
  onProblem: (message: string) => void;
}

/**
 * Dictation on the browser's speech recognition. It keeps listening through pauses
 * (browsers end a session after a few seconds of silence), shows what it is hearing,
 * and reports problems in plain words. Support, quality and the languages offered
 * depend on the browser: Chrome and Edge work well, Safari partly, Firefox not at all.
 */
export function useVoiceTyping(options: Options) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const recognitionRef = useRef<Recognition | null>(null);
  const wantedRef = useRef(false);
  const restartTimesRef = useRef<number[]>([]);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    setSupported(recognitionConstructor() !== undefined);
  }, []);

  const finish = useCallback(() => {
    wantedRef.current = false;
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const begin = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor) return;
    const language = optionsRef.current.language;
    const recognition = new Ctor();
    recognition.lang = language;
    // Android Chrome repeats finished phrases when continuous; one phrase per session is reliable.
    recognition.continuous = !/Android/i.test(navigator.userAgent);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText.trim());
      const phrase = finalText.trim();
      if (phrase) {
        queueRef.current = queueRef.current
          .then(() => optionsRef.current.onFinal(phrase, language))
          .catch((error) => console.error("Voice typing could not insert text", error));
      }
    };

    recognition.onerror = (event) => {
      const message = describeError(event.error, language);
      if (message) {
        optionsRef.current.onProblem(message);
        finish();
      }
    };

    recognition.onend = () => {
      setInterim("");
      if (!wantedRef.current || recognitionRef.current !== recognition) return;
      // The browser ended the session (silence, or one phrase on Android): listen again.
      const now = Date.now();
      const recent = restartTimesRef.current.filter(
        (time) => now - time < FAST_RESTART_MS * MAX_FAST_RESTARTS,
      );
      restartTimesRef.current = [...recent, now];
      if (recent.length >= MAX_FAST_RESTARTS) {
        optionsRef.current.onProblem(
          "Voice typing keeps stopping. Check your microphone and try again.",
        );
        finish();
        return;
      }
      window.setTimeout(() => {
        if (wantedRef.current && recognitionRef.current === recognition) begin();
      }, 150);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      optionsRef.current.onProblem("Could not start the microphone.");
      finish();
    }
  }, [finish]);

  const start = useCallback(() => {
    if (wantedRef.current) return;
    if (!recognitionConstructor()) {
      optionsRef.current.onProblem(
        "Voice typing is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }
    if (!window.isSecureContext) {
      optionsRef.current.onProblem("Voice typing only works on a secure (https) page.");
      return;
    }
    wantedRef.current = true;
    restartTimesRef.current = [];
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => {
    if (!wantedRef.current) return;
    const recognition = recognitionRef.current;
    wantedRef.current = false;
    setListening(false);
    setInterim("");
    recognition?.stop(); // lets a phrase still being recognised finish
    recognitionRef.current = null;
  }, []);

  const toggle = useCallback(() => (wantedRef.current ? stop() : start()), [start, stop]);

  // A different language needs a fresh session.
  useEffect(() => {
    if (!wantedRef.current) return;
    recognitionRef.current?.abort();
  }, [options.language]);

  useEffect(
    () => () => {
      wantedRef.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  return { supported, listening, interim, start, stop, toggle };
}
