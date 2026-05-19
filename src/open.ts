import { resolve, extname } from "node:path";
import { runCmux, parsePaneRef } from "./cmux";

export async function openPath(input: string): Promise<void> {
  const workspace = process.env.CMUX_WORKSPACE_ID;
  if (!workspace) {
    throw new Error("CMUX_WORKSPACE_ID 未設定: cmux のターミナル内で実行してください");
  }

  const abs = resolve(process.cwd(), input);
  const ext = extname(abs).toLowerCase();

  // 1. 新ペインを fish タブの右に作成 (terminal タイプ)。最初のサーフェスは nvim 用。
  const newPaneOut = await runCmux([
    "new-pane",
    "--direction", "right",
    "--type", "terminal",
    "--workspace", workspace,
    "--focus", "false",
  ]);
  const paneRef = parsePaneRef(newPaneOut);

  // 2. nvim をその pane に送信
  await runCmux([
    "send",
    "--pane", paneRef,
    `nvim ${shellQuote(abs)}\r`,
  ]);

  // 3. 同じ pane に 2 つ目のサーフェス (プレビュー用) を追加
  switch (ext) {
    case ".html":
    case ".htm":
      await runCmux([
        "new-surface",
        "--type", "browser",
        "--pane", paneRef,
        "--url", `file://${abs}`,
        "--focus", "false",
      ]);
      break;
    case ".md":
      // cmux の markdown ビューアは pane 配置を制御できないため別位置に出る。
      // live reload 付きの内蔵ビューアを優先し、要件「1ペイン2タブ」は妥協。
      await runCmux(["markdown", "open", abs, "--focus", "false"]);
      break;
    default:
      // nvim のみ
      break;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
