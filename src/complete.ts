import { enumerate } from "./enumerator";
import { match } from "./matcher";

const ENUMERATE_LIMIT = 100_000;
const RESULT_LIMIT = 50;

/**
 * fish の dynamic completion 用に、現在の cwd 配下のファイルを fuzzy 検索して
 * 候補を返す。返り値は呼び出し側でそのまま stdout に流すこと（改行区切り）。
 */
export async function complete(query: string): Promise<string[]> {
  const targets = await enumerate(process.cwd(), ENUMERATE_LIMIT);
  return match(query, targets, RESULT_LIMIT).map((m) => m.path);
}
