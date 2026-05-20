import { describe, test, expect } from "bun:test";
import { createState, applyKey, selected } from "../src/pick-state";

const targets = ["foo.md", "bar.ts", "baz.html"];

describe("pick-state", () => {
  test("初期状態は空クエリ・全件・cursor=0", () => {
    const s = createState(targets, 10);
    expect(s.query).toBe("");
    expect(s.cursor).toBe(0);
    expect(s.matches.length).toBe(3);
  });

  test("initialQuery を渡すと最初から絞り込まれる", () => {
    const s = createState(targets, 10, "foo");
    expect(s.query).toBe("foo");
    expect(s.matches.map((m) => m.path)).toContain("foo.md");
  });

  test("文字入力でクエリが伸びる", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "char", value: "b" });
    expect(s.query).toBe("b");
  });

  test("Backspace でクエリが縮む", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "char", value: "b" });
    s = applyKey(s, { type: "char", value: "a" });
    s = applyKey(s, { type: "backspace" });
    expect(s.query).toBe("b");
  });

  test("Down/Up で cursor が動く", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "down" });
    expect(s.cursor).toBe(1);
    s = applyKey(s, { type: "up" });
    expect(s.cursor).toBe(0);
  });

  test("cursor は境界でクランプ", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "up" });
    expect(s.cursor).toBe(0);
    for (let i = 0; i < 10; i++) s = applyKey(s, { type: "down" });
    expect(s.cursor).toBe(s.matches.length - 1);
  });

  test("クエリが変わると cursor は 0 に戻る", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "down" });
    s = applyKey(s, { type: "char", value: "b" });
    expect(s.cursor).toBe(0);
  });

  test("selected() は選択中のパス", () => {
    let s = createState(targets, 10);
    expect(selected(s)).toBe("foo.md");
    s = applyKey(s, { type: "down" });
    expect(selected(s)).toBe("bar.ts");
  });

  test("マッチ無しなら selected() は null", () => {
    let s = createState(targets, 10);
    for (const c of "zzzzz") s = applyKey(s, { type: "char", value: c });
    expect(selected(s)).toBe(null);
  });
});
