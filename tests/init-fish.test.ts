import { describe, test, expect } from "bun:test";
import { renderFishSnippet } from "../src/init-fish";

describe("renderFishSnippet", () => {
  const snippet = renderFishSnippet();

  test("bind @ が含まれる", () => {
    expect(snippet).toContain("bind @ '__cmux_open_file_at_trigger'");
  });

  test("commandline が空の時のみピッカー起動", () => {
    expect(snippet).toContain("if test -z (commandline)");
  });

  test("@ 関数で cmux-open-file open を呼ぶ", () => {
    expect(snippet).toContain("cmux-open-file open $argv");
  });

  test('commandline -i "@ $selected" で挿入する (fish が @ を独立トークンとして解釈するため空白が必要)', () => {
    expect(snippet).toContain('commandline -i "@ $selected"');
  });
});
