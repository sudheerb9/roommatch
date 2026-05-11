import { getBearerToken, isAuthenticated } from './authHelper';

describe('authHelper', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('isAuthenticated is false without token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is true when token exists', () => {
    window.localStorage.setItem('roommatch_bearer_token', 'x');
    expect(isAuthenticated()).toBe(true);
  });

  it('getBearerToken returns null when missing', () => {
    expect(getBearerToken()).toBeNull();
  });

  it('getBearerToken returns stored value', () => {
    window.localStorage.setItem('roommatch_bearer_token', 'abc');
    expect(getBearerToken()).toBe('abc');
  });
});
