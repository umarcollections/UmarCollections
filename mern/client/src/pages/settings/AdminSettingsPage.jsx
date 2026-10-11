import { toast } from 'sonner';
import SingleImageField from '../../components/admin/SingleImageField.jsx';
import SettingsForm from '../../components/settings/SettingsForm.jsx';
import useSettings, {
  useRemoveHeroImage,
  useUpdateSettings,
  useUploadHeroImage,
} from '../../hooks/settings/useSettings.js';

const AdminSettingsPage = () => {
  const { data: settings, error, isPending } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadHero = useUploadHeroImage();
  const removeHero = useRemoveHeroImage();

  const handleSave = async (payload) => {
    const saved = await updateSettings.mutateAsync(payload);
    toast.success('Settings saved');
    return saved;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-4xl font-semibold text-espresso-900">Settings</h1>

      {settings && !settings.checkoutOpen && (
        <p className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Checkout is closed: customers can fill their cart but cannot place orders until you add a
          bank account below.
        </p>
      )}
      {settings && !settings.uploadsEnabled && (
        <p className="rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4 text-sm text-espresso-800">
          Photo uploads are off until the Cloudinary keys are added to backend/.env. Customers can
          still pay; they send the transaction reference without a screenshot.
        </p>
      )}

      {isPending && <p className="text-sm text-espresso-700">Loading settings…</p>}
      {error && !settings && <p className="text-sm text-red-700">{error.message}</p>}
      {settings && (
        <>
          <section className="rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-5">
            <SingleImageField
              label="Home page photo"
              hint="The large photo at the top of the home page. A wide landscape photo works best."
              imageUrl={settings.heroImage?.url}
              uploadsEnabled={settings.uploadsEnabled}
              busy={uploadHero.isPending || removeHero.isPending}
              onUpload={(file) => uploadHero.mutateAsync(file)}
              onRemove={() => removeHero.mutateAsync()}
            />
          </section>
          <SettingsForm settings={settings} onSave={handleSave} />
        </>
      )}
    </div>
  );
};

export default AdminSettingsPage;
