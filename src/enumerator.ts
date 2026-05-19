import { fdir } from "fdir";

export async function enumerate(root: string, limit: number): Promise<string[]> {
  const crawler = new fdir()
    .withRelativePaths()
    .withMaxFiles(limit)
    .crawl(root);
  const files = await crawler.withPromise();
  return files.map((f) => f.replace(/\\/g, "/"));
}
