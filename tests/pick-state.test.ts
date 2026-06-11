import { describe, test, expect } from "bun:test";
import { createState, applyKey, selected, expandQuery, deleteLastWord } from "../src/pick-state";

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

describe("expandQuery", () => {
  test("query が空 → 最初のディレクトリ階層", () => {
    expect(expandQuery("", "tests/install.test.ts")).toBe("tests/");
  });

  test("query が直前の階層 → 次の階層", () => {
    expect(expandQuery("docs/", "docs/specs/2026-05-20.md")).toBe("docs/specs/");
  });

  test("最終ファイル名階層 → フルパス", () => {
    expect(expandQuery("docs/specs/", "docs/specs/2026.md")).toBe("docs/specs/2026.md");
  });

  test("スラッシュ無しの候補 → 全体", () => {
    expect(expandQuery("", ".gitignore")).toBe(".gitignore");
  });

  test("query が prefix ではない (fuzzy 一致) → 候補の最初の階層", () => {
    expect(expandQuery("g", ".gitignore")).toBe(".gitignore");
    expect(expandQuery("install", "tests/install.test.ts")).toBe("tests/");
  });

  test("変化なしのケースは同じ文字列を返す", () => {
    expect(expandQuery("foo.md", "foo.md")).toBe("foo.md");
  });
});

describe("deleteLastWord", () => {
  test("末尾の単語を1つ削る", () => {
    expect(deleteLastWord("docs/specs/2026.md")).toBe("docs/specs/");
  });

  test("末尾が / の場合はその segment を剥がす", () => {
    expect(deleteLastWord("docs/specs/")).toBe("docs/");
  });

  test("単一セグメントは空に", () => {
    expect(deleteLastWord("docs")).toBe("");
  });

  test("空文字列はそのまま", () => {
    expect(deleteLastWord("")).toBe("");
  });
});

describe("delete-word キー (state)", () => {
  const t = ["docs/specs/2026.md", "src/cli.ts"];

  test("delete-word で末尾セグメントが消える", () => {
    let s = createState(t, 10, "docs/specs/2026.md");
    s = applyKey(s, { type: "delete-word" });
    expect(s.query).toBe("docs/specs/");
    s = applyKey(s, { type: "delete-word" });
    expect(s.query).toBe("docs/");
    s = applyKey(s, { type: "delete-word" });
    expect(s.query).toBe("");
  });
});

describe("expand キー (state)", () => {
  const t = ["docs/specs/2026-05-20.md", "src/cli.ts", ".gitignore"];

  test("空 query から Tab で先頭の '/' まで広がる", () => {
    let s = createState(t, 10);
    s = applyKey(s, { type: "expand" });
    expect(s.query).toBe("docs/");
  });

  test("Tab 連打で階層を掘り進める", () => {
    let s = createState(t, 10);
    s = applyKey(s, { type: "expand" }); // docs/
    s = applyKey(s, { type: "expand" }); // docs/specs/
    expect(s.query).toBe("docs/specs/");
    s = applyKey(s, { type: "expand" }); // docs/specs/2026-05-20.md
    expect(s.query).toBe("docs/specs/2026-05-20.md");
  });

  test("候補が空なら expand は no-op", () => {
    let s = createState([], 10);
    s = applyKey(s, { type: "expand" });
    expect(s.query).toBe("");
  });
});
