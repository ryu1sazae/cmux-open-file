import { resolve, extname } from "node:path";
import { runCmux, parseRefs, parseSurfaceRef } from "./cmux";

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
  const { paneRef, surfaceRef } = parseRefs(newPaneOut);

  // 2. nvim をその pane の最初のサーフェス (terminal) に送信。
  //    `cmux send` は --surface を受け取るが --pane は受け取らない。
  await runCmux([
    "send",
    "--surface", surfaceRef,
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
    case ".md": {
      // cmux markdown には --pane が無いので一旦どこかに作られる surface を
      // move-surface で新ペインに引き取り、結果的に「1ペイン2タブ」にする。
      const mdOut = await runCmux(["markdown", "open", abs, "--focus", "false"]);
      const mdSurfaceRef = parseSurfaceRef(mdOut);
      await runCmux([
        "move-surface",
        "--surface", mdSurfaceRef,
        "--pane", paneRef,
        "--focus", "false",
      ]);
      break;
    }
    default:
      // nvim のみ
      break;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
