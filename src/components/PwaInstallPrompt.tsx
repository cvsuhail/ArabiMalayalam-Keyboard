import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Sparkles, Smartphone, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithLegacyMsStream extends Window {
  MSStream?: unknown;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigatorWithStandalone.standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const legacyWindow = window as WindowWithLegacyMsStream;
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !legacyWindow.MSStream;
    setIsIos(isIosDevice);

    // Check if dismissed recently (cooldown of 2 days)
    const dismissedAt = localStorage.getItem("pwa_install_dismissed_at");
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const isDismissedRecently = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < twoDaysMs;

    // Chrome/Android/Edge beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissedRecently) {
        // Delay slightly for smooth initial page load
        setTimeout(() => setIsOpen(true), 1200);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS users who don't get beforeinstallprompt, show the iOS install sheet on mobile open
    if (isIosDevice && !isDismissedRecently) {
      setTimeout(() => setIsOpen(true), 1600);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("pwa_install_dismissed_at", Date.now().toString());
  };

  if (!isOpen || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none select-none">
      {/* Backdrop overlay */}
      <div
        onClick={handleDismiss}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 pointer-events-auto"
      />

      {/* Mobile Native Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] border-t border-x border-[#dadce0] dark:border-[#3c4043] rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] p-5 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] pointer-events-auto animate-in slide-in-from-bottom duration-300 flex flex-col gap-4"
      >
        {/* Grab Handle Pill */}
        <div className="w-12 h-1.5 bg-[#dadce0] dark:bg-[#3c4043] rounded-full mx-auto -mt-1 cursor-grab" />

        {/* Close Button Top Right */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5f6368] dark:text-[#9aa0a6] cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* App Info Header */}
        <div className="flex items-center gap-4 mt-1">
          <img
            src="/icon-192.png"
            alt="ArabiMalayalam App Icon"
            className="w-16 h-16 rounded-2xl shadow-md border border-black/5 dark:border-white/10 object-contain shrink-0 p-1 bg-white"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2
                id="install-app-title"
                className="font-extrabold text-xl text-[#202124] dark:text-[#e8eaed] leading-snug"
              >
                ArabiMalayalam
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#dcefe3] dark:bg-[#1b3d2b] text-[#137333] dark:text-[#a3e635]">
                App
              </span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed mt-0.5">
              Install ArabiMalayalam for the best full-screen native mobile experience.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-[#f8f9fa] dark:bg-[#25282a] border border-[#f1f3f4] dark:border-[#2d3135]">
            <Sparkles
              className="w-5 h-5 text-[#137333] dark:text-[#a3e635] mb-1"
              strokeWidth={2.5}
            />
            <span className="text-[11px] font-bold text-[#202124] dark:text-[#e8eaed]">
              Instant
            </span>
            <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Real-time Typing</span>
          </div>
          <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-[#f8f9fa] dark:bg-[#25282a] border border-[#f1f3f4] dark:border-[#2d3135]">
            <WifiOff
              className="w-5 h-5 text-[#137333] dark:text-[#a3e635] mb-1"
              strokeWidth={2.5}
            />
            <span className="text-[11px] font-bold text-[#202124] dark:text-[#e8eaed]">
              Offline
            </span>
            <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Works Anywhere</span>
          </div>
          <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-[#f8f9fa] dark:bg-[#25282a] border border-[#f1f3f4] dark:border-[#2d3135]">
            <Smartphone
              className="w-5 h-5 text-[#137333] dark:text-[#a3e635] mb-1"
              strokeWidth={2.5}
            />
            <span className="text-[11px] font-bold text-[#202124] dark:text-[#e8eaed]">Native</span>
            <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">No Browser Bars</span>
          </div>
        </div>

        {/* iOS Specific Instructions OR Android/Desktop One-click Install */}
        {isIos && !deferredPrompt ? (
          <div className="bg-[#eaf4ed] dark:bg-[#1b3d2b]/60 border border-[#b7dfc8] dark:border-[#2a593e] rounded-2xl p-3.5 text-xs text-[#137333] dark:text-[#a3e635] font-medium flex flex-col gap-2">
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <Share className="w-4 h-4" strokeWidth={2.5} /> How to install on iPhone/iPad:
            </span>
            <ol className="list-decimal list-inside flex flex-col gap-1 text-[13px] text-[#202124] dark:text-[#e8eaed]">
              <li>
                Tap the{" "}
                <span className="font-bold inline-flex items-center gap-1">
                  <Share className="w-3.5 h-3.5 inline" /> Share
                </span>{" "}
                button at the bottom of Safari.
              </li>
              <li>
                Scroll down and tap{" "}
                <span className="font-bold inline-flex items-center gap-1">
                  <PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen
                </span>
                .
              </li>
            </ol>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-sm font-bold text-[#5f6368] dark:text-[#bdc1c6] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-center"
          >
            Maybe Later
          </button>

          {(!isIos || deferredPrompt) && (
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3 px-4 rounded-xl bg-[#137333] hover:bg-[#1b4332] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-98"
            >
              <Download className="w-4 h-4" strokeWidth={2.75} />
              <span>Install App</span>
            </button>
          )}

          {isIos && !deferredPrompt && (
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 px-4 rounded-xl bg-[#137333] hover:bg-[#1b4332] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Got it</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
