import ProductCard from './ProductCard.jsx';

// Each card fades up as it scrolls in (see useStoreMotion)
const ProductGrid = ({ products }) => (
  <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
    {products.map((product) => (
      <li key={product._id} data-reveal>
        <ProductCard product={product} />
      </li>
    ))}
  </ul>
);

export default ProductGrid;
