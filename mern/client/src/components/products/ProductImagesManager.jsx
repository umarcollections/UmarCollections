import { toast } from 'sonner';
import AdminButton from '../admin/AdminButton.jsx';
import ConfirmButton from '../admin/ConfirmButton.jsx';
import {
  useRemoveProductImage,
  useUpdateProduct,
  useUploadProductImages,
} from '../../hooks/products/useAdminProducts.js';
import {
  IMAGE_TYPES,
  imageFileProblem,
  MAX_IMAGE_MB,
  MAX_IMAGES,
} from '../../validators/products/product.schema.js';

// Checked here too so the admin isn't left waiting on an upload the API will refuse
const findProblem = (files, existing) => {
  if (existing + files.length > MAX_IMAGES) {
    return `A product can have at most ${MAX_IMAGES} photos (${existing} already added)`;
  }
  return files.map(imageFileProblem).find(Boolean) ?? null;
};

const ProductImagesManager = ({ product }) => {
  const upload = useUploadProductImages(product._id);
  const remove = useRemoveProductImage(product._id);
  const update = useUpdateProduct(product._id);
  const { images } = product;
  const busy = upload.isPending || remove.isPending || update.isPending;

  const handleFiles = (event) => {
    const files = [...event.target.files];
    // Clear the input so choosing the same file again still triggers a change
    event.target.value = '';
    if (!files.length) return;

    const problem = findProblem(files, images.length);
    if (problem) return toast.error(problem);

    upload.mutate(files, {
      onSuccess: () => toast.success(files.length === 1 ? 'Photo added' : 'Photos added'),
      onError: (err) => toast.error(err.message),
    });
  };

  const move = (from, to) => {
    const order = [...images];
    const [image] = order.splice(from, 1);
    order.splice(to, 0, image);
    update.mutate(
      { images: order.map(({ _id, alt }) => ({ _id, alt })) },
      { onError: (err) => toast.error(err.message) }
    );
  };

  const handleRemove = (imageId) =>
    remove.mutate(imageId, {
      onSuccess: () => toast.success('Photo removed'),
      onError: (err) => toast.error(err.message),
    });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-espresso-900">Photos</h2>
        <p className="mt-1 text-sm text-espresso-700">
          The first photo is the one shown in the catalogue. JPG, PNG or WebP, up to {MAX_IMAGE_MB}{' '}
          MB each, {MAX_IMAGES} photos at most.
        </p>
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, i) => (
            <li
              key={image._id}
              className="rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm"
            >
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="space-y-2 p-3">
                <p className="text-xs text-espresso-700">
                  {i === 0 ? 'Main photo' : `Photo ${i + 1}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0 || busy}
                    aria-label={`Move photo ${i + 1} earlier`}
                  >
                    Earlier
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => move(i, i + 1)}
                    disabled={i === images.length - 1 || busy}
                    aria-label={`Move photo ${i + 1} later`}
                  >
                    Later
                  </AdminButton>
                </div>
                <ConfirmButton
                  question="Remove?"
                  onConfirm={() => handleRemove(image._id)}
                  pending={remove.isPending}
                  disabled={busy}
                >
                  Remove
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length < MAX_IMAGES && (
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-caramel-300 bg-white px-4 py-2 text-sm font-medium text-espresso-900 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-caramel-600 hover:border-espresso-900 has-disabled:cursor-not-allowed has-disabled:opacity-60">
          {upload.isPending ? 'Uploading…' : 'Add photos'}
          <input
            type="file"
            accept={IMAGE_TYPES.join(',')}
            multiple
            className="sr-only"
            onChange={handleFiles}
            disabled={busy}
          />
        </label>
      )}
    </section>
  );
};

export default ProductImagesManager;
