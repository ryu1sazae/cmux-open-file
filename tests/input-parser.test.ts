import { describe, test, expect } from "bun:test";
import { parseInput } from "../src/input-parser";

describe("parseInput", () => {
  test("printable 文字は char キー", () => {
    expect(parseInput("a")).toEqual([{ type: "key", key: { type: "char", value: "a" } }]);
  });

  test("Tab / Enter (\\r) / Right arrow は confirm", () => {
    expect(parseInput("\t")).toEqual([{ type: "confirm" }]);
    expect(parseInput("\r")).toEqual([{ type: "confirm" }]);
    expect(parseInput("\x1b[C")).toEqual([{ type: "confirm" }]);
  });

  test("Up/Down arrow", () => {
    expect(parseInput("\x1b[A")).toEqual([{ type: "key", key: { type: "up" } }]);
    expect(parseInput("\x1b[B")).toEqual([{ type: "key", key: { type: "down" } }]);
  });

  test("Ctrl+C / lone Esc は cancel", () => {
    expect(parseInput("\x03")).toEqual([{ type: "cancel" }]);
    expect(parseInput("\x1b")).toEqual([{ type: "cancel" }]);
  });

  test("Ctrl+N / Ctrl+P (emacs)", () => {
    expect(parseInput("\x0e")).toEqual([{ type: "key", key: { type: "down" } }]);
    expect(parseInput("\x10")).toEqual([{ type: "key", key: { type: "up" } }]);
  });

  test("Backspace (DEL / BS)", () => {
    expect(parseInput("\x7f")).toEqual([{ type: "key", key: { type: "backspace" } }]);
    expect(parseInput("\b")).toEqual([{ type: "key", key: { type: "backspace" } }]);
  });

  test("複数 byte をまとめて処理", () => {
    expect(parseInput("ab\x1b[B\r")).toEqual([
      { type: "key", key: { type: "char", value: "a" } },
      { type: "key", key: { type: "char", value: "b" } },
      { type: "key", key: { type: "down" } },
      { type: "confirm" },
    ]);
  });
});
