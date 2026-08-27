# AGY Discovery and Handoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make continues-cli discover and launch AGY from PATH or `~/.local/bin/agy`, and document how AGY complements the existing Antigravity parser.

**Architecture:** Keep `antigravity` as the canonical session source while changing its launch adapter to the real `agy` command. Extend the shared binary resolver with deterministic user-local candidates, then use AGY's documented continuation and interactive-prompt flags.

**Tech Stack:** TypeScript ESM, Node.js async filesystem APIs, Vitest, Biome, pnpm.

---

### Task 1: Specify AGY binary resolution

**Files:**
- Modify: `src/__tests__/resume-binary.test.ts`
- Modify: `src/parsers/registry.ts`
- Modify: `src/utils/resume.ts`

**Step 1: Write the failing tests**

Add tests asserting that Antigravity candidates are `agy` then
`antigravity`, that `agy` wins when available, that the legacy name remains a
fallback, and that an executable under a supplied `~/.local/bin` home is
returned when PATH candidates are unavailable.

**Step 2: Run the test to verify it fails**

Run: `CI=true pnpm exec vitest run src/__tests__/resume-binary.test.ts`

Expected: FAIL because the adapter still advertises only `antigravity` and the
resolver does not generate user-local candidates.

**Step 3: Implement the minimal resolver change**

Set `binaryName: 'agy'` and `binaryFallbacks: ['antigravity']`. Add a helper
that interleaves each logical command with `<home>/.local/bin/<command>` and
teach the availability check to use async executable access for absolute paths.

**Step 4: Run the focused test**

Run: `CI=true pnpm exec vitest run src/__tests__/resume-binary.test.ts`

Expected: PASS.

### Task 2: Specify AGY launch arguments

**Files:**
- Modify: `src/__tests__/resume-binary.test.ts`
- Modify: `src/parsers/registry.ts`

**Step 1: Write the failing tests**

Assert `--conversation <session-id>` for native resume,
`--prompt-interactive <prompt>` for cross-tool handoff, and the matching display
command.

**Step 2: Run the test to verify it fails**

Run: `CI=true pnpm exec vitest run src/__tests__/resume-binary.test.ts`

Expected: FAIL against the current empty native arguments and positional prompt.

**Step 3: Implement the adapter arguments**

Update only the Antigravity registry entry with the flags exposed by `agy
--help`.

**Step 4: Run the focused test**

Run: `CI=true pnpm exec vitest run src/__tests__/resume-binary.test.ts`

Expected: PASS.

### Task 3: Document the integration

**Files:**
- Modify: `src/__tests__/forward-flags.test.ts`
- Modify: `src/parsers/registry.ts`

**Step 1: Write the failing forwarding test**

Assert that generic auto-approval, plan, sandbox, model, agent, and workspace
flags map to the corresponding AGY 1.1.22 flags.

**Step 2: Run the test to verify it fails**

Run: `CI=true pnpm exec vitest run src/__tests__/forward-flags.test.ts`

Expected: FAIL because the Antigravity adapter has no flag mapper.

**Step 3: Implement and verify the mapper**

Add an Antigravity-specific `ForwardFlagMapper`, register it on the adapter,
and rerun the focused test until it passes.

### Task 4: Document the integration

**Files:**
- Create: `docs/agy-integration.md`
- Modify: `README.md`

**Step 1: Document architecture and discovery**

Explain the distinction between the Antigravity application/session storage and
the AGY CLI, executable search order, resume/handoff commands, live RPC, data
access, environment variables, and troubleshooting commands.

**Step 2: Link the detailed guide from README**

Add a concise AGY note beside the Antigravity extraction row and a dedicated
integration subsection.

### Task 5: Verify and publish

**Files:**
- Verify all modified files

**Step 1: Remove temporary pnpm setup state**

Delete the untracked `pnpm-workspace.yaml` created only to approve the local
esbuild installation.

**Step 2: Run required verification**

Run: `CI=true pnpm test`

Expected: all active tests pass.

Run: `CI=true pnpm run check`

Expected: Biome and TypeScript build pass.

Run: `git diff --check`

Expected: no output.

**Step 3: Commit, fast-forward main, verify again, and push**

Commit the feature branch, fast-forward local `main`, repeat the focused and
required checks on the merged result, then push `main` to
`https://github.com/Guiraud/cli-continues`.
