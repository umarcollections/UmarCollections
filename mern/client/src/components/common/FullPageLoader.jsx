const FullPageLoader = ({ label = 'Loading…' }) => (
  <div className="flex min-h-screen items-center justify-center" role="status">
    <div className="flex flex-col items-center gap-3 text-espresso-700">
      <span className="size-8 animate-spin rounded-full border-[3px] border-caramel-300/60 border-t-espresso-900" />
      <span className="text-sm">{label}</span>
    </div>
  </div>
);

export default FullPageLoader;
