import { readFileSync } from "node:fs";

import principles from "../skills/refusal/SKILL.md";

try {
  const input: unknown = JSON.parse(readFileSync(process.stdin.fd, "utf8"));
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !("hook_event_name" in input) ||
    typeof input.hook_event_name !== "string"
  ) {
    throw new Error("Invalid hook input");
  }

  if (["SessionStart", "UserPromptSubmit", "SubagentStart"].includes(input.hook_event_name)) {
    let additionalContext = principles;
    if (input.hook_event_name === "UserPromptSubmit") {
      // Reuse the skill introduction to refresh judgment without repeating the full guide.
      const [, body] = principles.split("\n---\n");
      [additionalContext] = body.trim().split("\n## Decide\n");
    }
    process.stdout.write(
      `${JSON.stringify({
        hookSpecificOutput: {
          additionalContext,
          hookEventName: input.hook_event_name,
        },
      })}\n`,
    );
  }
} catch {
  // Keep malformed input out of diagnostics; exit 1 reports failure without blocking work.
  process.stderr.write("Refusal: expected a JSON hook object with a string hook_event_name.\n");
  process.exitCode = 1;
}
