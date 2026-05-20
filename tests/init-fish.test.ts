import { describe, test, expect } from "bun:test";
import { renderFishSnippet } from "../src/init-fish";

describe("renderFishSnippet", () => {
  const snippet = renderFishSnippet();

  test("bind @ が含まれる", () => {
    expect(snippet).toContain("bind @ '__cmux_open_file_at_trigger'");
  });

  test("@ コマンドが cmux-open-file open を呼ぶ", () => {
    expect(snippet).toContain("cmux-open-file open $argv");
  });

  test("ピッカーを cmux-open-file pick で起動する", () => {
    expect(snippet).toContain("cmux-open-file pick");
    // /dev/tty にバイパス (stdout 捕捉と TUI 表示を両立)
    expect(snippet).toContain("</dev/tty 2>/dev/tty");
  });

  test("選択結果は '@ <path>' として挿入される", () => {
    expect(snippet).toContain('commandline -i "@ $selected"');
  });

  test("既に '@ xxx' を編集中なら初期クエリ付きでピッカー再起動", () => {
    expect(snippet).toContain("string match -q '@ *'");
    expect(snippet).toContain("string sub --start 3");
  });

  test("自前 TUI に統一しており complete-and-search は使わない", () => {
    expect(snippet).not.toContain("complete-and-search");
    expect(snippet).not.toContain("complete -c @");
  });
});
