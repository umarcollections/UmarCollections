import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProductRequest, getProductsRequest } from '../../services/products/product.service.js';

export const productKeys = {
  list: (params) => ['products', 'list', params],
  detail: (slug) => ['products', 'detail', slug],
};

// Keeps the current page on screen while the next one loads
const useProducts = (params) =>
  useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProductsRequest(params),
    placeholderData: keepPreviousData,
  });

// A handful of matches for the header search, fetched while the visitor types.
// The previous matches stay up while the next ones load, so the list doesn't flicker.
const SUGGESTION_COUNT = 6;
export const useProductSuggestions = (q) =>
  useQuery({
    queryKey: productKeys.list({ q, limit: SUGGESTION_COUNT }),
    queryFn: () => getProductsRequest({ q, limit: SUGGESTION_COUNT }),
    enabled: Boolean(q),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useProduct = (slug) =>
  useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: async () => (await getProductRequest(slug)).data,
  });

export default useProducts;
