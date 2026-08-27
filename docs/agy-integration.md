# AGY and Antigravity integration

`continues` uses the canonical source name `antigravity` for Antigravity
sessions, while it launches those sessions through the modern `agy` CLI. The
two names describe different parts of the same integration:

- **Antigravity** owns persisted conversations, brain artifacts, IDE state,
  and the optional live language-server RPC.
- **AGY** is the command-line client used as a handoff target and to continue a
  known Antigravity conversation.

Keeping `antigravity` as the source name preserves existing indexes, filters,
handoff metadata, and commands such as `continues list --source antigravity`.

## Executable discovery

For an Antigravity target, `continues` checks executable candidates in this
order:

1. `agy` on `PATH`
2. `~/.local/bin/agy`
3. the legacy `antigravity` command on `PATH`
4. `~/.local/bin/antigravity`

The user-local lookup is useful for installers that place AGY in
`~/.local/bin` without updating the environment inherited by GUI applications.
The home directory is resolved at runtime; no username or machine-specific
absolute path is embedded in the package.

Absolute local candidates must exist and be executable. Named candidates use
the platform command lookup (`which` on Unix-like systems and `where` on
Windows).

## Resume and handoff commands

AGY 1.1.22 exposes dedicated flags for both flows:

```text
# Native resume of an Antigravity conversation
agy --conversation <conversation-id>

# Cross-tool handoff into a new interactive AGY session
agy --prompt-interactive <handoff-prompt>
```

`continues antigravity` and a native `continues resume <id>` use the first
form. `continues resume <id> --in antigravity` uses the second form after
building and saving `.continues-handoff.md`.

Forwarded options are translated to AGY's CLI contract:

| Generic continues option | AGY argument |
|:-------------------------|:-------------|
| `--yolo`, `--allow-all`, `--force`, `--full-auto` | `--dangerously-skip-permissions` |
| `--plan` or a plan approval/mode | `--mode plan` |
| `--sandbox` | `--sandbox` |
| `--model <name>` | `--model <name>` |
| `--agent <name>` | `--agent <name>` |
| `--add-dir <path>` / `--include-directories <path>` | `--add-dir <path>` |

Unsupported approval values are removed with a warning instead of being sent
to AGY as invalid flags. Unknown options remain normal passthrough arguments.

## Session extraction

Session discovery remains read-only. The parser combines the available
Antigravity surfaces:

- conversation protobuf files, brain artifacts, and code-tracker data under
  `~/.gemini/antigravity/` by default;
- the platform Antigravity `state.vscdb` database for conversation metadata;
- an optional local language-server RPC for live steps and richer transcript
  content.

Useful environment variables:

| Variable | Purpose |
|:---------|:--------|
| `ANTIGRAVITY_HOME` | Override the Antigravity data root |
| `ANTIGRAVITY_STATE_DB` | Override the state database path |
| `GEMINI_CLI_HOME` | Influence fallback storage resolution |
| `ANTIGRAVITY_DISABLE_RPC=1` | Disable live RPC discovery and launch |
| `CONTINUES_LAUNCH_ANTIGRAVITY=0` | Never auto-launch the desktop application |
| `CONTINUES_LAUNCH_ANTIGRAVITY=1` | Allow auto-launch even outside an interactive TTY |

Persisted conversation protobufs may be encrypted. When the live language
server is unavailable, `continues` falls back to readable brain artifacts such
as plans and walkthroughs and records the reduced transcript fidelity in the
handoff metadata. On macOS, optional auto-launch opens the **Antigravity desktop
application**, not the AGY CLI, because the desktop language server owns live
transcript access.

## Verification and troubleshooting

Check the installation and discovery path:

```bash
command -v agy
agy --version
continues list --source antigravity
```

Inspect the generated handoff without launching AGY:

```bash
continues resume <session-id> --in antigravity --debug-prompt
```

If `agy` is executable at `~/.local/bin/agy`, no PATH change is required for
`continues`. If sessions are missing, use `continues scan --rebuild` and verify
the Antigravity storage paths separately from executable discovery.

The `antigravity` executable fallback is intended for older installations that
package an AGY-compatible CLI under the legacy command name.
