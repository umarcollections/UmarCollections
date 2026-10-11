// "Men's Linen Shirt!" -> "mens-linen-shirt"
export const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Adds -2, -3... until no other document in the model uses the slug
export const uniqueSlug = async (Model, text, excludeId) => {
  const base = slugify(text) || 'item';
  let slug = base;

  for (let n = 2; await Model.exists({ slug, _id: { $ne: excludeId } }); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
};
