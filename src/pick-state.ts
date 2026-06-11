import { match, type MatchResult } from "./matcher";

export type Key =
  | { type: "char"; value: string }
  | { type: "backspace" }
  | { type: "delete-word" }
  | { type: "up" }
  | { type: "down" }
  | { type: "expand" };

/**
 * フォーカスしている候補に基づいて、query を「次のディレクトリ階層まで」に伸ばす。
 * - query が候補の prefix の場合: query 直後の `/` 位置までに拡張。`/` が無ければ全体まで
 * - prefix でない場合 (fuzzy で一致): 候補の最初の `/` までに置き換え。`/` が無ければ全体に
 */
export function expandQuery(query: string, focused: string): string {
  if (focused.startsWith(query)) {
    const rest = focused.substring(query.length);
    const slashIdx = rest.indexOf("/");
    if (slashIdx >= 0) {
      return focused.substring(0, query.length + slashIdx + 1);
    }
    return focused;
  }
  const slashIdx = focused.indexOf("/");
  if (slashIdx >= 0) {
    return focused.substring(0, slashIdx + 1);
  }
  return focused;
}

export type PickState = {
  readonly targets: readonly string[];
  readonly limit: number;
  readonly query: string;
  readonly matches: readonly MatchResult[];
  readonly cursor: number;
};

export function createState(
  targets: readonly string[],
  limit: number,
  initialQuery = "",
): PickState {
  return {
    targets,
    limit,
    query: initialQuery,
    matches: match(initialQuery, targets, limit),
    cursor: 0,
  };
}

export function applyKey(state: PickState, key: Key): PickState {
  switch (key.type) {
    case "char": {
      const query = state.query + key.value;
      const matches = match(query, state.targets, state.limit);
      return { ...state, query, matches, cursor: 0 };
    }
    case "backspace": {
      const query = state.query.slice(0, -1);
      const matches = match(query, state.targets, state.limit);
      return { ...state, query, matches, cursor: 0 };
    }
    case "delete-word": {
      // 末尾の "word" (英数字+一部記号) または末尾の `/` を含む直前のセグメントを削除
      const query = deleteLastWord(state.query);
      const matches = match(query, state.targets, state.limit);
      return { ...state, query, matches, cursor: 0 };
    }
    case "up":
      return { ...state, cursor: Math.max(0, state.cursor - 1) };
    case "down": {
      const last = Math.max(0, state.matches.length - 1);
      return { ...state, cursor: Math.min(last, state.cursor + 1) };
    }
    case "expand": {
      const focused = state.matches[state.cursor]?.path;
      if (!focused) return state;
      const query = expandQuery(state.query, focused);
      if (query === state.query) return state;
      const matches = match(query, state.targets, state.limit);
      return { ...state, query, matches, cursor: 0 };
    }
  }
}

export function selected(state: PickState): string | null {
  return state.matches[state.cursor]?.path ?? null;
}

/**
 * "末尾の単語を1つ削除"。例:
 *   "docs/specs/2026.md" → "docs/specs/"
 *   "docs/specs/"        → "docs/"
 *   "docs"               → ""
 */
export function deleteLastWord(s: string): string {
  if (s === "") return "";
  // 末尾の `/` は1つ削る (segment 終端マーカーを剥がす)
  let end = s.length;
  if (s[end - 1] === "/") end -= 1;
  // それより前の `/` を探して、その直後までを残す
  const lastSlash = s.lastIndexOf("/", end - 1);
  return s.substring(0, lastSlash + 1);
}
