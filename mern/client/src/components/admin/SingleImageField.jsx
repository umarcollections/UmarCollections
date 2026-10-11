import { toast } from 'sonner';
import AdminButton from './AdminButton.jsx';
import {
  IMAGE_TYPES,
  imageFileProblem,
  MAX_IMAGE_MB,
} from '../../validators/products/product.schema.js';

// One photo with Upload/Replace and Remove, for the home page hero and categories.
// onUpload(file) and onRemove() return promises; errors are shown as toasts.
const SingleImageField = ({ label, hint, imageUrl, uploadsEnabled, busy, onUpload, onRemove }) => {
  const handleFile = async (event) => {
    const [file] = event.target.files;
    // Clear the input so choosing the same file again still triggers a change
    event.target.value = '';
    if (!file) return;

    const problem = imageFileProblem(file);
    if (problem) return toast.error(problem);

    try {
      await onUpload(file);
      toast.success('Photo saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-espresso-800">{label}</p>
      {hint && <p className="text-xs text-espresso-700">{hint}</p>}

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="h-32 w-auto max-w-full border border-caramel-300/60 object-cover"
        />
      )}

      {uploadsEnabled ? (
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-caramel-300 bg-white px-4 py-2 text-sm font-medium text-espresso-900 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-caramel-600 hover:border-espresso-900 has-disabled:cursor-not-allowed has-disabled:opacity-60">
            {busy ? 'Working…' : imageUrl ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept={IMAGE_TYPES.join(',')}
              className="sr-only"
              onChange={handleFile}
              disabled={busy}
            />
          </label>
          {imageUrl && (
            <AdminButton variant="secondary" onClick={handleRemove} disabled={busy}>
              Remove photo
            </AdminButton>
          )}
        </div>
      ) : (
        <p className="text-xs text-espresso-700">
          Photo uploads turn on once the Cloudinary keys are added to backend/.env.
        </p>
      )}
      {uploadsEnabled && (
        <p className="text-xs text-espresso-700">JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB.</p>
      )}
    </div>
  );
};

export default SingleImageField;
