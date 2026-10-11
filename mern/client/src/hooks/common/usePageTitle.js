import { useEffect } from 'react';
import store from '../../lib/store.js';

// Sets the browser tab title: "Title | Umar Collections", or just the store name
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${store.name}` : store.name;
  }, [title]);
};

export default usePageTitle;
