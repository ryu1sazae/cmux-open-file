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

fish のコマンドラインが空のときに `@` を押すとピッカーが起動する。

| キー | 動作 |
|---|---|
| 文字入力 | インクリメンタル fuzzy 検索 |
| ↑ / ↓ (or Ctrl+P / Ctrl+N) | 候補移動 |
| Tab / → / Enter | 確定 → fish に `@<path>` が挿入される |
| Esc / Ctrl+C | キャンセル |

fish のコマンドラインが `@<path>` の状態で Enter を押すと、cmux の同じワークスペース内に右方向へペインが展開される。

- `.md` → nvim + markdown プレビュー
- `.html` → nvim + ブラウザ
- その他 → nvim のみ

## Uninstall

```bash
npm uninstall -g cmux-open-file
rm ~/.config/fish/conf.d/cmux-open-file.fish
```

## License

MIT
