import { execFile } from "node:child_process";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";

const STATUS_KEY = "git-local-status";
const REFRESH_INTERVAL_MS = 3000;

interface GitStatus {
  staged: number;
  modified: number;
  untracked: number;
}

function readGitStatus(cwd: string): Promise<GitStatus | undefined> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["--no-optional-locks", "status", "--porcelain=v1", "--untracked-files=normal"],
      { cwd, encoding: "utf8", timeout: 2000 },
      (error, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }

        const status: GitStatus = { staged: 0, modified: 0, untracked: 0 };
        for (const line of stdout.split("\n")) {
          if (!line) continue;
          if (line.startsWith("??")) {
            status.untracked += 1;
            continue;
          }
          if (line[0] !== " ") status.staged += 1;
          if (line[1] !== " ") status.modified += 1;
        }
        resolve(status);
      },
    );
  });
}

function formatStatus(status: GitStatus, ctx: ExtensionContext): string {
  const dirty = status.staged > 0 || status.modified > 0 || status.untracked > 0;
  return ctx.ui.theme.fg(dirty ? "warning" : "success", dirty ? "● git" : "✓ git");
}

export default function (pi: ExtensionAPI): void {
  let active = false;
  let refreshInFlight = false;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let lastStatus: string | undefined;

  async function refresh(ctx: ExtensionContext): Promise<void> {
    if (!active || refreshInFlight) return;
    refreshInFlight = true;
    try {
      const status = await readGitStatus(ctx.cwd);
      if (!active) return;
      const text = status ? formatStatus(status, ctx) : undefined;
      if (text === lastStatus) return;
      lastStatus = text;
      ctx.ui.setStatus(STATUS_KEY, text);
    } finally {
      refreshInFlight = false;
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    active = true;
    await refresh(ctx);
    refreshTimer = setInterval(() => void refresh(ctx), REFRESH_INTERVAL_MS);
    refreshTimer.unref();
  });

  pi.on("tool_execution_end", async (_event, ctx) => {
    await refresh(ctx);
  });

  pi.on("agent_settled", async (_event, ctx) => {
    await refresh(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    active = false;
    clearInterval(refreshTimer);
    refreshTimer = undefined;
    lastStatus = undefined;
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });
}
