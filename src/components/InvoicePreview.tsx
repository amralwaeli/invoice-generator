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
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200',
    sent: 'bg-amber-100 text-amber-800 border-amber-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusLabels = {
    paid: 'مدفوعة',
    overdue: 'متأخرة',
    sent: 'تستحق الدفع',
    draft: 'مسودة',
  };

  const status = invoice.status === 'paid'
    ? 'paid'
    : invoice.status === 'sent' && invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10)
      ? 'overdue'
      : invoice.status;

  return (
    <div className="flex min-h-[1024px] flex-col bg-white">
      {/* Header */}
      <div className="relative border-b-4 border-emerald-600 px-6 sm:px-8 pt-6 sm:pt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-16 sm:h-20 w-16 sm:w-20 overflow-hidden rounded-lg bg-emerald-50 ring-2 ring-emerald-100">
              <img
                src="/yaman_mart_banner.jpg"
                alt="Store logo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{invoice.shopName}</h1>
              {invoice.companyReg && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Reg. No: {invoice.companyReg}
                </p>
              )}
              <div className="mt-2 sm:mt-3 space-y-0.5 text-xs text-slate-600">
                <p>{invoice.shopAddress}</p>
                <p>{invoice.shopEmail}</p>
                <p>{invoice.shopPhone}</p>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 sm:px-4 sm:py-2 ring-1 ring-emerald-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Invoice</span>
            </div>
            <h2 className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-black text-slate-900">{invoice.invoiceNumber || '—'}</h2>
            <div className="mt-2 sm:mt-4 space-y-0.5 text-xs sm:text-sm">
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-500">تاريخ الإصدار:</span>
                <span className="font-semibold text-slate-900">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-500">تاريخ الاستحقاق:</span>
                <span className="font-semibold text-slate-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div className="rounded-xl bg-slate-50 p-4 sm:p-5 ring-1 ring-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">العميل</h3>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg font-bold text-slate-900">
              {invoice.customerName.trim() || 'عميل غير مسجل'}
            </p>
            {invoice.customerPhone && (
              <p className="mt-1 text-sm text-slate-600">{invoice.customerPhone}</p>
            )}
          </div>
          <div className="flex items-end justify-end">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border ${statusColors[status]}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusLabels[status]}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-4 sm:px-8 pb-4 sm:pb-6">
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">#</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider">وصف</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold uppercase tracking-wider">الكمية</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold uppercase tracking-wider">السعر</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold uppercase tracking-wider">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-sm text-slate-500">
                      لا توجد عناصر بعد
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
                          {item.description.trim() || 'وصف العنصر'}
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
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_320px] gap-4 sm:gap-8 px-4 sm:px-8 pb-4 sm:pb-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl bg-emerald-50 p-4 sm:p-5 ring-1 ring-emerald-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              معلومات الدفع
            </h3>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">اسم البنك</span>
                <span className="font-semibold text-slate-900">{invoice.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">اسم الحساب</span>
                <span className="font-semibold text-slate-900">{invoice.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">رقم الحساب</span>
                <span className="font-mono font-bold text-emerald-700">{invoice.accountNumber}</span>
              </div>
            </div>
            {invoice.notes && (
              <p className="mt-3 sm:mt-4 border-t border-emerald-200 pt-2 sm:pt-3 text-xs leading-relaxed text-emerald-900">
                {invoice.notes}
              </p>
            )}
          </div>
          {invoice.remarks && (
            <div className="rounded-xl bg-slate-50 p-4 sm:p-5 ring-1 ring-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                الشروط والأحكام
              </h3>
              <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-slate-700">{invoice.remarks}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-900 p-4 sm:p-6 text-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">مجموع الطلب</h3>
          <div className="mt-3 sm:mt-5 space-y-2 sm:space-y-3 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>المجموع الجزئي ({totals.quantity} عناصر)</span>
              <span className="font-mono font-semibold">{formatMoney(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>
                  خصم {invoice.discountType === 'percentage' && Number(invoice.discountValue) > 0 && `(${invoice.discountValue}%)`}
                </span>
                <span className="font-mono font-semibold">
                  − {formatMoney(totals.discountAmount)}
                </span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>
                  {invoice.taxName || 'ضريبة'}{' '}
                  {invoice.taxType === 'percentage' && Number(invoice.taxRate) > 0 && `(${invoice.taxRate}%)`}
                </span>
                <span className="font-mono font-semibold">
                  + {formatMoney(totals.taxAmount)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 sm:mt-5 border-t-2 border-emerald-500 pt-4 sm:pt-5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400">المبلغ الإجمالي المستحق</p>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatMoney(totals.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">العملة</p>
                <p className="font-bold">RM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-200 px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">شكراً لتجارتك معنا!</p>
            <p className="mt-0.5">يرجى الدفع خلال الموعد النهائي لتجنب الغرامات المتأخرة.</p>
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
