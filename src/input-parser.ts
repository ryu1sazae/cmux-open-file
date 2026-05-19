import type { Key } from "./pick-state";

export type InputAction =
  | { type: "key"; key: Key }
  | { type: "confirm" }
  | { type: "cancel" };

export function parseInput(data: string): InputAction[] {
  const actions: InputAction[] = [];
  let i = 0;

  while (i < data.length) {
    const ch = data[i];

    // Ctrl+C
    if (ch === "\x03") {
      actions.push({ type: "cancel" });
      i++;
      continue;
    }

    // Esc sequences
    if (ch === "\x1b") {
      // CSI: ESC [ X
      if (data[i + 1] === "[" && i + 2 < data.length) {
        const seq = data[i + 2];
        i += 3;
        if (seq === "A") {
          actions.push({ type: "key", key: { type: "up" } });
        } else if (seq === "B") {
          actions.push({ type: "key", key: { type: "down" } });
        } else if (seq === "C") {
          actions.push({ type: "confirm" });
        }
        continue;
      }
      // lone Esc
      actions.push({ type: "cancel" });
      i++;
      continue;
    }

    // Ctrl+N / Ctrl+P (emacs-style)
    if (ch === "\x0e") {
      actions.push({ type: "key", key: { type: "down" } });
      i++;
      continue;
    }
    if (ch === "\x10") {
      actions.push({ type: "key", key: { type: "up" } });
      i++;
      continue;
    }

    // Enter (CR or LF)
    if (ch === "\r" || ch === "\n") {
      actions.push({ type: "confirm" });
      i++;
      continue;
    }

    // Tab
    if (ch === "\t") {
      actions.push({ type: "confirm" });
      i++;
      continue;
    }

    // Backspace (DEL or BS)
    if (ch === "\x7f" || ch === "\b") {
      actions.push({ type: "key", key: { type: "backspace" } });
      i++;
      continue;
    }

    // Printable
    if (ch >= " " && ch !== "\x7f") {
      actions.push({ type: "key", key: { type: "char", value: ch } });
      i++;
      continue;
    }

    // Unknown control char: skip
    i++;
  }

  return actions;
}
