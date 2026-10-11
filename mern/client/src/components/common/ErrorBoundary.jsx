import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorScreen from './ErrorScreen.jsx';

// Browsers word a failed page download differently
const CHUNK_ERROR = /dynamically imported module|importing a module script failed/i;
const RELOADED_AT = 'reloaded-after-chunk-error';
// A second failure this soon after reloading means reloading won't help
const RELOAD_COOLDOWN_MS = 30_000;

// After a new version is deployed, a tab opened earlier asks for page files
// that no longer exist. One automatic reload picks up the new version.
const reloadOnceForNewVersion = (error) => {
  if (!CHUNK_ERROR.test(error?.message ?? '')) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT));
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

// React can only catch rendering errors in a class component, so this is the
// one class in the app. resetKey clears the error when the visitor moves to
// another page (a link, Back or Forward).
class Boundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey === state.resetKey) return null;
    return { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error) {
    if (!reloadOnceForNewVersion(error)) console.error(error);
  }

  render() {
    if (this.state.error) return <ErrorScreen onReload={() => window.location.reload()} />;
    return this.props.children;
  }
}

const ErrorBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
};

export default ErrorBoundary;
