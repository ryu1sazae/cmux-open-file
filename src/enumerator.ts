import { fdir } from "fdir";
import { basename } from "node:path";

const EXCLUDED_DIRS = new Set<string>([
  // VCS / deps
  ".git", "node_modules", "vendor",
  // Build outputs
  "dist", "build", "out", "target", "coverage",
  // Python
  "__pycache__", ".pytest_cache", ".venv", "venv", "env",
  // JS/TS framework & tool caches
  ".next", ".nuxt", ".svelte-kit", ".astro", ".expo",
  ".cache", ".parcel-cache", ".vite", ".turbo",
  // JVM
  ".gradle",
]);

const EXCLUDED_FILES = new Set<string>([
  ".DS_Store",
]);

export async function enumerate(root: string, limit: number): Promise<string[]> {
  const crawler = new fdir()
    .exclude((dirName) => EXCLUDED_DIRS.has(dirName))
    .filter((path) => !EXCLUDED_FILES.has(basename(path)))
    .withRelativePaths()
    .withMaxFiles(limit)
    .crawl(root);
  const files = await crawler.withPromise();
  return files.map((f) => f.replace(/\\/g, "/"));
}
