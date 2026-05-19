#!/usr/bin/env node
import { complete } from "./complete";
import { openPath } from "./open";
import { renderFishSnippet } from "./init-fish";
import { installFishIntegration } from "./install";

const USAGE = `cmux-open-file <complete|open|init|install>

Normally invoked indirectly via the '@' key in fish shell.

  complete -- <query>  Print fuzzy-ranked path candidates (one per line) for fish completion
  open <path>          Open <path> in cmux based on its extension
  init fish            Print fish integration snippet
  install              Install fish integration to ~/.config/fish/conf.d/
`;

async function main(): Promise<void> {
  const [, , sub, ...args] = process.argv;

  switch (sub) {
    case "complete": {
      // fish の `complete -a '(cmux-open-file complete -- (commandline -ct))'` から呼ばれる。
      // 引数は "--" のあとに query 1個 (空文字も含む)。
      const dashDash = args.indexOf("--");
      const query = dashDash >= 0 ? args.slice(dashDash + 1).join(" ") : args.join(" ");
      const results = await complete(query);
      process.stdout.write(results.join("\n") + (results.length > 0 ? "\n" : ""));
      return;
    }
    case "open": {
      if (args.length === 0) {
        process.stderr.write("usage: cmux-open-file open <path>\n");
        process.exit(1);
      }
      await openPath(args[0]);
      return;
    }
    case "init": {
      if (args[0] !== "fish") {
        process.stderr.write("usage: cmux-open-file init fish\n");
        process.exit(1);
      }
      process.stdout.write(renderFishSnippet());
      return;
    }
    case "install": {
      const path = await installFishIntegration();
      process.stderr.write(
        `cmux-open-file: installed fish integration at ${path}\n` +
        `Restart fish or open a new shell to activate.\n`
      );
      return;
    }
    case "-h":
    case "--help":
    case "help":
      process.stdout.write(USAGE);
      return;
    default:
      process.stderr.write(USAGE);
      process.exit(1);
  }
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
});
