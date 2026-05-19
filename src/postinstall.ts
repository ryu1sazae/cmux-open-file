import { installFishIntegration } from "./install";

async function main(): Promise<void> {
  // Only run during global install, not local dev install
  if (process.env.npm_config_global !== "true") {
    return;
  }
  try {
    const path = await installFishIntegration();
    process.stderr.write(`cmux-open-file: fish integration installed at ${path}\n`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`cmux-open-file: postinstall failed: ${msg}\n`);
    // Never fail the npm install itself.
  }
}

main();
