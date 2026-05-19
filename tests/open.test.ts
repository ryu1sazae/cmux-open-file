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
      return { exitCode: 0, stderr: "" };
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

  test(".html は nvim + browser", async () => {
    await openPath("/tmp/foo.html");
    const flat = calls.map((c) => c.join(" "));
    expect(flat.some((c) => c.includes("browser open file:///tmp/foo.html"))).toBe(true);
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
