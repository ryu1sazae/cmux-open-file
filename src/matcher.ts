import fuzzysort from "fuzzysort";

export type MatchResult = {
  path: string;
  indexes: readonly number[];
};

export function match(query: string, targets: readonly string[], limit: number): MatchResult[] {
  if (query === "") {
    return targets.slice(0, limit).map((path) => ({ path, indexes: [] }));
  }
  const results = fuzzysort.go(query, targets as string[], { limit });
  return results.map((r) => ({
    path: r.target,
    indexes: [...r.indexes],
  }));
}
