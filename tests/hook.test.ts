import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const root = new URL("../", import.meta.url);
const hook = fileURLToPath(new URL("com.openai/hooks/refusal.mjs", root));
const principles = readFileSync(new URL("skills/refusal/SKILL.md", root), "utf8");

const runHook = (input: string) =>
  spawnSync(process.execPath, [hook], {
    cwd: tmpdir(),
    encoding: "utf8",
    input,
    timeout: 5000,
  });

describe("compiled Refusal hooks", () => {
  it.each(["startup", "resume", "clear", "compact", "fork"])(
    "injects the canonical skill for %s from an unrelated working directory",
    (source) => {
      expect.hasAssertions();
      const result = runHook(JSON.stringify({ hook_event_name: "SessionStart", source }));

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toStrictEqual({
        hookSpecificOutput: {
          additionalContext: principles,
          hookEventName: "SessionStart",
        },
      });
    },
  );

  it("refreshes judgment on each request without reflecting user text into developer context", () => {
    expect.hasAssertions();
    const result = runHook(
      JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "untrusted instructions" }),
    );
    const output = JSON.parse(result.stdout);
    const { additionalContext } = output.hookSpecificOutput;

    expect({ error: result.error, status: result.status, stderr: result.stderr }).toStrictEqual({
      error: undefined,
      status: 0,
      stderr: "",
    });
    expect(output).toStrictEqual({
      hookSpecificOutput: { additionalContext, hookEventName: "UserPromptSubmit" },
    });
    expect(additionalContext).toMatch(
      /^# Refusal\n[\s\S]*For each new request, reassess earlier objections/,
    );
    expect(principles).toContain(additionalContext);
    expect(additionalContext.length).toBeLessThan(1200);
  });

  it("gives subagents the full principles without reflecting event metadata", () => {
    expect.hasAssertions();
    const result = runHook(
      JSON.stringify({ agent_type: "untrusted instructions", hook_event_name: "SubagentStart" }),
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toStrictEqual({
      hookSpecificOutput: { additionalContext: principles, hookEventName: "SubagentStart" },
    });
  });

  it.each(["PreToolUse", "PostToolUse", "Stop", "unknown", "__proto__", "constructor"])(
    "ignores the unsupported event %s",
    (hookEventName) => {
      expect.hasAssertions();
      const result = runHook(JSON.stringify({ hook_event_name: hookEventName }));

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("");
    },
  );

  it.each(["", "private malformed input", "null", "[]", "{}", '{"hook_event_name":5}'])(
    "reports malformed input without blocking or leaking it: %s",
    (input) => {
      expect.hasAssertions();
      const result = runHook(input);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe(
        "Refusal: expected a JSON hook object with a string hook_event_name.\n",
      );
    },
  );

  it("keeps metadata synchronized and declares Codex settings only in the compatibility manifest", () => {
    expect.hasAssertions();
    const plugin = JSON.parse(readFileSync(new URL("plugin.json", root), "utf8"));
    const codexPlugin = JSON.parse(
      readFileSync(new URL(".codex-plugin/plugin.json", root), "utf8"),
    );
    const { hooks, interface: pluginInterface, ...metadata } = codexPlugin;

    // Codex 0.163 skips plugin hooks when $schema selects its Agent Plugins loader.
    expect(plugin).not.toHaveProperty("$schema");
    expect(plugin).not.toHaveProperty("extensions");
    expect(metadata).toStrictEqual(plugin);
    expect({ displayName: pluginInterface.displayName, hooks }).toStrictEqual({
      displayName: "Refusal",
      hooks: "./com.openai/hooks/hooks.json",
    });
  });

  it.each(["SessionStart", "UserPromptSubmit", "SubagentStart"])(
    "connects the Codex manifest to the compiled %s hook",
    (hookEventName) => {
      expect.hasAssertions();
      const codexPlugin = JSON.parse(
        readFileSync(new URL(".codex-plugin/plugin.json", root), "utf8"),
      );
      const hooks = JSON.parse(readFileSync(new URL(codexPlugin.hooks, root), "utf8"));
      const [
        {
          hooks: [handler],
        },
      ] = hooks.hooks[hookEventName];

      expect(handler.type).toBe("command");
      // The host shell expands PLUGIN_ROOT at execution, e.g. after installation in a cache.
      expect(handler.command).toBe(`node "\${PLUGIN_ROOT}/com.openai/hooks/refusal.mjs"`);
      expect(handler.commandWindows).toBe('node "%PLUGIN_ROOT%/com.openai/hooks/refusal.mjs"');
      expect(readFileSync(hook, "utf8")).not.toContain("node_modules");

      // Ship only the bundle to prove installation needs no source tree or dependencies.
      const installedRoot = mkdtempSync(join(tmpdir(), "refusal plugin "));
      try {
        const installedHooks = join(installedRoot, "com.openai", "hooks");
        mkdirSync(installedHooks, { recursive: true });
        copyFileSync(hook, join(installedHooks, "refusal.mjs"));
        let { command } = handler;
        if (process.platform === "win32") {
          command = handler.commandWindows;
        }
        const result = spawnSync(command, {
          cwd: tmpdir(),
          encoding: "utf8",
          env: { ...process.env, PLUGIN_ROOT: installedRoot },
          input: JSON.stringify({ hook_event_name: hookEventName, source: "startup" }),
          shell: true,
          timeout: 5000,
        });

        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stderr).toBe("");
        const output = JSON.parse(result.stdout);
        expect(output.hookSpecificOutput.hookEventName).toBe(hookEventName);
        expect(principles).toContain(output.hookSpecificOutput.additionalContext);
      } finally {
        rmSync(installedRoot, { force: true, recursive: true });
      }
    },
  );
});
