import Product from '../../models/product.model.js';

// Items use the order item shape: { product, variant, quantity }

export const releaseStock = (items) =>
  Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.product, 'variants._id': item.variant },
        { $inc: { 'variants.$.stock': item.quantity } }
      )
    )
  );

// Takes the stock for every item, or none of it. Each decrement only matches
// while enough stock is left, so two shoppers can never buy the same last item.
export const reserveStock = async (items) => {
  const taken = [];
  for (const item of items) {
    const result = await Product.updateOne(
      {
        _id: item.product,
        variants: { $elemMatch: { _id: item.variant, stock: { $gte: item.quantity } } },
      },
      { $inc: { 'variants.$.stock': -item.quantity } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(taken);
      return false;
    }
    taken.push(item);
  }
  return true;
};
