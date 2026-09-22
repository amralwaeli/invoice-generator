import { InvoiceData } from '../types.ts';

export interface InvoiceCalculations {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  shippingFee: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}

export function calculateInvoice(invoice: InvoiceData): InvoiceCalculations {
  const subtotal = invoice.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  let discountAmount = 0;
  if (invoice.discountType === 'percentage') {
    const percent = Math.min(Math.max(Number(invoice.discountValue) || 0, 0), 100);
    discountAmount = (subtotal * percent) / 100;
  } else {
    discountAmount = Math.max(Number(invoice.discountValue) || 0, 0);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxRate = Math.max(Number(invoice.taxRate) || 0, 0);
  const taxAmount = (taxableAmount * taxRate) / 100;

  const shippingFee = Math.max(Number(invoice.shippingFee) || 0, 0);

  const total = taxableAmount + taxAmount + shippingFee;

  const amountPaid = Math.max(Number(invoice.amountPaid) || 0, 0);
  const balanceDue = Math.max(0, total - amountPaid);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    shippingFee,
    total,
    amountPaid,
    balanceDue,
  };
}
