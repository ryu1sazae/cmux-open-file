import { describe, test, expect } from "bun:test";
import { match } from "../src/matcher";

describe("match", () => {
  test("空クエリでは入力順を保つ", () => {
    const r = match("", ["foo.md", "bar.md", "baz.md"], 10);
    expect(r.map((x) => x.path)).toEqual(["foo.md", "bar.md", "baz.md"]);
  });

  test("完全一致がトップに来る", () => {
    const r = match("foo", ["zfoo.md", "foo.md", "foobar.md"], 10);
    expect(r[0].path).toBe("foo.md");
  });

  test("離散一致もヒットする", () => {
    const r = match("abc", ["a-b-c.md", "xyz.md"], 10);
    const paths = r.map((x) => x.path);
    expect(paths).toContain("a-b-c.md");
    expect(paths).not.toContain("xyz.md");
  });

  test("limit で打ち切る", () => {
    const targets = Array.from({ length: 100 }, (_, i) => `file${i}.md`);
    const r = match("file", targets, 10);
    expect(r.length).toBe(10);
  });

  test("マッチ位置を返す", () => {
    const r = match("ab", ["axb.md"], 10);
    expect(r[0].indexes).toEqual([0, 2]);
  });
});
