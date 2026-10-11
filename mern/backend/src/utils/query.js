// Makes user input safe to use inside a MongoDB $regex
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One page of Model.find(filter) plus the numbers a pager needs
export const paginate = async (Model, filter, { page, limit, sort, populate }) => {
  const query = Model.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  if (populate) query.populate(populate);

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};
