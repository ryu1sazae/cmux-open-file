import { enumerate } from "./enumerator";
import { createState, applyKey, selected, type PickState } from "./pick-state";
import { parseInput } from "./input-parser";

const SAVE_CURSOR = "\x1b7";
const RESTORE_CURSOR = "\x1b8";
const CLEAR_TO_END = "\x1b[J";
const INVERSE = "\x1b[7m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

const ENUMERATE_LIMIT = 100_000;
const VISIBLE_LIMIT = 10;

export type PickResult =
  | { kind: "selected"; path: string }
  | { kind: "cancel" }
  | { kind: "clear" };

/**
 * fish プロンプトの右に `@ <query>` をインライン描画し、すぐ下に候補をレンダーする
 * fuzzy ピッカー。stdin/stderr を /dev/tty に張り直して呼ばれる前提。
 * 終了経路は3種類:
 *   - selected: パスを stdout に出力。fish 側は `@ <path>` を commandline に挿入
 *   - cancel:   何も出力しない。fish 側は元の commandline を復元
 *   - clear:    何も出力しない。fish 側は commandline を空にする ('@' も消える)
 */
export async function runPicker(initialQuery = ""): Promise<PickResult> {
  if (!process.stdin.isTTY) {
    process.stderr.write("cmux-open-file pick: stdin is not a TTY\n");
    return { kind: "cancel" };
  }

  const targets = await enumerate(process.cwd(), ENUMERATE_LIMIT);

  const ui = process.stderr;
  ui.write(SAVE_CURSOR);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  let state = createState(targets, VISIBLE_LIMIT, initialQuery);
  render(ui, state);

  return new Promise((resolve) => {
    const cleanup = (result: PickResult) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners("data");
      ui.write(RESTORE_CURSOR + CLEAR_TO_END);
      resolve(result);
    };

    process.stdin.on("data", (data: string) => {
      for (const action of parseInput(data)) {
        if (action.type === "cancel") return cleanup({ kind: "cancel" });
        if (action.type === "clear") return cleanup({ kind: "clear" });
        if (action.type === "confirm") {
          const sel = selected(state);
          return cleanup(sel ? { kind: "selected", path: sel } : { kind: "cancel" });
        }
        if (
          action.type === "key"
          && action.key.type === "backspace"
          && state.query === ""
        ) {
          return cleanup({ kind: "cancel" });
        }
        state = applyKey(state, action.key);
      }
      render(ui, state);
    });
  });
}

function render(ui: NodeJS.WritableStream, state: PickState): void {
  // インラインに描画する文字列: "@ <query>"
  const inline = `@ ${state.query}`;
  let out = "";
  out += RESTORE_CURSOR;     // 保存したプロンプト直後の位置に戻る
  out += CLEAR_TO_END;        // そこから下を全部クリア
  out += inline;              // "@ <query>" をプロンプトの隣に描く
  // 候補を1行下から描画
  out += "\r\n";
  out += `${DIM}↑↓ select · Tab/→ expand · Enter confirm · Ctrl+U clear · Esc cancel${RESET}\r\n`;
  if (state.matches.length === 0) {
    out += `  ${DIM}No matches${RESET}\r\n`;
  } else {
    for (let i = 0; i < state.matches.length; i++) {
      if (i === state.cursor) {
        out += `${INVERSE} ${state.matches[i].path} ${RESET}\r\n`;
      } else {
        out += `  ${state.matches[i].path}\r\n`;
      }
    }
  }
  // カーソルを inline 文字列の末尾 (= 次の入力位置) に戻す
  out += RESTORE_CURSOR;
  if (inline.length > 0) {
    out += `\x1b[${inline.length}C`;
  }
  ui.write(out);
}
