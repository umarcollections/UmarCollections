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

export const useProduct = (slug) =>
  useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: async () => (await getProductRequest(slug)).data,
  });

export default useProducts;
