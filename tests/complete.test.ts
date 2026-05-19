import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { complete } from "../src/complete";

let dir: string;
const originalCwd = process.cwd();

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "complete-test-"));
  await writeFile(join(dir, "foo.md"), "");
  await writeFile(join(dir, "bar.ts"), "");
  await writeFile(join(dir, "baz-foo.md"), "");
});

beforeEach(() => {
  process.chdir(dir);
});

afterAll(async () => {
  process.chdir(originalCwd);
  await rm(dir, { recursive: true, force: true });
});

describe("complete", () => {
  test("空クエリで全件返す", async () => {
    const r = await complete("");
    expect(r).toContain("foo.md");
    expect(r).toContain("bar.ts");
    expect(r).toContain("baz-foo.md");
  });

  test("クエリにマッチするものだけ返す", async () => {
    const r = await complete("foo");
    expect(r).toContain("foo.md");
    expect(r).toContain("baz-foo.md");
    expect(r).not.toContain("bar.ts");
  });

  test("fuzzy ランクで完全一致がトップ", async () => {
    const r = await complete("foo");
    expect(r[0]).toBe("foo.md");
  });
});
