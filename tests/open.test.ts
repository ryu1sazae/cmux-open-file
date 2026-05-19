import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { setSpawner, resetSpawner } from "../src/cmux";
import { openPath } from "../src/open";

describe("openPath", () => {
  let calls: string[][] = [];
  const originalWs = process.env.CMUX_WORKSPACE_ID;

  beforeEach(() => {
    calls = [];
    setSpawner(async (cmd, args) => {
      calls.push([cmd, ...args]);
      // 最初の呼び出し (new-pane) では pane ref を返す
      if (args[0] === "new-pane") {
        return { exitCode: 0, stdout: "OK surface=surface:99 pane=pane:42 path=/tmp\n", stderr: "" };
      }
      return { exitCode: 0, stdout: "", stderr: "" };
    });
    process.env.CMUX_WORKSPACE_ID = "ws-1";
  });

  afterEach(() => {
    resetSpawner();
    if (originalWs === undefined) {
      delete process.env.CMUX_WORKSPACE_ID;
    } else {
      process.env.CMUX_WORKSPACE_ID = originalWs;
    }
  });

  test(".md は nvim + markdown プレビュー", async () => {
    await openPath("/tmp/foo.md");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-pane"))).toBe(true);
    expect(flat.some((c) => c.includes("markdown open /tmp/foo.md"))).toBe(true);
  });

  test(".html は同じ pane 内に browser surface を追加", async () => {
    await openPath("/tmp/foo.html");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-surface --type browser --pane pane:42"))).toBe(true);
    expect(flat.some((c) => c.includes("file:///tmp/foo.html"))).toBe(true);
  });

  test("nvim は new-pane 直後に作られた pane へ送信", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.startsWith("cmux send --pane pane:42 nvim"))).toBe(true);
  });

  test("その他の拡張子は nvim のみ", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-pane"))).toBe(true);
    expect(flat.some((c) => c.includes("markdown") || c.includes("browser"))).toBe(false);
  });

  test("CMUX_WORKSPACE_ID 未設定なら例外", async () => {
    delete process.env.CMUX_WORKSPACE_ID;
    await expect(openPath("/tmp/foo.md")).rejects.toThrow(/CMUX_WORKSPACE_ID/);
  });

  test("相対パスは絶対化される", async () => {
    await openPath("foo.md");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => /\/.+\/foo\.md/.test(c))).toBe(true);
  });

  test("workspace ID が引数に渡る", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("ws-1"))).toBe(true);
  });
});
