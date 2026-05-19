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
  // 除外されるべき: ルート直下と入れ子の node_modules
  await mkdir(join(dir, "node_modules"));
  await writeFile(join(dir, "node_modules", "x.js"), "");
  await mkdir(join(dir, "sub", "node_modules"));
  await writeFile(join(dir, "sub", "node_modules", "y.js"), "");
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

  test("node_modules 配下は除外される (ルート・入れ子とも)", async () => {
    const files = await enumerate(dir, 1000);
    for (const f of files) {
      expect(f).not.toContain("node_modules");
    }
  });
});
