import { fdir } from "fdir";

const EXCLUDED_DIRS = new Set(["node_modules"]);

export async function enumerate(root: string, limit: number): Promise<string[]> {
  const crawler = new fdir()
    .exclude((dirName) => EXCLUDED_DIRS.has(dirName))
    .withRelativePaths()
    .withMaxFiles(limit)
    .crawl(root);
  const files = await crawler.withPromise();
  return files.map((f) => f.replace(/\\/g, "/"));
}
