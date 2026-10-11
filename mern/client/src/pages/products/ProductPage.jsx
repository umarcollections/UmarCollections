import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductDetails from '../../components/products/ProductDetails.jsx';
import ProductGrid from '../../components/products/ProductGrid.jsx';
import SectionHeading from '../../components/store/SectionHeading.jsx';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import useProducts, { useProduct } from '../../hooks/products/useProducts.js';

const RELATED = 4;

const ProductPage = () => {
  const page = useRef(null);
  const { slug } = useParams();
  const { data: product, error, isPending } = useProduct(slug);
  // Same collection first; fetches one extra so the current product can be left out
  const { data: sameCollection } = useProducts({
    category: product?.category?.slug ?? '',
    limit: RELATED + 1,
  });
  const related = (sameCollection?.data ?? [])
    .filter((item) => item._id !== product?._id)
    .slice(0, RELATED);

  usePageTitle(product?.title ?? (error ? 'Product not found' : ''), product?.description);
  useStoreMotion(page, [product?._id, related.map((item) => item._id).join()]);

  return (
    <div ref={page} className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-8">
      {isPending && <p className="py-20 text-sm text-espresso-700">Loading product…</p>}

      {error && (
        <div className="py-24 text-center">
          <p className="font-display text-4xl text-espresso-900">
            {error.status === 404 ? 'This product is no longer available' : error.message}
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-espresso-900 underline underline-offset-8"
          >
            Back to the shop
          </Link>
        </div>
      )}

      {/* Keyed so the chosen variant, photo and animated title reset for another product */}
      {product && <ProductDetails key={product._id} product={product} />}

      {product && related.length > 0 && (
        <section key={`related-${product._id}`} className="mt-32">
          <SectionHeading eyebrow="More to explore" title="You may also like" />
          <div className="mt-12">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
