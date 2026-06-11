# cmux-open-file

fish 上で `@` を押すとファイル fuzzy ピッカーが起動し、選んだファイルを cmux に拡張子別レイアウトで開く個人用 CLI。

## Requirements

- macOS
- [fish](https://fishshell.com/) 3.x
- [cmux](https://cmux.app/)
- Node.js 18+
- `nvim` が `PATH` にあること

## Install

```bash
npm install -g cmux-open-file
```

`~/.config/fish/conf.d/cmux-open-file.fish` が自動配置される。fish を再起動するか新しいタブを開けば有効化される。

## Usage

fish のコマンドラインが空のときに `@` を押すと、プロンプトのすぐ下に fuzzy ピッカーがインラインで起動する。既に `@ xxx` を編集中の状態で `@` を押すと、`xxx` を初期クエリにしてピッカーが再起動する。

| キー | 動作 |
|---|---|
| 文字入力 | インクリメンタル fuzzy 検索（毎キー即時更新） |
| ↑ / ↓ / Ctrl+P / Ctrl+N | 候補移動 |
| Tab / → | フォーカス候補の次のディレクトリ階層まで query を補完（例: `docs/specs/2026.md` フォーカス時に `docs/` → `docs/specs/` → フルパスと連打で掘れる） |
| Enter | 確定して fish に `@ <path>` を挿入 |
| Backspace | query を1文字削除。query が空のときは picker を抜けて `@` も削除 |
| Ctrl+U (= Cmd+Backspace) | ピッカーを抜けて commandline を全消去（`@` も消える） |
| Ctrl+W / Option+Backspace | query の末尾セグメントを削除 |
| Esc / Ctrl+C | キャンセル |

確定すると fish が `@ <path>` を実行し、`@` を実行したペインにサーフェスが追加される（新しいペインは作らない）。タブ順は「プレビュー左 / nvim 右」:

- `.md` → markdown プレビュー + nvim
- `.html` → ブラウザ + nvim
- その他 → nvim のみ

検索対象から以下は除外される（隠しファイルは含む）:

- VCS / 依存: `.git`, `node_modules`, `vendor`
- ビルド成果物: `dist`, `build`, `out`, `target`, `coverage`
- Python: `__pycache__`, `.pytest_cache`, `.venv`, `venv`, `env`
- JS/TS フレームワーク・キャッシュ: `.next`, `.nuxt`, `.svelte-kit`, `.astro`, `.expo`, `.cache`, `.parcel-cache`, `.vite`, `.turbo`
- JVM: `.gradle`
- macOS メタデータ: `.DS_Store`

## Uninstall

```bash
npm uninstall -g cmux-open-file
rm ~/.config/fish/conf.d/cmux-open-file.fish
```

## License

MIT
