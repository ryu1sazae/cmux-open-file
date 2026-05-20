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

/**
 * fish プロンプトの右に `@ <query>` をインライン描画し、すぐ下に候補をレンダーする
 * fuzzy ピッカー。stdin/stderr を /dev/tty に張り直して呼ばれる前提。
 * 最終的に選ばれたパスは stdout に出力する。
 */
export async function runPicker(initialQuery = ""): Promise<string | null> {
  if (!process.stdin.isTTY) {
    process.stderr.write("cmux-open-file pick: stdin is not a TTY\n");
    return null;
  }

  const targets = await enumerate(process.cwd(), ENUMERATE_LIMIT);

  const ui = process.stderr;
  // 現在のカーソル位置 (fish プロンプト直後) を保存
  ui.write(SAVE_CURSOR);
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
      // 描画した内容をすべて拭って fish の repaint に明け渡す
      ui.write(RESTORE_CURSOR + CLEAR_TO_END);
      resolve(result);
    };

    process.stdin.on("data", (data: string) => {
      for (const action of parseInput(data)) {
        if (action.type === "cancel") return cleanup(null);
        if (action.type === "confirm") return cleanup(selected(state));
        // 空 query で Backspace → ピッカーを抜けて fish の '@' も削除可能にする
        if (
          action.type === "key"
          && action.key.type === "backspace"
          && state.query === ""
        ) {
          return cleanup(null);
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
