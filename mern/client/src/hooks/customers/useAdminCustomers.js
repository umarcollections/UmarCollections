import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCustomerRequest,
  getCustomersRequest,
} from '../../services/customers/adminCustomer.service.js';

export const customerKeys = {
  list: (params) => ['admin-customers', 'list', params],
  detail: (email) => ['admin-customers', 'detail', email],
};

// Keeps the current page on screen while the next one loads
const useAdminCustomers = (params) =>
  useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomersRequest(params),
    placeholderData: keepPreviousData,
  });

export const useAdminCustomer = (email) =>
  useQuery({
    queryKey: customerKeys.detail(email),
    queryFn: async () => (await getCustomerRequest(email)).data,
  });

export default useAdminCustomers;
