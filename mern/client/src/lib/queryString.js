// { q: 'shirt', page: 2, status: '' } -> "?q=shirt&page=2" (empty values left out)
export const toQueryString = (params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value != null)
  );
  return search.size ? `?${search}` : '';
};
