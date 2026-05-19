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
        return { exitCode: 0, stdout: "OK surface:99 pane:42 workspace:1\n", stderr: "" };
      }
      if (args[0] === "markdown") {
        return { exitCode: 0, stdout: "OK surface:77 pane:55 workspace:1\n", stderr: "" };
      }
      if (args[0] === "new-surface") {
        return { exitCode: 0, stdout: "OK surface:88 pane:42 workspace:1\n", stderr: "" };
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

  test(".md は markdown surface を nvim の左に移動", async () => {
    await openPath("/tmp/foo.md");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-pane"))).toBe(true);
    expect(flat.some((c) => c.includes("markdown open /tmp/foo.md"))).toBe(true);
    // markdown surface (surface:77) を pane:42 に移し、nvim surface (surface:99) の前 (左) に置く
    expect(flat.some((c) =>
      c.includes("move-surface --surface surface:77 --pane pane:42 --before surface:99")
    )).toBe(true);
  });

  test(".html は同じ pane 内に browser surface を nvim の左に追加", async () => {
    await openPath("/tmp/foo.html");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-surface --type browser --pane pane:42"))).toBe(true);
    expect(flat.some((c) => c.includes("file:///tmp/foo.html"))).toBe(true);
    // browser surface (surface:88) を nvim surface (surface:99) の前 (左) に並べる
    expect(flat.some((c) => c.includes("reorder-surface --surface surface:88 --before surface:99"))).toBe(true);
  });

  test("nvim は new-pane 直後の surface へ送信される (cmux send は --surface のみ受け付ける)", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.startsWith("cmux send --surface surface:99 nvim"))).toBe(true);
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
