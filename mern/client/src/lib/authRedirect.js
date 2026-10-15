// Pages that are part of signing in. Remembering one of these as "where the
// visitor was" would send them straight back to a sign-in page.
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];

// The `state` to put on a link to the login page, so the visitor returns to
// the page they were on (including any filter or #section) once signed in
export const rememberPage = (location) =>
  AUTH_PAGES.includes(location.pathname) ? undefined : { from: location };

// Where to go after logging in or signing up: back to the remembered page,
// otherwise the admin for admins and the home page for everyone else
export const afterSignInPath = (state, user) => {
  const from = state?.from;
  if (from?.pathname) return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
  return user?.role === 'admin' ? '/admin' : '/';
};
