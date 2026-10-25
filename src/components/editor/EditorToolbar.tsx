import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { Link } from "@tanstack/react-router";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Check,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
  Printer,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { ColorPicker } from "./ColorPicker";
import { FONT_FAMILIES, type FontChoice } from "./fonts";
import { ToolButton } from "./ToolButton";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

type Alignment = "left" | "center" | "right" | "justify";
const ALIGNMENTS: Array<{ value: Alignment; label: string; Icon: typeof AlignLeft }> = [
  { value: "left", label: "Align left", Icon: AlignLeft },
  { value: "center", label: "Align centre", Icon: AlignCenter },
  { value: "right", label: "Align right", Icon: AlignRight },
  { value: "justify", label: "Justify", Icon: AlignJustify },
];

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  font: FontChoice;
  onFontChange: (font: FontChoice) => void;
  /** Size used where the text has none of its own. */
  defaultFontSize: number;
  onPrint: () => void;
  /** Alignment of paragraphs that have none set: the editor's writing direction. */
  defaultAlignment: Alignment;
  /** Right-hand slot, e.g. the settings menu. */
  children?: ReactNode;
}

export function EditorToolbar({
  editor,
  font,
  onFontChange,
  defaultFontSize,
  onPrint,
  defaultAlignment,
  children,
}: EditorToolbarProps) {
  const run = (command: (chain: ReturnType<Editor["chain"]>) => boolean) => {
    if (editor) command(editor.chain().focus());
  };
  const is = (name: string, attributes?: Record<string, unknown>) =>
    editor?.isActive(name, attributes) ?? false;

  const textStyle = editor?.getAttributes("textStyle") ?? {};
  const fontSize = Number.parseInt(String(textStyle["fontSize"] ?? ""), 10) || defaultFontSize;
  const textColor: string | null = textStyle["color"] ?? null;
  const highlightColor: string | null = editor?.getAttributes("highlight")["color"] ?? null;

  const setSize = (size: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    run((chain) => chain.setFontSize(`${clamped}px`).run());
  };

  const alignment: Alignment =
    ALIGNMENTS.find((a) => is("paragraph", { textAlign: a.value }))?.value ?? defaultAlignment;
  const AlignIcon = ALIGNMENTS.find((a) => a.value === alignment)?.Icon ?? AlignRight;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      aria-controls="editor-surface"
      className="flex items-center gap-0.5 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ToolButton
        label="Undo"
        disabled={!editor?.can().undo()}
        onClick={() => run((c) => c.undo().run())}
      >
        <Undo2 className="size-4" />
      </ToolButton>
      <ToolButton
        label="Redo"
        disabled={!editor?.can().redo()}
        onClick={() => run((c) => c.redo().run())}
      >
        <Redo2 className="size-4" />
      </ToolButton>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Font"
            aria-haspopup="listbox"
            className="mx-1 flex h-8 w-36 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md bg-card px-3 text-[13px] font-medium shadow-xs hover:bg-muted max-md:h-11 max-md:w-32"
          >
            <span className="truncate" style={{ fontFamily: font.font }}>
              {font.name.replace(/ \(.*\)/, "")}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1">
          <div
            role="listbox"
            aria-label="Document font"
            className="flex max-h-80 flex-col overflow-y-auto"
          >
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.id}
                type="button"
                role="option"
                aria-selected={font.id === f.id}
                onClick={() => onFontChange(f)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  font.id === f.id && "bg-primary-soft text-primary",
                )}
                style={{ fontFamily: f.font }}
              >
                <span className="truncate">{f.name}</span>
                {font.id === f.id && <Check className="size-4 shrink-0" />}
              </button>
            ))}
          </div>
          <Link
            to="/fonts"
            className="mt-1 block rounded-md border-t border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
          >
            Try ARML fonts…
          </Link>
        </PopoverContent>
      </Popover>

      <div className="mx-1 flex h-8 shrink-0 items-center rounded-md bg-card shadow-xs max-md:h-11">
        <ToolButton
          label="Decrease font size"
          disabled={fontSize <= MIN_FONT_SIZE}
          onClick={() => setSize(fontSize - 1)}
        >
          <Minus className="size-3.5" />
        </ToolButton>
        <input
          aria-label="Font size"
          inputMode="numeric"
          value={fontSize}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(next)) setSize(next);
          }}
          className="w-8 bg-transparent text-center text-[13px] font-medium outline-offset-2"
        />
        <ToolButton
          label="Increase font size"
          disabled={fontSize >= MAX_FONT_SIZE}
          onClick={() => setSize(fontSize + 1)}
        >
          <Plus className="size-3.5" />
        </ToolButton>
      </div>

      <ToolButton label="Bold" active={is("bold")} onClick={() => run((c) => c.toggleBold().run())}>
        <Bold className="size-4" strokeWidth={2.75} />
      </ToolButton>
      <ToolButton
        label="Italic"
        active={is("italic")}
        onClick={() => run((c) => c.toggleItalic().run())}
      >
        <Italic className="size-4" />
      </ToolButton>
      <ToolButton
        label="Underline"
        active={is("underline")}
        onClick={() => run((c) => c.toggleUnderline().run())}
      >
        <Underline className="size-4" />
      </ToolButton>

      <Popover>
        <PopoverTrigger asChild>
          <ToolButton label="Text colour">
            <span className="flex flex-col items-center leading-none">
              <span className="text-[15px] font-bold">A</span>
              <span
                className="mt-0.5 h-[3px] w-4 rounded-full"
                style={{ backgroundColor: textColor ?? "currentColor" }}
              />
            </span>
          </ToolButton>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <ColorPicker
            value={textColor}
            clearLabel="Default colour"
            onPick={(color) => run((c) => c.setColor(color).run())}
            onClear={() => run((c) => c.unsetColor().run())}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <ToolButton label="Highlight colour">
            <Highlighter
              className="size-4"
              style={highlightColor ? { color: highlightColor } : undefined}
            />
          </ToolButton>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <ColorPicker
            value={highlightColor}
            clearLabel="No highlight"
            onPick={(color) => run((c) => c.setHighlight({ color }).run())}
            onClear={() => run((c) => c.unsetHighlight().run())}
          />
        </PopoverContent>
      </Popover>

      <Divider />

      <Popover>
        <PopoverTrigger asChild>
          <ToolButton label="Alignment">
            <AlignIcon className="size-4" />
            <ChevronDown className="size-3" />
          </ToolButton>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-1 p-1">
          {ALIGNMENTS.map(({ value, label, Icon }) => (
            <ToolButton
              key={value}
              label={label}
              active={alignment === value}
              onClick={() => run((c) => c.setTextAlign(value).run())}
            >
              <Icon className="size-4" />
            </ToolButton>
          ))}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <ToolButton label="Lists">
            {is("orderedList") ? <ListOrdered className="size-4" /> : <List className="size-4" />}
            <ChevronDown className="size-3" />
          </ToolButton>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-1 p-1">
          <ToolButton
            label="Bulleted list"
            active={is("bulletList")}
            onClick={() => run((c) => c.toggleBulletList().run())}
          >
            <List className="size-4" />
          </ToolButton>
          <ToolButton
            label="Numbered list"
            active={is("orderedList")}
            onClick={() => run((c) => c.toggleOrderedList().run())}
          >
            <ListOrdered className="size-4" />
          </ToolButton>
        </PopoverContent>
      </Popover>

      <Divider />
      <ToolButton label="Print" onClick={onPrint}>
        <Printer className="size-4" />
      </ToolButton>

      <div className="ml-auto flex items-center pl-2">{children}</div>
    </div>
  );
}
