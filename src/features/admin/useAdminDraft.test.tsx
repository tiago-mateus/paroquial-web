import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminDraft } from './useAdminDraft';

describe('useAdminDraft', () => {
  it('hydrates a cached value and preserves dirty entries through background updates', () => {
    const { result, rerender } = renderHook(({ server }) => useAdminDraft({ name: '' }, server), { initialProps: { server: { name: 'Paróquia' } } });
    expect(result.current.value.name).toBe('Paróquia');
    expect(result.current.dirty).toBe(false);
    act(() => result.current.setValue({ name: 'Rascunho' }));
    rerender({ server: { name: 'Atualização remota' } });
    expect(result.current.value.name).toBe('Rascunho');
    expect(result.current.dirty).toBe(true);
    act(() => result.current.commit({ name: 'Rascunho' }));
    expect(result.current.value.name).toBe('Rascunho');
    expect(result.current.dirty).toBe(false);
    rerender({ server: { name: 'Rascunho confirmado' } });
    expect(result.current.value.name).toBe('Rascunho confirmado');
  });
});
