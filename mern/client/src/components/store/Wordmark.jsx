import store from '../../lib/store.js';

// The store name with everything after the first word in the orange
// gradient: "Umar" in the text colour, "Collections" in orange
const Wordmark = () => {
  const [first, ...rest] = store.name.split(' ');

  return (
    <>
      {first}
      {rest.length > 0 && (
        <>
          {' '}
          <span className="text-ember">{rest.join(' ')}</span>
        </>
      )}
    </>
  );
};

export default Wordmark;
