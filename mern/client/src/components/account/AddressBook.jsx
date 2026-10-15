import { useState } from 'react';
import AddressCard from './AddressCard.jsx';
import AddressForm from './AddressForm.jsx';
import EmptyState from './EmptyState.jsx';
import StoreButton from '../store/StoreButton.jsx';

// Mirrors MAX_ADDRESSES in backend/src/models/user.model.js
const MAX_ADDRESSES = 5;

// Saved delivery addresses. editing is null, 'new', or the id of the address
// being changed; only one form is open at a time.
const AddressBook = ({ user }) => {
  const [editing, setEditing] = useState(null);
  const { addresses = [] } = user;
  const full = addresses.length >= MAX_ADDRESSES;
  const done = () => setEditing(null);

  return (
    <div className="space-y-4">
      {addresses.length === 0 && editing !== 'new' && (
        <EmptyState
          icon="pin"
          title="No saved addresses"
          text="Save one here, or tick “Save this address” at checkout. Your default address fills checkout for you."
        >
          <StoreButton onClick={() => setEditing('new')}>Add an address</StoreButton>
        </EmptyState>
      )}

      {addresses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editing === address._id ? (
              <li key={address._id} className="sm:col-span-2">
                <AddressForm address={address} user={user} onDone={done} />
              </li>
            ) : (
              <AddressCard
                key={address._id}
                address={address}
                onEdit={() => setEditing(address._id)}
              />
            )
          )}
        </ul>
      )}

      {editing === 'new' && (
        <AddressForm user={user} isFirst={addresses.length === 0} onDone={done} />
      )}
      {editing !== 'new' && addresses.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <StoreButton variant="outline" onClick={() => setEditing('new')} disabled={full}>
            Add an address
          </StoreButton>
          {full && (
            <p className="text-xs text-espresso-700">
              You can save up to {MAX_ADDRESSES}. Delete one to add another.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressBook;
