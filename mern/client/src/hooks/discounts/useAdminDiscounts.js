import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDiscountRequest,
  deleteDiscountRequest,
  getDiscountsRequest,
  updateDiscountRequest,
} from '../../services/discounts/adminDiscount.service.js';

export const discountKeys = {
  all: ['admin-discounts'],
};

const useAdminDiscounts = () =>
  useQuery({
    queryKey: discountKeys.all,
    queryFn: async () => (await getDiscountsRequest()).data,
  });

// Every change refetches the list, which is small
const useDiscountMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discountKeys.all }),
  });
};

export const useCreateDiscount = () => useDiscountMutation(createDiscountRequest);

export const useUpdateDiscount = () =>
  useDiscountMutation(({ id, ...payload }) => updateDiscountRequest(id, payload));

export const useDeleteDiscount = () => useDiscountMutation(deleteDiscountRequest);

export default useAdminDiscounts;
