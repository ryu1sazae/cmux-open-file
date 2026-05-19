export type SpawnResult = { exitCode: number; stderr: string };
export type Spawner = (cmd: string, args: string[]) => Promise<SpawnResult>;

const defaultSpawner: Spawner = async (cmd, args) => {
  const proc = Bun.spawn([cmd, ...args], { stderr: "pipe", stdout: "inherit" });
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stderr };
};

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
