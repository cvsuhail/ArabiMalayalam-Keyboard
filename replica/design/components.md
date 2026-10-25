# Component specs (from recon S01-S09)

Tokens: `tokens.json` (light) / `tokens.dark.json`. In code they are the existing CSS
variables in `src/styles.css` (`bg-paper`, `bg-primary-soft`, `text-muted-foreground`,
`border-border`). Icons: lucide-react (already installed). Base: shadcn/Radix in
`src/components/ui`. No Manglish logo, icons or copy are reused.

Toolbar icon button
  variants  plain, with caret
  sizes     32px square, 16px icon, radius sm
  states    default, hover (muted bg), active (primary-soft bg, accent icon), focus-visible (2px ring), disabled (40% opacity)
  a11y      real <button>, aria-label, aria-pressed for B/I/U, tooltip with shortcut
  used on   S01

Pill select (font family)
  sizes     height 32px, radius md, white bg, chevron right
  states    closed, open, focus-visible
  a11y      Radix Popover + listbox semantics, option rendered in its own font
  used on   S01, S03

Stepper (font size)
  parts     - button, numeric input 12, + button; range 8-72
  states    default, min/max (button disabled)
  a11y      input type=text inputmode=numeric, aria-label "Font size"
  used on   S01

Popover (list, icon row, swatch grid, menu)
  tokens    bg popover, border border, shadow pop, radius md, 4-8px padding
  states    open (fade 120ms)
  a11y      Radix focus trap, Esc closes, arrow-key navigation in menus and grids
  used on   S03-S08

Swatch grid
  layout    10 columns x 8 rows, 20px swatches, selected has 2px ring
  a11y      role=grid, each swatch aria-label colour name, arrow keys
  used on   S06

Toggle switch
  states    on (accent), off (muted), focus-visible, disabled
  a11y      Radix Switch, label linked
  used on   S07

Suggestion card
  layout    absolute under the caret, min width 56px, rows 28px, radius md, shadow pop
  rows      "n. word"; first row active (primary-soft); last row is the typed Latin text, muted
  a11y      role=listbox, aria-activedescendant on the editor, rows role=option
  keys      Space/punctuation commit top row, 1-9 and 0 pick, Up/Down move, Esc closes
  used on   S02

Segmented toggle (language)
  options   Arabi-Malayalam | English, pill, selected = primary-soft + bold
  a11y      role=radiogroup, Cmd/Ctrl+L switches
  used on   S01

Pill button (Voice Typing, Copy split)
  sizes     height 40px, radius pill, 1px border, white bg
  states    default, hover, listening (accent border + pulse, label "Listening"), focus-visible
  a11y      aria-pressed for voice; Copy split = button + menu trigger "Copy options"
  used on   S01, S08

Sidebar row (file)
  states    default, selected (primary-soft), hover (pencil + trash appear), renaming (inline input)
  a11y      list of buttons; rename/delete are real buttons visible on focus-within
  empty     title from first words, else "New File"
  used on   S01, S09

Outline button (feedback)
  pill, 1px border, 13px 500 weight

Missing states added: loading skeleton for the sidebar, empty editor placeholder,
delete confirmation (AlertDialog), copy success toast (sonner), dark theme for all.

Primitives: the shadcn/Radix set in `src/components/ui` already provides popover,
switch, tooltip, alert-dialog, sonner. New toolbar pieces are built inside the M2 work
and checked on the real screen.
