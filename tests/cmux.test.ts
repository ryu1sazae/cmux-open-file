import { describe, test, expect, beforeEach } from "bun:test";
import { setSpawner, runCmux, parsePaneRef } from "../src/cmux";

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
  test("'OK surface=... pane=pane:24 path=...' から pane ref を抽出", () => {
    expect(parsePaneRef("OK surface=surface:33 pane=pane:24 path=/tmp\n")).toBe("pane:24");
  });

  test("UUID 形式の pane も拾える", () => {
    expect(parsePaneRef("OK pane=abc-123 something else")).toBe("abc-123");
  });

  test("pane が無ければ例外", () => {
    expect(() => parsePaneRef("OK surface=surface:1 workspace=workspace:1")).toThrow(/pane ref/);
  });
});
