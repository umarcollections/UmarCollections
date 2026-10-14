import store from '../../config/store.js';

// schema.org data (JSON-LD) that Google reads for the site name, the store's
// details, breadcrumbs and product prices and stock in search results.
// Rules: https://developers.google.com/search/docs/appearance/structured-data

const SCHEMA = 'https://schema.org';

// Product option names Google understands as ways variants differ
const VARIANT_PROPERTIES = [
  [/^sizes?$/i, 'size'],
  [/^colou?rs?$/i, 'color'],
  [/^materials?$/i, 'material'],
  [/^patterns?$/i, 'pattern'],
];

const propertyFor = (optionName) =>
  VARIANT_PROPERTIES.find(([pattern]) => pattern.test(optionName.trim()))?.[1];

const storeId = (base) => `${base}/#store`;

// Home page only: tells Google the site's name, including other spellings
export const websiteData = (base) => ({
  '@context': SCHEMA,
  '@type': 'WebSite',
  '@id': `${base}/#website`,
  name: store.name,
  alternateName: store.alternateNames,
  url: `${base}/`,
  publisher: { '@id': storeId(base) },
});

export const storeData = (base) => ({
  '@context': SCHEMA,
  '@type': 'OnlineStore',
  '@id': storeId(base),
  name: store.name,
  alternateName: store.alternateNames,
  url: `${base}/`,
  description: store.description,
  email: store.email,
  telephone: `+${store.phone.replace(/\D/g, '')}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: store.streetAddress,
    addressLocality: store.city,
    addressRegion: store.region,
    addressCountry: store.country,
  },
  areaServed: { '@type': 'City', name: store.city },
  ...(store.profiles.length > 0 && { sameAs: store.profiles }),
});

// items: [[name, url], ...] from the top level down to this page
export const breadcrumbData = (items) => ({
  '@context': SCHEMA,
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item,
  })),
});

const offerFor = (variant, url, base) => ({
  '@type': 'Offer',
  url,
  price: variant.price,
  priceCurrency: store.currency,
  availability: `${SCHEMA}/${variant.stock > 0 ? 'InStock' : 'OutOfStock'}`,
  // The old price, which Google shows struck through next to the sale price
  ...(variant.compareAtPrice > variant.price && {
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      priceType: `${SCHEMA}/StrikethroughPrice`,
      price: variant.compareAtPrice,
      priceCurrency: store.currency,
    },
  }),
  seller: { '@type': 'OnlineStore', '@id': storeId(base), name: store.name },
});

// A product with one variant is a Product. One with several is a ProductGroup
// whose variants each have a link that opens the page on that variant
// (?variant=<id>, see client/src/hooks/products/useVariantSelection.js).
export const productData = (product, { url, images, base }) => {
  const description = product.description.trim();
  const shared = {
    name: product.title,
    ...(description && { description }),
    ...(images.length > 0 && { image: images }),
    ...(product.category && { category: product.category.name }),
  };

  if (product.variants.length === 1) {
    const [variant] = product.variants;
    return {
      '@context': SCHEMA,
      '@type': 'Product',
      url,
      ...shared,
      ...(variant.sku && { sku: variant.sku }),
      offers: offerFor(variant, url, base),
    };
  }

  const properties = product.options.map((option) => propertyFor(option.name));
  const variesBy = [...new Set(properties.filter(Boolean))];

  return {
    '@context': SCHEMA,
    '@type': 'ProductGroup',
    url,
    ...shared,
    productGroupID: product.slug,
    ...(variesBy.length > 0 && { variesBy: variesBy.map((name) => `${SCHEMA}/${name}`) }),
    hasVariant: product.variants.map((variant) => {
      const variantUrl = `${url}?variant=${variant._id}`;
      const values = variant.optionValues.filter(Boolean);
      return {
        '@type': 'Product',
        name: values.length ? `${product.title} - ${values.join(' / ')}` : product.title,
        ...(images.length > 0 && { image: images }),
        ...(variant.sku && { sku: variant.sku }),
        ...Object.fromEntries(
          properties
            .map((property, i) => [property, variant.optionValues[i]])
            .filter(([property, value]) => property && value)
        ),
        offers: offerFor(variant, variantUrl, base),
      };
    }),
  };
};
