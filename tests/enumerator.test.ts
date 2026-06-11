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
  // 除外されるべきディレクトリ群
  for (const d of ["node_modules", "dist", "build", "out", "target", "coverage",
                   "__pycache__", ".pytest_cache", ".venv", "venv",
                   ".next", ".cache", ".turbo", "vendor", ".gradle"]) {
    await mkdir(join(dir, d));
    await writeFile(join(dir, d, "x.js"), "");
  }
  // 入れ子の node_modules も除外される
  await mkdir(join(dir, "sub", "node_modules"));
  await writeFile(join(dir, "sub", "node_modules", "y.js"), "");
  // .DS_Store ファイルは除外される
  await writeFile(join(dir, ".DS_Store"), "");
  await writeFile(join(dir, "sub", ".DS_Store"), "");
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

  test("隠しファイルは含む (除外リスト外のもの)", async () => {
    const files = await enumerate(dir, 1000);
    expect(files).toContain(".hidden");
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

  test(".git 配下も除外される", async () => {
    const files = await enumerate(dir, 1000);
    expect(files).not.toContain(".git/config");
  });

  test("dist/build/out/target/coverage などのビルド成果物ディレクトリは除外", async () => {
    const files = await enumerate(dir, 1000);
    for (const d of ["dist", "build", "out", "target", "coverage"]) {
      expect(files).not.toContain(`${d}/x.js`);
    }
  });

  test("Python と JS フレームワークのキャッシュも除外", async () => {
    const files = await enumerate(dir, 1000);
    for (const d of ["__pycache__", ".pytest_cache", ".venv", "venv",
                     ".next", ".cache", ".turbo", "vendor", ".gradle"]) {
      expect(files).not.toContain(`${d}/x.js`);
    }
  });

  test(".DS_Store は除外される", async () => {
    const files = await enumerate(dir, 1000);
    expect(files).not.toContain(".DS_Store");
    expect(files).not.toContain("sub/.DS_Store");
  });
});
