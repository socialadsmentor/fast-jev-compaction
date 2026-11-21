import { describe, expect, it, vi } from 'vitest';
import { register } from '../hooks/fast-jev.js';

// Captures the session.compact hook so it can be driven without an engine.
function compactHook() {
  const hooks: Record<string, any> = {};
  register(((name: string, fn: any) => {
    hooks[name] = fn;
  }) as any, {} as any);
  return hooks['session.compact'];
}

function fakeDollar() {
  return {
    ui: { log: vi.fn(), toast: vi.fn() },
    env: { get: async () => undefined },
    settings: { read: async () => ({}) },
    http: { fetch: vi.fn() },
  };
}

describe('session.compact notifications', () => {
  it('hands subagent compactions to the built-in summary, without a toast or a Jev call', async () => {
    const $ = fakeDollar();
    const next = vi.fn(async () => 'builtin');
    const out = await compactHook()($, { agentId: 'a1', messages: [], trigger: 'auto' }, next);
    expect(out).toBe('builtin');
    expect(next).toHaveBeenCalledOnce();
    expect($.http.fetch).not.toHaveBeenCalled();
    expect($.ui.toast).not.toHaveBeenCalled();
  });

  it('toasts only when the main session hits an error (here: no API key)', async () => {
    const $ = fakeDollar();
    const next = vi.fn(async () => 'builtin');
    await compactHook()($, { messages: [], trigger: 'auto' }, next);
    expect(next).toHaveBeenCalledOnce();
    expect($.ui.toast).toHaveBeenCalledOnce();
    expect($.ui.toast.mock.calls[0][0]).toMatch(/^Fast Jev error: /);
  });
});
