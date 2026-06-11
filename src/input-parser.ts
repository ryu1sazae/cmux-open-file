import type { Key } from "./pick-state";

export type InputAction =
  | { type: "key"; key: Key }
  | { type: "confirm" }
  | { type: "cancel" }
  | { type: "clear" };

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

    // Ctrl+U (macOS の Cmd+Backspace 相当)
    // → ピッカーを抜けて commandline ごと全消去する終了種別 "clear"
    if (ch === "\x15") {
      actions.push({ type: "clear" });
      i++;
      continue;
    }

    // Ctrl+W → 末尾単語削除
    if (ch === "\x17") {
      actions.push({ type: "key", key: { type: "delete-word" } });
      i++;
      continue;
    }

    // CSI escape sequences (および Alt+Backspace = ESC + DEL)
    if (ch === "\x1b") {
      // Alt+Backspace: ESC + DEL/BS → 単語削除
      if (data[i + 1] === "\x7f" || data[i + 1] === "\b") {
        actions.push({ type: "key", key: { type: "delete-word" } });
        i += 2;
        continue;
      }
      if (data[i + 1] === "[" && i + 2 < data.length) {
        const seq = data[i + 2];
        i += 3;
        if (seq === "A") actions.push({ type: "key", key: { type: "up" } });
        else if (seq === "B") actions.push({ type: "key", key: { type: "down" } });
        else if (seq === "C") actions.push({ type: "key", key: { type: "expand" } });
        continue;
      }
      actions.push({ type: "cancel" });
      i++;
      continue;
    }

    // Ctrl+N / Ctrl+P (emacs)
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

    // Enter → confirm
    if (ch === "\r" || ch === "\n") {
      actions.push({ type: "confirm" });
      i++;
      continue;
    }

    // Tab → expand to next directory segment of focused candidate
    if (ch === "\t") {
      actions.push({ type: "key", key: { type: "expand" } });
      i++;
      continue;
    }

    // Backspace (BS or DEL)
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

    i++;
  }

  return actions;
}
