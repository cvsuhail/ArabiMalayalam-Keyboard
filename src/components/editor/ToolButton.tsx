import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

/**
 * Square icon button for the formatting toolbar. Pressing it must not pull the
 * caret out of the editor, so mouse-down is cancelled (keyboard use is unaffected).
 */
export const ToolButton = forwardRef<HTMLButtonElement, ToolButtonProps>(function ToolButton(
  { label, active = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={props["aria-expanded"] === undefined ? active : undefined}
      onMouseDown={(e) => e.preventDefault()}
      {...props}
      className={cn(
        "flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center gap-0.5 rounded-md px-1.5 text-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent max-md:h-11 max-md:min-w-11",
        active && "bg-primary-soft text-primary hover:bg-primary-soft",
        className,
      )}
    >
      {children}
    </button>
  );
});
