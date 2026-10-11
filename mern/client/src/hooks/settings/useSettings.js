import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSettingsRequest,
  removeHeroImageRequest,
  updateSettingsRequest,
  uploadHeroImageRequest,
} from '../../services/settings/settings.service.js';

export const settingsKeys = {
  all: ['settings'],
};

const useSettings = () =>
  useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => (await getSettingsRequest()).data,
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await updateSettingsRequest(payload)).data,
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.all, settings);
      // Shipping and checkout availability feed into cart totals
      queryClient.invalidateQueries({ queryKey: ['cart-quote'] });
    },
  });
};

// Photo changes return the full settings, so the cache is simply replaced
const useHeroImageMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => (await mutationFn(file)).data,
    onSuccess: (settings) => queryClient.setQueryData(settingsKeys.all, settings),
  });
};

export const useUploadHeroImage = () => useHeroImageMutation(uploadHeroImageRequest);

export const useRemoveHeroImage = () => useHeroImageMutation(removeHeroImageRequest);

export default useSettings;
