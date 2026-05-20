import { resolve, extname } from "node:path";
import { runCmux, parseSurfaceRef } from "./cmux";

export async function openPath(input: string): Promise<void> {
  const workspace = process.env.CMUX_WORKSPACE_ID;
  if (!workspace) {
    throw new Error("CMUX_WORKSPACE_ID 未設定: cmux のターミナル内で実行してください");
  }

  const abs = resolve(process.cwd(), input);
  const ext = extname(abs).toLowerCase();

  // 1. 呼び出し元 (fish) が属する pane を取得。
  //    `cmux identify` の出力は JSON で、caller.pane_ref に現在のペインがある
  //    (実機サンプルで確認済み)。
  const identifyOut = await runCmux(["identify"]);
  const paneRef = parseCallerPaneRef(identifyOut);

  // 2. 現ペインに nvim 用 terminal サーフェスを追加 (新しいペインは作らない)
  const nvimOut = await runCmux([
    "new-surface",
    "--type", "terminal",
    "--pane", paneRef,
    "--workspace", workspace,
    "--focus", "false",
  ]);
  const nvimSurfaceRef = parseSurfaceRef(nvimOut);

  // 3. その nvim サーフェスに `nvim <path>` を送信
  await runCmux([
    "send",
    "--surface", nvimSurfaceRef,
    `nvim ${shellQuote(abs)}\r`,
  ]);

  // 4. プレビュー用サーフェスを同じペインに追加。
  //    タブ順は「プレビュー左 / nvim 右」になるよう --before nvim で並べる。
  switch (ext) {
    case ".html":
    case ".htm": {
      const htmlOut = await runCmux([
        "new-surface",
        "--type", "browser",
        "--pane", paneRef,
        "--url", `file://${abs}`,
        "--focus", "false",
      ]);
      const htmlSurfaceRef = parseSurfaceRef(htmlOut);
      await runCmux([
        "reorder-surface",
        "--surface", htmlSurfaceRef,
        "--before", nvimSurfaceRef,
        "--focus", "false",
      ]);
      break;
    }
    case ".md": {
      const mdOut = await runCmux(["markdown", "open", abs, "--focus", "false"]);
      const mdSurfaceRef = parseSurfaceRef(mdOut);
      await runCmux([
        "move-surface",
        "--surface", mdSurfaceRef,
        "--pane", paneRef,
        "--before", nvimSurfaceRef,
        "--focus", "false",
      ]);
      break;
    }
    default:
      // nvim のみ
      break;
  }
}

function parseCallerPaneRef(identifyJson: string): string {
  const parsed = JSON.parse(identifyJson) as { caller?: { pane_ref?: string } };
  const ref = parsed.caller?.pane_ref;
  if (!ref) {
    throw new Error(`cmux identify did not return caller.pane_ref: ${identifyJson.trim()}`);
  }
  return ref;
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
