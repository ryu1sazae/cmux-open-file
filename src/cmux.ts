import { spawn } from "node:child_process";

export type SpawnResult = { exitCode: number; stdout: string; stderr: string };
export type Spawner = (cmd: string, args: string[]) => Promise<SpawnResult>;

const defaultSpawner: Spawner = (cmd, args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });

let spawner: Spawner = defaultSpawner;

export function setSpawner(s: Spawner): void {
  spawner = s;
}

export function resetSpawner(): void {
  spawner = defaultSpawner;
}

export async function runCmux(args: string[]): Promise<string> {
  const { exitCode, stdout, stderr } = await spawner("cmux", args);
  if (exitCode !== 0) {
    throw new Error(`cmux ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return stdout;
}

// cmux のペイン参照は2形式:
//  - short ref:  "pane:29"            (例: `cmux new-pane` の OK 行)
//  - key=value:  "pane=pane:29"       (例: 一部サブコマンドの構造化出力)
//  - UUID:       "pane=<uuid>"        (--id-format uuids 指定時)
const SHORT_REF_RE = /\bpane:[A-Za-z0-9_-]+/;
const KV_REF_RE = /\bpane=([A-Za-z0-9_:-]+)/;

export function parsePaneRef(output: string): string {
  const short = SHORT_REF_RE.exec(output);
  if (short) return short[0];
  const kv = KV_REF_RE.exec(output);
  if (kv) return kv[1];
  throw new Error(`cmux output did not contain a pane ref: ${output.trim()}`);
}
