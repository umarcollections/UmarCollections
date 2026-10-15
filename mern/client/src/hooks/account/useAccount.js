import { useMutation } from '@tanstack/react-query';
import useAuth from '../auth/useAuth.js';
import {
  addAddressRequest,
  changePasswordRequest,
  deleteAddressRequest,
  setDefaultAddressRequest,
  updateAddressRequest,
  updateProfileRequest,
} from '../../services/account/account.service.js';

// Every account change answers with the updated user, which replaces the one
// in the session so the header, account page and checkout all show it at once
const useAccountMutation = (mutationFn) => {
  const { updateUser } = useAuth();
  return useMutation({ mutationFn, onSuccess: ({ data }) => updateUser(data) });
};

export const useUpdateProfile = () => useAccountMutation(updateProfileRequest);

export const useChangePassword = () => useAccountMutation(changePasswordRequest);

export const useSaveAddress = () =>
  useAccountMutation(({ id, ...address }) =>
    id ? updateAddressRequest(id, address) : addAddressRequest(address)
  );

export const useDeleteAddress = () => useAccountMutation(deleteAddressRequest);

export const useSetDefaultAddress = () => useAccountMutation(setDefaultAddressRequest);
