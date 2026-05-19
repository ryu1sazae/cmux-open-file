import { match, type MatchResult } from "./matcher";

export type Key =
  | { type: "char"; value: string }
  | { type: "backspace" }
  | { type: "up" }
  | { type: "down" };

export type PickState = {
  readonly targets: readonly string[];
  readonly limit: number;
  readonly query: string;
  readonly matches: readonly MatchResult[];
  readonly cursor: number;
};

export function createState(targets: readonly string[], limit: number): PickState {
  return {
    targets,
    limit,
    query: "",
    matches: match("", targets, limit),
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
    case "up":
      return { ...state, cursor: Math.max(0, state.cursor - 1) };
    case "down": {
      const last = Math.max(0, state.matches.length - 1);
      return { ...state, cursor: Math.min(last, state.cursor + 1) };
    }
  }
}

export function selected(state: PickState): string | null {
  return state.matches[state.cursor]?.path ?? null;
}
