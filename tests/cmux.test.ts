import { describe, test, expect, beforeEach } from "bun:test";
import { setSpawner, runCmux } from "../src/cmux";

describe("runCmux", () => {
  let calls: string[][] = [];

  beforeEach(() => {
    calls = [];
    setSpawner(async (cmd, args) => {
      calls.push([cmd, ...args]);
      return { exitCode: 0, stderr: "" };
    });
  });

  test("cmux を引数つきで呼ぶ", async () => {
    await runCmux(["new-pane", "--direction", "right"]);
    expect(calls).toEqual([["cmux", "new-pane", "--direction", "right"]]);
  });

  test("exitCode が 0 以外なら例外", async () => {
    setSpawner(async () => ({ exitCode: 1, stderr: "boom" }));
    await expect(runCmux(["fail"])).rejects.toThrow(/boom/);
  });
});
