import { useEffect } from 'react';
import store from '../../lib/store.js';

// Sets the browser tab title: "Title | Umar Collections", or on the home page
// the store name and tagline. The server sends each page with the same title
// plus its description and canonical address (see
// backend/src/controllers/seo/page.controller.js), so keep the two in step:
// Google reads the title the app sets.
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${store.name}` : `${store.name}: ${store.tagline}`;
  }, [title]);
};

export default usePageTitle;
