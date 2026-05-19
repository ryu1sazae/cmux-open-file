import { describe, test, expect } from "bun:test";
import { createState, applyKey, selected } from "../src/pick-state";

const targets = ["foo.md", "bar.ts", "baz.html"];

describe("pick-state", () => {
  test("初期状態は空クエリで全件、cursor=0", () => {
    const s = createState(targets, 10);
    expect(s.query).toBe("");
    expect(s.cursor).toBe(0);
    expect(s.matches.length).toBe(3);
  });

  test("文字入力でクエリが伸びる", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "char", value: "b" });
    expect(s.query).toBe("b");
    const paths = s.matches.map((m) => m.path);
    expect(paths).toContain("bar.ts");
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

  test("selected() が選択中のパスを返す", () => {
    let s = createState(targets, 10);
    expect(selected(s)).toBe("foo.md");
    s = applyKey(s, { type: "down" });
    expect(selected(s)).toBe("bar.ts");
  });

  test("マッチ無しなら selected() は null", () => {
    let s = createState(targets, 10);
    s = applyKey(s, { type: "char", value: "z" });
    s = applyKey(s, { type: "char", value: "z" });
    s = applyKey(s, { type: "char", value: "z" });
    expect(selected(s)).toBe(null);
  });
});
