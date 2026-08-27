# AGY discovery and handoff design

## Goal

Make the existing Antigravity adapter launch the installed AGY CLI reliably,
including installations in `~/.local/bin/agy` when that directory is absent
from `PATH`, while preserving Antigravity session discovery and live transcript
extraction.

## Design

`antigravity` remains the canonical `SessionSource`. It names the session
format and storage owned by the Antigravity application, so changing it to
`agy` would break stored indexes, CLI filters, fixtures, and existing handoff
metadata. Only executable discovery and launch arguments change.

The adapter advertises `agy` as its primary executable and `antigravity` as a
legacy fallback. The shared binary resolver checks each command name and its
user-local equivalent under `~/.local/bin`. It returns the exact executable it
found, so `spawn()` can launch an absolute path without modifying the parent
process environment. Absolute candidates are checked for executable access;
command names continue to use the platform `which`/`where` mechanism.

AGY 1.1.22 exposes `--conversation <id>` for native continuation and
`--prompt-interactive <prompt>` for an interactive handoff. The Antigravity
adapter uses those documented arguments. Generic handoff options are mapped to
AGY's own flags: auto-approval becomes `--dangerously-skip-permissions`, plan
mode becomes `--mode plan`, and model, agent, sandbox, and added workspaces are
preserved. The parser's optional live-RPC launch remains separate: on macOS it
opens the Antigravity desktop application because that application owns the
language server and encrypted transcript access.

## Compatibility and failure handling

The legacy `antigravity` executable stays as a fallback for installations that
still expose that command. PATH results take precedence for each executable,
and the modern `agy` name takes precedence over the legacy name. If neither is
available, the existing typed `ToolNotAvailableError` is raised.

No session files or Antigravity data directories are modified. Discovery of
sessions remains read-only under `~/.gemini/antigravity/` and the existing
platform-specific state database paths.

## Tests

Unit tests cover candidate ordering, PATH resolution, legacy fallback,
`~/.local/bin/agy` resolution, and AGY-specific launch arguments. The complete
Vitest suite plus `pnpm run check` verify that the generic resolver change does
not regress other adapters.
