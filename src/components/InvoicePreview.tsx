import React from 'react';
import { SimpleInvoiceData, formatMoney, numericValue } from '../utils/yamanMartDefaults.ts';

interface InvoicePreviewProps {
  invoice: SimpleInvoiceData;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    total: number;
    quantity: number;
  };
  showWatermark?: boolean;
}

function formatDate(value: string): string {
  if (!value) return '—';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return value;
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parts[0], parts[1] - 1, parts[2]));
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, totals }) => {
  const statusColors = {
    paid: 'bg-slate-100 text-slate-700 border-slate-200',
    overdue: 'bg-slate-100 text-slate-700 border-slate-200',
    sent: 'bg-slate-100 text-slate-700 border-slate-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusLabels = {
    paid: 'Paid',
    overdue: 'Overdue',
    sent: 'Payment due',
    draft: 'Draft',
  };

  const status = invoice.status === 'paid'
    ? 'paid'
    : invoice.status === 'sent' && invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10)
      ? 'overdue'
      : invoice.status;

  return (
    <div className="invoice-preview-content flex min-h-[1024px] flex-col bg-white" lang="en" dir="ltr">
      {/* Header */}
      <div className="invoice-header relative border-b-2 border-slate-300 px-5 sm:px-8 pt-4 pb-4">
        <img
          src={`${import.meta.env.BASE_URL}yaman_mart_logo.jpg`}
          alt="Yaman Mart logo"
          className="mx-auto block h-auto max-h-[190px] w-full object-contain object-center"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{invoice.shopName}</h1>
              {invoice.companyReg && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Reg. No: {invoice.companyReg}
                </p>
              )}
            <div className="mt-2 sm:mt-3 space-y-0.5 text-xs text-slate-600">
                <p>{invoice.shopAddress}</p>
                <p>{invoice.shopEmail}</p>
                <p>{invoice.shopPhone}</p>
              </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="invoice-title-label inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 ring-1 ring-slate-200" dir="ltr">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Invoice</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{invoice.invoiceNumber || '—'}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Issue date:</span>
                <span className="font-semibold text-slate-900">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Due date:</span>
                <span className="font-semibold text-slate-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="invoice-bill-to px-4 sm:px-8 py-3 sm:py-4">
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div className="rounded-lg bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill to</h3>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg font-bold text-slate-900">
              {invoice.customerName.trim() || 'Unregistered customer'}
            </p>
            {invoice.customerPhone && (
              <p className="mt-1 text-sm text-slate-600">{invoice.customerPhone}</p>
            )}
          </div>
          <div className="flex items-end justify-end">
            <div className={`invoice-status inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border ${statusColors[status]}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusLabels[status]}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="invoice-items px-4 sm:px-8 pb-3 sm:pb-4">
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]" dir="ltr">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">#</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold uppercase tracking-wider">Quantity</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold uppercase tracking-wider">Unit price</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-5 text-center text-sm text-slate-500">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item, index) => {
                    const lineTotal = numericValue(item.quantity) * numericValue(item.unitPrice);
                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-mono font-medium text-slate-500">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-slate-900 max-w-[200px] sm:max-w-none">
                          {item.description.trim() || 'Item description'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm font-semibold text-slate-700">
                          {numericValue(item.quantity)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-mono text-slate-700">
                          {formatMoney(numericValue(item.unitPrice))}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-mono font-bold text-slate-900">
                          {formatMoney(lineTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals & Payment */}
      <div className="invoice-summary grid grid-cols-1 sm:grid-cols-[1fr_320px] gap-3 sm:gap-5 px-4 sm:px-8 pb-3 sm:pb-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment information
            </h3>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Bank</span>
                <span className="font-semibold text-slate-900">{invoice.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Account name</span>
                <span className="font-semibold text-slate-900">{invoice.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Account number</span>
                <span className="font-mono font-bold text-slate-900">{invoice.accountNumber}</span>
              </div>
            </div>
            {invoice.notes && (
              <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-600">
                {invoice.notes}
              </p>
            )}
          </div>
          {invoice.remarks && (
            <div className="rounded-lg bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Terms and conditions
              </h3>
              <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-slate-700">{invoice.remarks}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 p-3 sm:p-4 text-slate-800 ring-1 ring-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Order summary</h3>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({totals.quantity} items)</span>
              <span className="font-mono font-semibold">{formatMoney(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>
                  Discount {invoice.discountType === 'percentage' && Number(invoice.discountValue) > 0 && `(${invoice.discountValue}%)`}
                </span>
                <span className="font-mono font-semibold">
                  − {formatMoney(totals.discountAmount)}
                </span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  {invoice.taxName || 'Tax'}{' '}
                  {invoice.taxType === 'percentage' && Number(invoice.taxRate) > 0 && `(${invoice.taxRate}%)`}
                </span>
                <span className="font-mono font-semibold">
                  + {formatMoney(totals.taxAmount)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-slate-300 pt-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500">Total due</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {formatMoney(totals.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Currency</p>
                <p className="font-bold">RM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="invoice-footer mt-auto border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Thank you for your business!</p>
            <p className="mt-0.5">Please pay by the due date to avoid late fees.</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-700">{invoice.shopName}</p>
            <p className="mt-0.5">{invoice.shopEmail}</p>
            <p>{invoice.shopPhone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
