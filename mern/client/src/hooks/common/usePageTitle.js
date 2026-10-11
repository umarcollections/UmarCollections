import { useEffect } from 'react';
import store from '../../lib/store.js';

// Search engines show about this many characters of a description
const DESCRIPTION_LENGTH = 155;

const shorten = (text) =>
  text.length <= DESCRIPTION_LENGTH
    ? text
    : `${text.slice(0, DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, '')}…`;

// Sets the browser tab title ("Title | Umar Collections", or just the store
// name) and the page description search engines show under it
const usePageTitle = (title, description) => {
  useEffect(() => {
    document.title = title ? `${title} | ${store.name}` : store.name;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', shorten(description?.trim() || store.description));
  }, [title, description]);
};

export default usePageTitle;
