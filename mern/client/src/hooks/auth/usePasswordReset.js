import { useMutation } from '@tanstack/react-query';
import { forgotPasswordRequest, resetPasswordRequest } from '../../services/auth/auth.service.js';

export const useForgotPassword = () => useMutation({ mutationFn: forgotPasswordRequest });

export const useResetPassword = (token) =>
  useMutation({ mutationFn: (password) => resetPasswordRequest(token, password) });
