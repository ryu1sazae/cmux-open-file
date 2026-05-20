import { enumerate } from "./enumerator";
import { createState, applyKey, selected, type PickState } from "./pick-state";
import { parseInput } from "./input-parser";

const SAVE_CURSOR = "\x1b7";
const RESTORE_CURSOR = "\x1b8";
const CLEAR_TO_END = "\x1b[J";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const INVERSE = "\x1b[7m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

const ENUMERATE_LIMIT = 100_000;
const VISIBLE_LIMIT = 10;

/**
 * fish のプロンプトのすぐ下に候補を inline でレンダーする fuzzy ピッカー。
 * stdin/stderr を /dev/tty に張り直した上で呼ばれることを想定する。
 * 最終的に選ばれたパスは stdout に出力する (fish 側で commandline -i する素材になる)。
 */
export async function runPicker(initialQuery = ""): Promise<string | null> {
  if (!process.stdin.isTTY) {
    process.stderr.write("cmux-open-file pick: stdin is not a TTY\n");
    return null;
  }

  const targets = await enumerate(process.cwd(), ENUMERATE_LIMIT);

  const ui = process.stderr;
  ui.write(SAVE_CURSOR + HIDE_CURSOR);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  let state = createState(targets, VISIBLE_LIMIT, initialQuery);
  render(ui, state);

  return new Promise((resolve) => {
    const cleanup = (result: string | null) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners("data");
      ui.write(RESTORE_CURSOR + CLEAR_TO_END + SHOW_CURSOR);
      resolve(result);
    };

    process.stdin.on("data", (data: string) => {
      for (const action of parseInput(data)) {
        if (action.type === "cancel") return cleanup(null);
        if (action.type === "confirm") return cleanup(selected(state));
        state = applyKey(state, action.key);
      }
      render(ui, state);
    });
  });
}

function render(ui: NodeJS.WritableStream, state: PickState): void {
  let out = RESTORE_CURSOR + CLEAR_TO_END;
  out += "\n";
  out += `${DIM}↑↓ select · Tab/→/Enter confirm · Esc cancel${RESET}\n`;
  out += `${DIM}> ${state.query || "(type to filter)"}${RESET}\n`;
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
  out += RESTORE_CURSOR;
  ui.write(out);
}
