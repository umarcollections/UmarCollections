// Store details shown across the site, including the Privacy Policy and Terms.
// Keep in step with backend/src/config/store.js, which also sets what search
// engines see for each page.
const store = {
  name: 'Umar Collections',
  // Follows the store name in the home page title
  tagline: 'Clothing, Bags & Shoes in Faisalabad',
  email: 'umarcollections.store@gmail.com',
  // The only city we deliver to
  city: 'Faisalabad',
  address: 'Milat Road, Haajwari Town, Street No. 2, Faisalabad',
  // Shown as written; used for both calls and WhatsApp
  phone: '+92 307 4801091',
  // ISO 4217 code used for every price on the site
  currency: 'PKR',
  locale: 'en-PK',
};

// Digits only, for tel: and wa.me links
const phoneDigits = store.phone.replace(/\D/g, '');
export const phoneLink = `tel:+${phoneDigits}`;
export const whatsappLink = `https://wa.me/${phoneDigits}`;
// Opens the address in Google Maps (app on phones, website elsewhere)
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  store.address
)}`;

export default store;
