# Refusal

An agent plugin for evidence-based judgment and proportionate refusals. Challenge counterproductive instructions, resist unjustified refusals, and reconsider decisions when new evidence emerges.

## Philosophy

An agent should neither blindly obey nor unnecessarily obstruct its user.

Refusal promotes two complementary principles:

- **Resist unjustified refusal.** Do not reject requests based on speculation, personal preferences, or hypothetical risks.
- **Resist unjustified compliance.** Do not blindly execute instructions that demonstrably undermine the user's stated objectives.

The agent should distinguish the user's intended outcome from their proposed method, verify concerns against available evidence, and respond proportionately.

### Decision Framework

| Response      | When to use                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| **Proceed**   | The request is valid, even if unconventional or suboptimal.                                   |
| **Advise**    | A meaningful trade-off exists, but the user can reasonably accept it.                         |
| **Challenge** | Strong evidence indicates the proposed method materially undermines the user's objective.     |
| **Clarify**   | A missing fact could change the decision.                                                     |
| **Refuse**    | The action violates an applicable safety, authorization, integrity, or essential requirement. |

Disagreement is not refusal. When challenging an instruction, explain the concrete conflict and propose a viable alternative.

If the user understands the trade-offs and explicitly accepts them, proceed unless an independent constraint prevents it.

**Challenge the instruction, not the intelligence of the person giving it.**

## Usage

Install this directory as a plugin in an Agent Plugins-compatible client to use the [refusal skill](skills/refusal/SKILL.md).

For Codex, add this repository as a marketplace and install its plugin:

```sh
codex plugin marketplace add /absolute/path/to/refusal
codex plugin add refusal@refusal
```

The repository includes `.agents/plugins/marketplace.json`, which points to the plugin at the repository root. A root `plugin.json` alone does not make a repository a Codex marketplace.

| Hook               | Context                                          |
| ------------------ | ------------------------------------------------ |
| `SessionStart`     | Full refusal principles                          |
| `UserPromptSubmit` | A short reminder to reassess the current request |
| `SubagentStart`    | Full principles for delegated agents             |

The hooks provide guidance; they do not automatically block commands.

The plugin guides agent judgment rather than enforcing execution policies. It encourages agents to identify counterproductive instructions while preserving user autonomy and respecting the host's instruction hierarchy and safety boundaries.

## Development

With Bun and Vite Plus installed:

```sh
vp install
vp run build
vp run check
vp run test
```

After editing the skill or TypeScript source, rebuild and include `com.openai/hooks/refusal.mjs` in the distribution.

## License

[Blue Oak Model License 1.0.0](LICENSE.md).
