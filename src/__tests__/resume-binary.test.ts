import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { adapters } from '../parsers/registry.js';
import type { UnifiedSession } from '../types/index.js';
import { getToolBinaryCandidates, resolveToolBinaryName } from '../utils/resume.js';

const antigravitySession: UnifiedSession = {
  id: 'conversation-123',
  source: 'antigravity',
  cwd: '/tmp/project',
  lines: 1,
  bytes: 1,
  createdAt: new Date('2026-08-27T00:00:00Z'),
  updatedAt: new Date('2026-08-27T00:00:00Z'),
  originalPath: '/tmp/conversation-123.pb',
};

describe('tool binary resolution', () => {
  it('prefers cursor-agent with agent as fallback', () => {
    expect(getToolBinaryCandidates('cursor')).toEqual(['cursor-agent', 'agent']);
  });

  it('chooses cursor-agent when it is available', async () => {
    const binaryName = await resolveToolBinaryName('cursor', async (candidate) => candidate === 'cursor-agent');

    expect(binaryName).toBe('cursor-agent');
  });

  it('falls back to agent when cursor-agent is unavailable', async () => {
    const binaryName = await resolveToolBinaryName('cursor', async (candidate) => candidate === 'agent');

    expect(binaryName).toBe('agent');
  });

  it('returns null when no cursor binary is available', async () => {
    const binaryName = await resolveToolBinaryName('cursor', async () => false);

    expect(binaryName).toBeNull();
  });

  it('prefers the AGY CLI and keeps the legacy antigravity command as fallback', () => {
    expect(getToolBinaryCandidates('antigravity')).toEqual(['agy', 'antigravity']);
  });

  it('chooses agy when both Antigravity commands are available', async () => {
    const binaryName = await resolveToolBinaryName('antigravity', async (candidate) =>
      ['agy', 'antigravity'].includes(candidate),
    );

    expect(binaryName).toBe('agy');
  });

  it('falls back to the legacy antigravity command', async () => {
    const binaryName = await resolveToolBinaryName('antigravity', async (candidate) => candidate === 'antigravity');

    expect(binaryName).toBe('antigravity');
  });

  it('discovers agy in the user local bin directory when it is absent from PATH', async () => {
    const localAgy = path.join(os.homedir(), '.local', 'bin', 'agy');
    const checked: string[] = [];
    const binaryName = await resolveToolBinaryName('antigravity', async (candidate) => {
      checked.push(candidate);
      return candidate === localAgy;
    });

    expect(binaryName).toBe(localAgy);
    expect(checked).toEqual(['agy', localAgy]);
  });

  it('uses AGY conversation and interactive prompt arguments', () => {
    expect(adapters.antigravity.nativeResumeArgs(antigravitySession)).toEqual(['--conversation', 'conversation-123']);
    expect(adapters.antigravity.crossToolArgs('Continue from this handoff', '/tmp/project')).toEqual([
      '--prompt-interactive',
      'Continue from this handoff',
    ]);
    expect(adapters.antigravity.resumeCommandDisplay(antigravitySession)).toBe('agy --conversation conversation-123');
  });
});
