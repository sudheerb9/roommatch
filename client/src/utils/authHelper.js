/**
 * Check if user has a valid bearer token in localStorage
 * @returns {boolean} true if token exists, false otherwise
 */
export const isAuthenticated = () => {
  const token = window.localStorage.getItem('roommatch_bearer_token');
  return !!token;
};

/**
 * Get the bearer token from localStorage
 * @returns {string|null} the token or null if not found
 */
export const getBearerToken = () => {
  return window.localStorage.getItem('roommatch_bearer_token');
};
