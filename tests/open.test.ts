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
      if (args[0] === "identify") {
        // 実機サンプルと同じ JSON 構造
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            caller: { pane_ref: "pane:42", surface_ref: "surface:11", workspace_ref: "workspace:1" },
          }),
          stderr: "",
        };
      }
      if (args[0] === "new-surface") {
        // type に応じて違う surface ref を返す
        const isBrowser = args.includes("browser");
        return {
          exitCode: 0,
          stdout: isBrowser
            ? "OK surface:88 pane:42 workspace:1\n"
            : "OK surface:99 pane:42 workspace:1\n",
          stderr: "",
        };
      }
      if (args[0] === "markdown") {
        return { exitCode: 0, stdout: "OK surface:77 pane:55 workspace:1\n", stderr: "" };
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
    expect(flat.some((c) => c.includes("identify"))).toBe(true);
    expect(flat.some((c) => c.includes("markdown open /tmp/foo.md"))).toBe(true);
    // markdown surface (surface:77) を pane:42 に移し、nvim surface (surface:99) の前 (左) に置く
    expect(flat.some((c) =>
      c.includes("move-surface --surface surface:77 --pane pane:42 --before surface:99")
    )).toBe(true);
  });

  test("new-pane は呼ばれない (現ペインに直接 surface を追加するため)", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-pane"))).toBe(false);
    // identify で現ペイン取得 + new-surface で nvim 追加
    expect(flat.some((c) => c.includes("identify"))).toBe(true);
    expect(flat.some((c) => c.includes("new-surface --type terminal --pane pane:42"))).toBe(true);
  });

  test(".html は同じ pane 内に browser surface を nvim の左に追加", async () => {
    await openPath("/tmp/foo.html");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-surface --type browser --pane pane:42"))).toBe(true);
    expect(flat.some((c) => c.includes("file:///tmp/foo.html"))).toBe(true);
    // browser surface (surface:88) を nvim surface (surface:99) の前 (左) に並べる
    expect(flat.some((c) => c.includes("reorder-surface --surface surface:88 --before surface:99"))).toBe(true);
  });

  test("nvim 送信は new-surface で作った surface へ (--surface 指定)", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.startsWith("cmux send --surface surface:99 nvim"))).toBe(true);
  });

  test("その他の拡張子は nvim サーフェスのみ追加", async () => {
    await openPath("/tmp/foo.ts");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("new-surface --type terminal"))).toBe(true);
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
