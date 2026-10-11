import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategoryRequest,
  deleteCategoryRequest,
  getCategoriesRequest,
  removeCategoryImageRequest,
  updateCategoryRequest,
  uploadCategoryImageRequest,
} from '../../services/categories/category.service.js';

export const categoryKeys = {
  all: ['categories'],
};

const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => (await getCategoriesRequest()).data,
  });

// Every change refetches the list, which is small and sorted by the server
const useCategoryMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};

export const useCreateCategory = () => useCategoryMutation(createCategoryRequest);

export const useUpdateCategory = () =>
  useCategoryMutation(({ id, ...payload }) => updateCategoryRequest(id, payload));

export const useDeleteCategory = () => useCategoryMutation(deleteCategoryRequest);

export const useUploadCategoryImage = () =>
  useCategoryMutation(({ id, file }) => uploadCategoryImageRequest(id, file));

export const useRemoveCategoryImage = () => useCategoryMutation(removeCategoryImageRequest);

export default useCategories;
