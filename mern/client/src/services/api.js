const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Fired when the server rejects our session (expired or revoked).
// AuthProvider listens for it and ends the session.
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Shared fetch wrapper. The JWT lives in an httpOnly cookie that the browser
// sends by itself (credentials: 'include'); this code never sees the token.
// Pass notifyUnauthorized: false for calls where a 401 is an expected answer
// (login, signup, the initial session check).
// FormData bodies (file uploads) are sent as-is so the browser sets the multipart boundary.
export const request = async (path, { method = 'GET', body, notifyUnauthorized = true } = {}) => {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(!isForm && { 'Content-Type': 'application/json' }),
        // Required by the API's CSRF check on state-changing requests
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server. Is the backend running?', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // No JSON body means the API didn't answer, e.g. the dev proxy
    // couldn't reach a stopped backend
    if (!data) throw new ApiRequestError('Cannot reach the server. Is the backend running?', 0);
    if (res.status === 401 && notifyUnauthorized) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiRequestError(data.message || 'Something went wrong', res.status);
  }
  return data;
};

// Body for endpoints that take one photo in the "image" field
export const imageForm = (file) => {
  const form = new FormData();
  form.append('image', file);
  return form;
};
