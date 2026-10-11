import { releaseDiscountUse } from '../discounts/discountUse.js';
import { releaseStock } from './stock.js';

// What a placed order holds until it is paid: its stock and one use of its
// discount code. Called once when the order is cancelled, by hand or on expiry.
const releaseOrderHolds = async (order) => {
  await releaseStock(order.items);
  if (order.discount?.code) await releaseDiscountUse(order.discount.code);
};

export default releaseOrderHolds;
