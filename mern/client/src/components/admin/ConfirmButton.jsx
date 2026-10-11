import { useState } from 'react';
import AdminButton from './AdminButton.jsx';

// Actions that are hard to undo take two clicks: the first asks, the second
// does it. The question closes once confirmed, so a refused action (shown as a
// toast) leaves the normal button behind rather than a stale prompt.
const ConfirmButton = ({
  children,
  question = 'Are you sure?',
  onConfirm,
  pending,
  disabled,
  variant = 'danger',
}) => {
  const [asking, setAsking] = useState(false);

  const confirm = () => {
    setAsking(false);
    onConfirm();
  };

  if (!asking) {
    return (
      <AdminButton variant={variant} onClick={() => setAsking(true)} disabled={disabled || pending}>
        {pending ? 'Working…' : children}
      </AdminButton>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-espresso-800">{question}</span>
      <AdminButton variant={variant} onClick={confirm}>
        Yes, continue
      </AdminButton>
      <AdminButton variant="secondary" onClick={() => setAsking(false)}>
        Cancel
      </AdminButton>
    </span>
  );
};

export default ConfirmButton;
