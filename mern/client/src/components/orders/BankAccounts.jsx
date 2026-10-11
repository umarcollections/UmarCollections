const Row = ({ label, value }) => (
  <div className="flex flex-wrap justify-between gap-x-4">
    <dt className="text-espresso-700">{label}</dt>
    <dd className="font-medium text-espresso-900 select-all">{value}</dd>
  </div>
);

const BankAccounts = ({ accounts }) => (
  <ul className="space-y-3">
    {accounts.map((account) => (
      <li
        key={`${account.bankName}-${account.accountNumber}`}
        className="rounded-3xl border border-caramel-300/60 bg-cream-50 p-5"
      >
        <dl className="space-y-1 text-sm">
          <Row label="Bank" value={account.bankName} />
          <Row label="Account title" value={account.accountTitle} />
          <Row label="Account number" value={account.accountNumber} />
          {account.iban && <Row label="IBAN" value={account.iban} />}
        </dl>
      </li>
    ))}
  </ul>
);

export default BankAccounts;
