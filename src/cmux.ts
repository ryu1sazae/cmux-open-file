import { spawn } from "node:child_process";

export type SpawnResult = { exitCode: number; stderr: string };
export type Spawner = (cmd: string, args: string[]) => Promise<SpawnResult>;

const defaultSpawner: Spawner = (cmd, args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "inherit", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 0, stderr });
    });
  });

let spawner: Spawner = defaultSpawner;

export function setSpawner(s: Spawner): void {
  spawner = s;
}

export function resetSpawner(): void {
  spawner = defaultSpawner;
}

export async function runCmux(args: string[]): Promise<void> {
  const { exitCode, stderr } = await spawner("cmux", args);
  if (exitCode !== 0) {
    throw new Error(`cmux ${args.join(" ")} failed: ${stderr.trim()}`);
  }
}
