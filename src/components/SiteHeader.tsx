import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

/** Top bar for the standalone pages (fonts, alphabet): brand on the left, a way back to the keyboard. */
export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-xl font-extrabold">
          <img src="/favicon.png" alt="" className="size-9 rounded-xl" />
          <span>ArabiMalayalam</span>
        </Link>
        <Button asChild>
          <Link to="/">Open keyboard</Link>
        </Button>
      </div>
    </header>
  );
}
