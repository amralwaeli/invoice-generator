export function formatMoney(value: number, symbol: string): string {
  return (
    (symbol || 'RM') +
    ' ' +
    value.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
