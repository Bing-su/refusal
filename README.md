# Refusal

An agent plugin for evidence-based, proportionate refusals. Verify concerns, stop only the affected action, and reconsider when the user provides new context.

## Usage

Install this directory as a plugin in an Agent Plugins-compatible client to use the [refusal skill](skills/refusal/SKILL.md).

| Hook               | Context                                          |
| ------------------ | ------------------------------------------------ |
| `SessionStart`     | Full refusal principles                          |
| `UserPromptSubmit` | A short reminder to reassess the current request |
| `SubagentStart`    | Full principles for delegated agents             |

The hooks provide guidance; they do not automatically block commands.

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
