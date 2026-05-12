import {
  apiFetch,
  getApiBaseUrl,
  getBearerToken,
  setBearerToken,
} from './api';

describe('getApiBaseUrl', () => {
  it('returns a non-empty string URL', () => {
    const base = getApiBaseUrl();
    expect(typeof base).toBe('string');
    expect(base.length).toBeGreaterThan(0);
    expect(base).toMatch(/^https?:\/\//);
  });
});

describe('getBearerToken / setBearerToken', () => {
  const KEY = 'roommatch_bearer_token';

  beforeEach(() => {
    delete process.env.REACT_APP_DEV_BEARER_TOKEN;
    window.localStorage.removeItem(KEY);
  });

  it('prefers REACT_APP_DEV_BEARER_TOKEN when set', () => {
    process.env.REACT_APP_DEV_BEARER_TOKEN = '  env-token  ';
    expect(getBearerToken()).toBe('env-token');
    delete process.env.REACT_APP_DEV_BEARER_TOKEN;
  });

  it('reads trimmed token from localStorage', () => {
    window.localStorage.setItem(KEY, '  abc  ');
    expect(getBearerToken()).toBe('abc');
  });

  it('returns empty string when no token', () => {
    expect(getBearerToken()).toBe('');
  });

  it('setBearerToken stores and returns normalized token', () => {
    expect(setBearerToken('  x  ')).toBe('x');
    expect(window.localStorage.getItem(KEY)).toBe('x');
  });

  it('setBearerToken clears storage when empty', () => {
    window.localStorage.setItem(KEY, 'keep');
    expect(setBearerToken('')).toBe('');
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('setBearerToken tolerates storage errors', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => setBearerToken('t')).not.toThrow();
    expect(setBearerToken('t')).toBe('t');
    spy.mockRestore();
  });
});

describe('apiFetch', () => {
  beforeEach(() => {
    window.localStorage.removeItem('roommatch_bearer_token');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds URL with leading slash on path', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"ok":true}',
    });
    await apiFetch('/foo');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/foo$/),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON body and Content-Type for POST', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    await apiFetch('/bar', { method: 'POST', body: { a: 1 } });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('adds Authorization when token is in localStorage', async () => {
    window.localStorage.setItem('roommatch_bearer_token', 'tok');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'null',
    });
    await apiFetch('/me');
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });

  it('uses explicit token override', async () => {
    window.localStorage.setItem('roommatch_bearer_token', 'wrong');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'null',
    });
    await apiFetch('/me', { token: 'override' });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer override');
  });

  it('returns parsed JSON on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"hello":1}',
    });
    await expect(apiFetch('/x')).resolves.toEqual({ hello: 1 });
  });

  it('returns null for empty body', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });
    await expect(apiFetch('/x')).resolves.toBeNull();
  });

  it('throws with payload.error when present', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ error: 'Bad input' }),
    });
    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'Bad input',
      status: 422,
    });
  });

  it('throws generic message when no payload.error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '{}',
    });
    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'Request failed (500)',
      status: 500,
    });
  });
});
