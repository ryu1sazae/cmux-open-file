import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enumerate } from "../src/enumerator";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "enum-test-"));
  await writeFile(join(dir, "a.md"), "");
  await writeFile(join(dir, ".hidden"), "");
  await mkdir(join(dir, "sub"));
  await writeFile(join(dir, "sub", "b.ts"), "");
  await mkdir(join(dir, ".git"));
  await writeFile(join(dir, ".git", "config"), "");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("enumerate", () => {
  test("通常ファイルとサブディレクトリを再帰列挙する", async () => {
    const files = await enumerate(dir, 1000);
    expect(files).toContain("a.md");
    expect(files).toContain("sub/b.ts");
  });

  test("隠しファイルも含む", async () => {
    const files = await enumerate(dir, 1000);
    expect(files).toContain(".hidden");
    expect(files).toContain(".git/config");
  });

  test("limit で打ち切る", async () => {
    const files = await enumerate(dir, 2);
    expect(files.length).toBeLessThanOrEqual(2);
  });

  test("相対パスを返す", async () => {
    const files = await enumerate(dir, 1000);
    for (const f of files) {
      expect(f.startsWith("/")).toBe(false);
    }
  });
});
