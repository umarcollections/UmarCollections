// Store details used in emails and in what search engines see. Keep in step
// with client/src/lib/store.js.
const store = {
  name: 'Umar Collections',
  // Other ways people type the name, so search engines tie them to this site
  alternateNames: ['Umar Collection', 'UmarCollections'],
  // Follows the store name in the home page title
  tagline: 'Clothing, Bags & Shoes in Faisalabad',
  // Search result text for the home page and pages without their own
  description:
    'Umar Collections is an online clothing store in Faisalabad. Shop shirts, trousers, knitwear, jackets, bags, shoes and accessories, delivered to your door.',
  email: 'umarcollections.store@gmail.com',
  phone: '+92 307 4801091',
  address: 'Milat Road, Haajwari Town, Street No. 2, Faisalabad',
  // The address in parts, for search engines
  streetAddress: 'Milat Road, Haajwari Town, Street No. 2',
  // The only city we deliver to
  city: 'Faisalabad',
  region: 'Punjab',
  country: 'PK',
  currency: 'PKR',
  // The store's own Instagram, Facebook, TikTok... pages (full URLs). Listing
  // them lets Google connect those profiles to this website.
  profiles: [],
};

export const whatsappLink = `https://wa.me/${store.phone.replace(/\D/g, '')}`;

export default store;
