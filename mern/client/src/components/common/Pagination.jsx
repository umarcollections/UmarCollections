const BUTTON_CLASS =
  'rounded-lg border border-caramel-300 bg-white px-4 py-2 text-sm font-medium text-espresso-900 hover:border-espresso-900 disabled:cursor-not-allowed disabled:opacity-50';

// Shared by the admin lists and the storefront catalogue
const Pagination = ({ page, pages, total, onChange }) => {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pages"
      className="mt-8 flex items-center justify-between gap-4 text-sm text-espresso-700"
    >
      <p>
        Page {page} of {pages} ({total} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
