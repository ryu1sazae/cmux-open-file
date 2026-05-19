import { describe, test, expect } from "bun:test";
import { renderFishSnippet } from "../src/init-fish";

describe("renderFishSnippet", () => {
  const snippet = renderFishSnippet();

  test("bind @ が含まれる", () => {
    expect(snippet).toContain("bind @ '__cmux_open_file_at_trigger'");
  });

  test("commandline が空の時に '@ ' を挿入して補完を発火", () => {
    expect(snippet).toContain("commandline -i '@ '");
    expect(snippet).toContain("commandline -f complete");
  });

  test("@ 関数で cmux-open-file open を呼ぶ", () => {
    expect(snippet).toContain("cmux-open-file open $argv");
  });

  test("complete -c @ で dynamic completion を登録", () => {
    expect(snippet).toContain("complete -c @ -f -k -a");
    expect(snippet).toContain("cmux-open-file complete");
    expect(snippet).toContain("commandline -ct");
  });
});
