import { useCallback, useSyncExternalStore } from 'react';

// Whether a CSS media query matches, kept up to date as the window resizes
const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
};

export default useMediaQuery;
