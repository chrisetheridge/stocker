import { describe, expect, it, vi } from 'vitest';

import { withSqliteBusyRetry } from './helpers';

describe('withSqliteBusyRetry', () => {
  it('retries SQLITE_BUSY errors before succeeding', async () => {
    const operation = vi.fn(async () => {
      if (operation.mock.calls.length < 3) {
        throw { code: 'SQLITE_BUSY', rawCode: 5 };
      }

      return 'ok';
    });

    await expect(withSqliteBusyRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not swallow non-lock errors', async () => {
    await expect(
      withSqliteBusyRetry(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
