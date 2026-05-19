import { resolve, extname } from "node:path";
import { runCmux } from "./cmux";

export async function openPath(input: string): Promise<void> {
  const workspace = process.env.CMUX_WORKSPACE_ID;
  if (!workspace) {
    throw new Error("CMUX_WORKSPACE_ID 未設定: cmux のターミナル内で実行してください");
  }

  const abs = resolve(process.cwd(), input);
  const ext = extname(abs).toLowerCase();

  await runCmux([
    "new-pane",
    "--direction", "right",
    "--type", "terminal",
    "--workspace", workspace,
  ]);
  await runCmux([
    "send",
    "--workspace", workspace,
    `nvim ${shellQuote(abs)}\r`,
  ]);

  switch (ext) {
    case ".md":
      await runCmux(["markdown", "open", abs, "--focus", "false"]);
      break;
    case ".html":
    case ".htm":
      await runCmux(["browser", "open", `file://${abs}`, "--focus", "false"]);
      break;
    default:
      break;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
