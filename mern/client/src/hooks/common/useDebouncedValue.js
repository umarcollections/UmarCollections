import { useEffect, useState } from 'react';

// The value once it has stopped changing for `delay` ms, e.g. a search term
// that only goes to the server when the visitor pauses typing
const useDebouncedValue = (value, delay) => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
};

export default useDebouncedValue;
