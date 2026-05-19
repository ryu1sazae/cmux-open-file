import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installFishIntegration } from "../src/install";

let fakeHome: string;
const originalHome = process.env.HOME;

beforeEach(async () => {
  fakeHome = await mkdtemp(join(tmpdir(), "fakehome-"));
  process.env.HOME = fakeHome;
});

afterEach(async () => {
  await rm(fakeHome, { recursive: true, force: true });
  process.env.HOME = originalHome;
});

describe("installFishIntegration", () => {
  test("conf.d にスニペットを作成する", async () => {
    const written = await installFishIntegration();
    expect(written).toBe(join(fakeHome, ".config/fish/conf.d/cmux-open-file.fish"));
    const content = await readFile(written, "utf-8");
    expect(content).toContain("cmux-open-file init fish | source");
  });

  test("既存ファイルは上書きする", async () => {
    await installFishIntegration();
    await installFishIntegration();
    const path = join(fakeHome, ".config/fish/conf.d/cmux-open-file.fish");
    const content = await readFile(path, "utf-8");
    expect(content).toContain("cmux-open-file init fish | source");
  });
});
