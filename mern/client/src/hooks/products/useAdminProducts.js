import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProductRequest,
  deleteProductRequest,
  getAdminProductRequest,
  getAdminProductsRequest,
  removeProductImageRequest,
  updateProductRequest,
  uploadProductImagesRequest,
} from '../../services/products/adminProduct.service.js';

export const adminProductKeys = {
  lists: ['admin-products', 'list'],
  list: (params) => ['admin-products', 'list', params],
  detail: (id) => ['admin-products', 'detail', id],
};

// Keeps the current page on screen while the next one loads
const useAdminProducts = (params) =>
  useQuery({
    queryKey: adminProductKeys.list(params),
    queryFn: () => getAdminProductsRequest(params),
    placeholderData: keepPreviousData,
  });

// enabled: false stops it loading, e.g. while the product is being deleted
export const useAdminProduct = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: adminProductKeys.detail(id),
    queryFn: async () => (await getAdminProductRequest(id)).data,
    enabled,
  });

// Mutations that return the saved product put it straight into the cache, so
// the edit page shows the server's version without another request
const useProductMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => (await mutationFn(variables)).data,
    onSuccess: (product) => {
      if (product?._id) queryClient.setQueryData(adminProductKeys.detail(product._id), product);
      queryClient.invalidateQueries({ queryKey: adminProductKeys.lists });
    },
  });
};

export const useCreateProduct = () => useProductMutation(createProductRequest);

export const useUpdateProduct = (id) =>
  useProductMutation((payload) => updateProductRequest(id, payload));

// One photo per request, because hosts such as Vercel refuse requests over
// 4.5 MB. If one fails, the photos already added stay and the page reloads them.
export const useUploadProductImages = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files) => {
      let product;
      for (const file of files) {
        product = (await uploadProductImagesRequest(id, [file])).data;
      }
      return product;
    },
    onSuccess: (product) => queryClient.setQueryData(adminProductKeys.detail(id), product),
    onError: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(id) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.lists }),
  });
};

export const useRemoveProductImage = (id) =>
  useProductMutation((imageId) => removeProductImageRequest(id, imageId));

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductRequest,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: adminProductKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminProductKeys.lists });
    },
  });
};

export default useAdminProducts;
