import { describe, test, expect } from "bun:test";
import { parseInput } from "../src/input-parser";

describe("parseInput", () => {
  test("printable 文字は char キー", () => {
    expect(parseInput("a")).toEqual([{ type: "key", key: { type: "char", value: "a" } }]);
  });

  test("Tab は confirm", () => {
    expect(parseInput("\t")).toEqual([{ type: "confirm" }]);
  });

  test("Enter (\\r) は confirm", () => {
    expect(parseInput("\r")).toEqual([{ type: "confirm" }]);
  });

  test("Right arrow は confirm", () => {
    expect(parseInput("\x1b[C")).toEqual([{ type: "confirm" }]);
  });

  test("Up arrow は up", () => {
    expect(parseInput("\x1b[A")).toEqual([{ type: "key", key: { type: "up" } }]);
  });

  test("Down arrow は down", () => {
    expect(parseInput("\x1b[B")).toEqual([{ type: "key", key: { type: "down" } }]);
  });

  test("Ctrl+C は cancel", () => {
    expect(parseInput("\x03")).toEqual([{ type: "cancel" }]);
  });

  test("lone Esc は cancel", () => {
    expect(parseInput("\x1b")).toEqual([{ type: "cancel" }]);
  });

  test("Ctrl+N は down (emacs-style)", () => {
    expect(parseInput("\x0e")).toEqual([{ type: "key", key: { type: "down" } }]);
  });

  test("Ctrl+P は up", () => {
    expect(parseInput("\x10")).toEqual([{ type: "key", key: { type: "up" } }]);
  });

  test("Backspace (DEL) は backspace", () => {
    expect(parseInput("\x7f")).toEqual([{ type: "key", key: { type: "backspace" } }]);
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
