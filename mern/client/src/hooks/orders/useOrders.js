import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrderRequest,
  getMyOrdersRequest,
  getOrderRequest,
  quoteCartRequest,
  submitPaymentRequest,
} from '../../services/orders/order.service.js';

export const orderKeys = {
  quote: (items) => ['cart-quote', items],
  detail: (orderNumber) => ['order', orderNumber],
  mine: ['my-orders'],
};

const toQuoteItems = (items) =>
  items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));

// Live prices, stock, discount and totals for the cart, worked out by the server
export const useCartQuote = (items, discountCode) => {
  const quoteItems = toQuoteItems(items);
  return useQuery({
    queryKey: orderKeys.quote({ items: quoteItems, discountCode }),
    queryFn: async () => (await quoteCartRequest(quoteItems, discountCode)).data,
    enabled: quoteItems.length > 0,
    placeholderData: keepPreviousData,
  });
};

// Opens with the key from the order link, or for the signed-in customer who placed it
export const useOrder = (orderNumber, key, signedIn) =>
  useQuery({
    queryKey: orderKeys.detail(orderNumber),
    queryFn: async () => (await getOrderRequest(orderNumber, key)).data,
    enabled: Boolean(key) || signedIn,
  });

export const useMyOrders = () =>
  useQuery({
    queryKey: orderKeys.mine,
    queryFn: async () => (await getMyOrdersRequest()).data,
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await createOrderRequest(payload)).data,
    onSuccess: ({ order }) => {
      queryClient.setQueryData(orderKeys.detail(String(order.orderNumber)), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.mine });
      // Stock changed, so product pages and the catalogue need fresh numbers
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useSubmitPayment = (orderNumber, key) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment) => (await submitPaymentRequest(orderNumber, key, payment)).data,
    onSuccess: (order) => queryClient.setQueryData(orderKeys.detail(orderNumber), order),
  });
};
