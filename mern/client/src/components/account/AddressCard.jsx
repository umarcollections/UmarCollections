import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteAddress, useSetDefaultAddress } from '../../hooks/account/useAccount.js';

const ACTION =
  'inline-block py-2 text-xs font-semibold text-espresso-900 underline underline-offset-4 transition hover:text-tangerine-700 disabled:opacity-50';

// One saved address with its actions. Delete asks once more before it goes.
const AddressCard = ({ address, onEdit }) => {
  const [confirming, setConfirming] = useState(false);
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const busy = deleteAddress.isPending || setDefault.isPending;

  const remove = () =>
    deleteAddress.mutate(address._id, {
      onSuccess: () => toast.success('Address deleted'),
      onError: (err) => toast.error(err.message),
    });

  const makeDefault = () =>
    setDefault.mutate(address._id, {
      onSuccess: () => toast.success('Default address changed'),
      onError: (err) => toast.error(err.message),
    });

  return (
    <li
      className={`flex flex-col rounded-3xl border p-5 ${
        address.isDefault
          ? 'border-espresso-900/40 bg-white/80'
          : 'border-caramel-300/60 bg-white/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="font-semibold text-espresso-900">{address.label || 'Delivery address'}</p>
        {address.isDefault && (
          <span className="rounded-full bg-espresso-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-50">
            Default
          </span>
        )}
      </div>
      <address className="mt-2 flex-1 text-sm not-italic leading-relaxed text-espresso-800">
        {address.name}
        <br />
        {address.phone}
        <br />
        {address.address}
        <br />
        {[address.city, address.postalCode].filter(Boolean).join(' ')}
      </address>

      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 text-xs text-espresso-800">
          <span>Delete this address?</span>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className={`${ACTION} text-red-700`}
          >
            Yes, delete
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={ACTION}>
            Keep it
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-x-4">
          <button type="button" onClick={onEdit} disabled={busy} className={ACTION}>
            Edit
          </button>
          {!address.isDefault && (
            <button type="button" onClick={makeDefault} disabled={busy} className={ACTION}>
              Make default
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            className={`${ACTION} text-red-700`}
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
};

export default AddressCard;
