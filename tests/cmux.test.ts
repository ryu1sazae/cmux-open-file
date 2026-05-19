import { describe, test, expect, beforeEach } from "bun:test";
import { setSpawner, runCmux, parsePaneRef, parseSurfaceRef, parseRefs } from "../src/cmux";

describe("runCmux", () => {
  let calls: string[][] = [];

  beforeEach(() => {
    calls = [];
    setSpawner(async (cmd, args) => {
      calls.push([cmd, ...args]);
      return { exitCode: 0, stdout: "", stderr: "" };
    });
  });

  test("cmux を引数つきで呼ぶ", async () => {
    await runCmux(["new-pane", "--direction", "right"]);
    expect(calls).toEqual([["cmux", "new-pane", "--direction", "right"]]);
  });

  test("stdout を返す", async () => {
    setSpawner(async () => ({ exitCode: 0, stdout: "hello\n", stderr: "" }));
    expect(await runCmux(["x"])).toBe("hello\n");
  });

  test("exitCode が 0 以外なら例外", async () => {
    setSpawner(async () => ({ exitCode: 1, stdout: "", stderr: "boom" }));
    await expect(runCmux(["fail"])).rejects.toThrow(/boom/);
  });
});

describe("parsePaneRef", () => {
  test("'OK surface:34 pane:29 workspace:15' (cmux new-pane の実出力) から抽出", () => {
    expect(parsePaneRef("OK surface:34 pane:29 workspace:15\n")).toBe("pane:29");
  });

  test("'pane=pane:24' (key=value 形式) から抽出", () => {
    expect(parsePaneRef("OK surface=surface:33 pane=pane:24 path=/tmp\n")).toBe("pane:24");
  });

  test("UUID 形式の pane も拾える", () => {
    expect(parsePaneRef("OK pane=abc-123 something else")).toBe("abc-123");
  });

  test("pane を含まなければ例外", () => {
    expect(() => parsePaneRef("OK surface:1 workspace:1")).toThrow(/pane ref/);
  });
});

describe("parseSurfaceRef / parseRefs", () => {
  test("surface ref を抽出", () => {
    expect(parseSurfaceRef("OK surface:34 pane:29 workspace:15")).toBe("surface:34");
  });

  test("parseRefs は pane と surface 両方を返す", () => {
    expect(parseRefs("OK surface:34 pane:29 workspace:15")).toEqual({
      paneRef: "pane:29",
      surfaceRef: "surface:34",
    });
  });
});
