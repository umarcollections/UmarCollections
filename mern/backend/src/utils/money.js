// Amounts are kept to the cent so totals never pick up floating point noise
export const roundMoney = (value) => Math.round(value * 100) / 100;
