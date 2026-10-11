// Demo catalogue used by scripts/seedDemo.js. Artwork lives in client/public/demo.
// Prices are in the store currency (PKR).

const art = (stem) =>
  [1, 2].map((n) => ({ url: `/demo/${stem}-${n}.svg`, publicId: `demo/${stem}-${n}` }));

export const DEMO_CATEGORIES = [
  { slug: 'shirts', name: 'Shirts', description: 'Linen and cotton shirts cut for warm days.' },
  {
    slug: 'trousers',
    name: 'Trousers',
    description: 'Pleated, relaxed and easy to wear every day.',
  },
  {
    slug: 'knitwear',
    name: 'Knitwear',
    description: 'Soft merino and cotton knits for cooler evenings.',
  },
  {
    slug: 'outerwear',
    name: 'Outerwear',
    description: 'Coats and jackets in wool blends and suede.',
  },
  {
    slug: 'bags',
    name: 'Bags',
    description: 'Totes, backpacks and crossbody bags in leather and canvas.',
  },
  { slug: 'accessories', name: 'Accessories', description: 'Belts, scarves, caps and wallets.' },
];

const sizes = (values, price, stocks, extra = {}) => ({
  options: [{ name: 'Size', values }],
  variants: values.map((value, i) => ({
    optionValues: [value],
    price,
    stock: stocks[i],
    ...extra,
  })),
});

const sizesAndColours = (sizeValues, colours, price, stock) => ({
  options: [
    { name: 'Size', values: sizeValues },
    { name: 'Colour', values: colours },
  ],
  variants: sizeValues.flatMap((size, i) =>
    colours.map((colour, j) => ({
      optionValues: [size, colour],
      price,
      // A spread of stock so the storefront shows in stock, low stock and sold out
      stock: (i + j * 2) % 5 === 4 ? 0 : 2 + ((i * 3 + j) % 7),
    }))
  ),
});

const single = (price, stock, compareAtPrice) => ({
  options: [],
  variants: [{ optionValues: [], price, stock, ...(compareAtPrice && { compareAtPrice }) }],
});

export const DEMO_PRODUCTS = [
  {
    slug: 'linen-camp-shirt',
    category: 'shirts',
    title: 'Linen Camp Shirt',
    description:
      'A relaxed camp-collar shirt in washed linen.\nBreathable, softens with every wash.\n\nFabric: 100% linen\nFit: relaxed, true to size\nCare: machine wash cold, line dry',
    ...sizesAndColours(['S', 'M', 'L', 'XL'], ['Cream', 'Caramel'], 4950),
  },
  {
    slug: 'oxford-cotton-shirt',
    category: 'shirts',
    title: 'Oxford Cotton Shirt',
    description:
      'A button-down Oxford shirt that works with trousers or denim.\n\nFabric: 100% cotton Oxford\nFit: regular\nCare: machine wash warm',
    ...sizes(['S', 'M', 'L', 'XL'], 4450, [6, 9, 4, 2]),
  },
  {
    slug: 'heavyweight-tee',
    category: 'shirts',
    title: 'Heavyweight Tee',
    description:
      'A boxy tee in thick, structured cotton jersey.\n\nFabric: 240 gsm cotton\nFit: boxy, size down for a closer fit',
    ...sizesAndColours(['S', 'M', 'L'], ['Cream', 'Espresso'], 2400),
  },
  {
    slug: 'pleated-wide-trousers',
    category: 'trousers',
    title: 'Pleated Wide Trousers',
    description:
      'High-rise trousers with front pleats and a wide leg.\n\nFabric: wool blend\nFit: high rise, wide leg\nCare: dry clean',
    ...sizes(['28', '30', '32', '34'], 5900, [3, 5, 5, 1]),
  },
  {
    slug: 'relaxed-chinos',
    category: 'trousers',
    title: 'Relaxed Chinos',
    description:
      'Everyday chinos in garment-dyed cotton twill.\n\nFabric: 100% cotton twill\nFit: relaxed, tapered',
    ...sizes(['28', '30', '32', '34', '36'], 4800, [4, 7, 0, 6, 3], { compareAtPrice: 5600 }),
  },
  {
    slug: 'merino-crew-sweater',
    category: 'knitwear',
    title: 'Merino Crew Sweater',
    description:
      'A fine-gauge crew neck in soft merino wool.\n\nFabric: 100% merino wool\nCare: hand wash cold, dry flat',
    ...sizesAndColours(['S', 'M', 'L'], ['Oat', 'Rust'], 7500),
  },
  {
    slug: 'cable-knit-cardigan',
    category: 'knitwear',
    title: 'Cable Knit Cardigan',
    description:
      'A chunky cable cardigan with horn-look buttons.\n\nFabric: cotton and wool blend\nFit: oversized',
    ...sizes(['S', 'M', 'L'], 8200, [2, 4, 3]),
  },
  {
    slug: 'wool-blend-overcoat',
    category: 'outerwear',
    title: 'Wool Blend Overcoat',
    description:
      'A long single-breasted overcoat with a soft brushed finish.\n\nFabric: 70% wool, 30% polyester\nLining: viscose\nCare: dry clean',
    ...sizes(['S', 'M', 'L', 'XL'], 18500, [1, 3, 2, 0], { compareAtPrice: 22000 }),
  },
  {
    slug: 'suede-trucker-jacket',
    category: 'outerwear',
    title: 'Suede Trucker Jacket',
    description:
      'A classic trucker jacket in soft suede.\n\nMaterial: goat suede\nCare: specialist leather clean',
    ...sizes(['S', 'M', 'L'], 15900, [2, 2, 1]),
  },
  {
    slug: 'leather-tote',
    category: 'bags',
    title: 'Leather Tote',
    description:
      'A roomy tote in full-grain leather that fits a laptop.\n\nMaterial: full-grain leather\nSize: 38 x 32 x 14 cm',
    ...single(9800, 6),
  },
  {
    slug: 'canvas-backpack',
    category: 'bags',
    title: 'Canvas Backpack',
    description:
      'A waxed canvas backpack with a padded laptop sleeve.\n\nMaterial: waxed cotton canvas\nSize: 44 x 30 x 14 cm',
    ...single(6500, 9),
  },
  {
    slug: 'mini-crossbody',
    category: 'bags',
    title: 'Mini Crossbody',
    description:
      'A small crossbody bag with an adjustable strap.\n\nMaterial: pebbled leather\nSize: 20 x 14 x 6 cm',
    ...single(5400, 3, 6200),
  },
  {
    slug: 'leather-belt',
    category: 'accessories',
    title: 'Leather Belt',
    description: 'A 3.5 cm belt in vegetable-tanned leather with a brass buckle.',
    ...sizes(['S', 'M', 'L'], 2900, [5, 8, 4]),
  },
  {
    slug: 'wool-scarf',
    category: 'accessories',
    title: 'Wool Scarf',
    description: 'A long scarf in soft lambswool with fringed ends.\n\nSize: 180 x 30 cm',
    ...single(3200, 12),
  },
  {
    slug: 'cotton-cap',
    category: 'accessories',
    title: 'Cotton Cap',
    description: 'A six-panel cap in washed cotton with an adjustable strap.',
    ...single(1900, 0),
  },
  {
    slug: 'bifold-wallet',
    category: 'accessories',
    title: 'Bifold Wallet',
    description: 'A slim bifold wallet with six card slots.\n\nMaterial: full-grain leather',
    ...single(2700, 15),
  },
].map((product) => ({ ...product, status: 'active', images: art(product.slug) }));

export const DEMO_HERO_IMAGE = { url: '/demo/hero.svg', publicId: 'demo/hero' };
