// Store details used in emails. Keep in step with client/src/lib/store.js.
const store = {
  name: 'Umar Collections',
  email: 'umarcollections.store@gmail.com',
  phone: '+92 307 4801091',
  address: 'Milat Road, Haajwari Town, Street No. 2, Faisalabad',
};

export const whatsappLink = `https://wa.me/${store.phone.replace(/\D/g, '')}`;

export default store;
