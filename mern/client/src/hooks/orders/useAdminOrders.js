import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminOrderRequest,
  getAdminOrdersRequest,
  orderActionRequest,
} from '../../services/orders/adminOrder.service.js';

export const adminOrderKeys = {
  lists: ['admin-orders', 'list'],
  list: (params) => ['admin-orders', 'list', params],
  detail: (id) => ['admin-orders', 'detail', id],
};

// Keeps the current page on screen while the next one loads
const useAdminOrders = (params) =>
  useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => getAdminOrdersRequest(params),
    placeholderData: keepPreviousData,
  });

export const useAdminOrder = (id) =>
  useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: async () => (await getAdminOrderRequest(id)).data,
  });

export const useOrderAction = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action) => (await orderActionRequest(id, action)).data,
    onSuccess: (order) => {
      queryClient.setQueryData(adminOrderKeys.detail(id), order);
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists });
      // Cancelling puts stock back, which the product screens show
      if (order.status === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    },
  });
};

export default useAdminOrders;
