const STYLES = {
  active: 'border-green-700 text-green-800',
  draft: 'border-caramel-400 text-espresso-700',
  archived: 'border-caramel-300 text-espresso-700/60',
};

const LABELS = { active: 'Active', draft: 'Draft', archived: 'Archived' };

const ProductStatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
  >
    {LABELS[status]}
  </span>
);

export default ProductStatusBadge;
