import { useRef } from "react";
import { COLOR_COLUMNS, COLOR_SWATCHES } from "./colors";
import { cn } from "../../lib/utils";

interface ColorPickerProps {
  value: string | null;
  onPick: (color: string) => void;
  onClear: () => void;
  clearLabel: string;
}

export function ColorPicker({ value, onPick, onClear, clearLabel }: ColorPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Arrow keys move through the grid; Tab leaves it (one tab stop, not 80).
  const move = (e: React.KeyboardEvent, index: number) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLOR_COLUMNS,
      ArrowDown: COLOR_COLUMNS,
    };
    const step = steps[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(COLOR_SWATCHES.length - 1, index + step));
    gridRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  const selectedIndex = Math.max(0, COLOR_SWATCHES.indexOf(value ?? ""));

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={gridRef}
        role="grid"
        aria-label="Colours"
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLOR_COLUMNS}, 1.25rem)` }}
      >
        {COLOR_SWATCHES.map((color, index) => (
          <button
            key={color + index}
            type="button"
            role="gridcell"
            aria-label={color}
            aria-selected={value === color}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onPick(color)}
            onKeyDown={(e) => move(e, index)}
            className={cn(
              "h-5 w-5 cursor-pointer rounded-sm border border-black/10 focus-visible:outline-offset-1",
              value === color && "ring-2 ring-primary ring-offset-1 ring-offset-popover",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-md px-2 py-1 text-left text-xs font-semibold text-muted-foreground hover:bg-muted"
      >
        {clearLabel}
      </button>
    </div>
  );
}
