import { enumerate } from "./enumerator";
import { createState, applyKey, selected, type PickState } from "./pick-state";
import { parseInput } from "./input-parser";

const ENTER_ALT = "\x1b[?1049h";
const EXIT_ALT = "\x1b[?1049l";
const CLEAR = "\x1b[2J\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const INVERSE = "\x1b[7m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

const ENUMERATE_LIMIT = 100_000;
const VISIBLE_LIMIT = 10;

export async function runPicker(): Promise<string | null> {
  if (!process.stdin.isTTY) {
    process.stderr.write("cmux-open-file pick: stdin is not a TTY\n");
    return null;
  }

  const cwd = process.cwd();
  const targets = await enumerate(cwd, ENUMERATE_LIMIT);
  const truncated = targets.length >= ENUMERATE_LIMIT;

  // TUI output goes to stderr so it doesn't pollute the captured stdout (the selected path).
  // The fish snippet redirects stderr to /dev/tty so it remains visible.
  const ui = process.stderr;
  ui.write(ENTER_ALT + HIDE_CURSOR);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  let state = createState(targets, VISIBLE_LIMIT);
  render(ui, state, truncated);

  return new Promise((resolve) => {
    const cleanup = (result: string | null) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners("data");
      ui.write(SHOW_CURSOR + EXIT_ALT);
      resolve(result);
    };

    const onData = (data: string) => {
      for (const action of parseInput(data)) {
        if (action.type === "cancel") {
          cleanup(null);
          return;
        }
        if (action.type === "confirm") {
          const sel = selected(state);
          cleanup(sel);
          return;
        }
        state = applyKey(state, action.key);
      }
      render(ui, state, truncated);
    };

    process.stdin.on("data", onData);
  });
}

function render(ui: NodeJS.WritableStream, state: PickState, truncated: boolean): void {
  let out = CLEAR;
  out += `${DIM}cmux-open-file${RESET} ` +
    `${DIM}— ↑↓ select · Tab/→/Enter confirm · Esc cancel${RESET}\n`;
  if (truncated) {
    out += `${DIM}(showing first ${state.targets.length} of more files)${RESET}\n`;
  }
  out += `\n> ${state.query}\n\n`;

  if (state.matches.length === 0) {
    out += `  ${DIM}No matches${RESET}\n`;
  } else {
    for (let i = 0; i < state.matches.length; i++) {
      if (i === state.cursor) {
        out += `${INVERSE} ${state.matches[i].path} ${RESET}\n`;
      } else {
        out += `  ${state.matches[i].path}\n`;
      }
    }
  }
  ui.write(out);
}
