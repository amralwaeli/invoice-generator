import React from 'react';
import { InvoiceData } from '../types.ts';
import { formatCurrency } from '../utils/currencies.ts';
import { calculateInvoice } from '../utils/calculations.ts';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, previewRef }) => {
  const calc = calculateInvoice(invoice);

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    overdue: 'bg-rose-50 text-rose-700 border-rose-300',
  };

  const statusLabels = {
    draft: 'DRAFT',
    pending: 'PAYMENT PENDING',
    paid: 'PAID IN FULL',
    overdue: 'OVERDUE',
  };

  return (
    <div
      ref={previewRef}
      id="printable-invoice"
      className="bg-white text-slate-800 p-8 sm:p-12 mx-auto rounded-xl shadow-lg border border-slate-200 transition-all duration-200 w-full max-w-[820px] min-h-[1050px] flex flex-col justify-between"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* Template Style 1: Modern */}
        {invoice.template === 'modern' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
              <div className="flex items-start gap-4">
                {invoice.logoUrl ? (
                  <img
                    src={invoice.logoUrl}
                    alt="Company Logo"
                    className="h-16 max-w-[180px] object-contain rounded-md"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                    style={{ backgroundColor: invoice.accentColor || '#2563eb' }}
                  >
                    {invoice.sender.name ? invoice.sender.name.charAt(0).toUpperCase() : 'I'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {invoice.sender.name || 'Your Company Name'}
                  </h1>
                  <p className="text-sm text-slate-500 whitespace-pre-line mt-1">
                    {invoice.sender.address}
                    {invoice.sender.cityStateZip ? `, ${invoice.sender.cityStateZip}` : ''}
                    {invoice.sender.country ? `, ${invoice.sender.country}` : ''}
                  </p>
                  {(invoice.sender.email || invoice.sender.phone) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {invoice.sender.email} {invoice.sender.phone && `• ${invoice.sender.phone}`}
                    </p>
                  )}
                  {invoice.sender.taxId && (
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Tax/VAT ID: {invoice.sender.taxId}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      statusColors[invoice.status]
                    }`}
                  >
                    {statusLabels[invoice.status]}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  INVOICE
                </h2>
                <p className="text-sm font-mono font-medium text-slate-600 mt-1">
                  #{invoice.invoiceNumber || 'INV-001'}
                </p>
                {invoice.poNumber && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    PO Number: <span className="font-mono text-slate-600">{invoice.poNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bill To & Invoice Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Billed To
                </h3>
                <p className="text-base font-semibold text-slate-900">
                  {invoice.client.name || 'Client Name / Organization'}
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-line mt-1">
                  {invoice.client.address}
                  {invoice.client.cityStateZip ? `, ${invoice.client.cityStateZip}` : ''}
                  {invoice.client.country ? `, ${invoice.client.country}` : ''}
                </p>
                {(invoice.client.email || invoice.client.phone) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {invoice.client.email} {invoice.client.phone && `• ${invoice.client.phone}`}
                  </p>
                )}
                {invoice.client.taxId && (
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Tax/VAT ID: {invoice.client.taxId}
                  </p>
                )}

                {invoice.showShipping && invoice.shippingAddress && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Ship To
                    </h4>
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {invoice.shippingAddress}
                    </p>
                  </div>
                )}
              </div>

              <div className="sm:text-right flex flex-col justify-start sm:items-end">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 w-full sm:max-w-xs space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Issue Date:</span>
                    <span className="text-slate-800 font-semibold">{invoice.issueDate || '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Due Date:</span>
                    <span className="text-slate-900 font-bold">{invoice.dueDate || '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Balance Due:</span>
                    <span
                      className="font-bold text-sm font-mono"
                      style={{ color: invoice.accentColor || '#2563eb' }}
                    >
                      {formatCurrency(calc.balanceDue, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Style 2: Executive */}
        {invoice.template === 'executive' && (
          <div className="space-y-8">
            {/* Dark Accent Header */}
            <div
              className="-mx-8 -mt-8 sm:-mx-12 sm:-mt-12 p-8 text-white rounded-t-xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              style={{ backgroundColor: invoice.accentColor || '#0f172a' }}
            >
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold">
                  OFFICIAL INVOICE
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                  {invoice.sender.name || 'Your Company Name'}
                </h1>
                <p className="text-xs text-slate-200 opacity-90 mt-0.5">
                  {invoice.sender.address} • {invoice.sender.cityStateZip}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-300 block">INVOICE NUMBER</span>
                <span className="text-xl font-mono font-bold tracking-tight text-white">
                  #{invoice.invoiceNumber || 'INV-001'}
                </span>
                <div className="mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      statusColors[invoice.status]
                    }`}
                  >
                    {statusLabels[invoice.status]}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Client Account
                </h3>
                <p className="text-base font-bold text-slate-900">{invoice.client.name || 'Client Name'}</p>
                <p className="text-xs text-slate-600 whitespace-pre-line mt-1">
                  {invoice.client.address}
                  {invoice.client.cityStateZip ? `, ${invoice.client.cityStateZip}` : ''}
                </p>
                {invoice.client.taxId && (
                  <p className="text-xs font-mono text-slate-500 mt-1">VAT/Tax ID: {invoice.client.taxId}</p>
                )}
              </div>

              <div className="flex flex-col sm:items-end justify-center space-y-1.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 font-medium">Date of Issue: </span>
                  <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Payment Deadline: </span>
                  <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
                </div>
                {invoice.poNumber && (
                  <div>
                    <span className="text-slate-400 font-medium">Reference PO: </span>
                    <span className="font-mono text-slate-800">{invoice.poNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Template Style 3: Minimalist Mono */}
        {invoice.template === 'minimal' && (
          <div className="space-y-6">
            <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  {invoice.sender.name || 'Company Name'}
                </h1>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  {invoice.sender.address} | {invoice.sender.cityStateZip}
                </p>
              </div>
              <div className="text-left sm:text-right font-mono">
                <span className="text-xs text-slate-400 block uppercase">Invoice</span>
                <span className="text-xl font-bold text-slate-900">#{invoice.invoiceNumber}</span>
                <p className="text-xs text-slate-500 mt-1">Issued: {invoice.issueDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-2 text-sm">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block mb-1">To:</span>
                <p className="font-bold text-slate-900">{invoice.client.name}</p>
                <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{invoice.client.address}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono uppercase text-slate-400 block mb-1">Payment Due:</span>
                <p className="font-bold text-slate-900">{invoice.dueDate}</p>
                <span
                  className={`inline-block mt-2 text-[10px] font-mono px-2 py-0.5 border rounded uppercase ${
                    statusColors[invoice.status]
                  }`}
                >
                  {statusLabels[invoice.status]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Template Style 4: Compact */}
        {invoice.template === 'compact' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-300 pb-4">
              <div className="flex items-center gap-3">
                {invoice.logoUrl && (
                  <img src={invoice.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
                )}
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{invoice.sender.name}</h1>
                  <p className="text-xs text-slate-500">{invoice.sender.email} | {invoice.sender.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-slate-900">INVOICE #{invoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-500">Date: {invoice.issueDate} • Due: {invoice.dueDate}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs flex justify-between">
              <div>
                <span className="font-bold text-slate-700">Client: </span>
                <span>{invoice.client.name}</span>
                {invoice.client.address && <span className="text-slate-500"> — {invoice.client.address}</span>}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusColors[invoice.status]}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mt-8 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                style={{
                  borderColor:
                    invoice.template === 'minimal'
                      ? '#0f172a'
                      : invoice.accentColor
                      ? `${invoice.accentColor}33`
                      : '#e2e8f0',
                }}
              >
                <th className="py-3 px-2 text-slate-600 font-bold">Item & Description</th>
                <th className="py-3 px-2 text-center w-20 text-slate-600 font-bold">Qty</th>
                <th className="py-3 px-2 text-right w-28 text-slate-600 font-bold">Rate</th>
                <th className="py-3 px-2 text-right w-32 text-slate-600 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No line items added yet. Click &quot;+ Add Line Item&quot; to begin.
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, index) => {
                  const qty = Number(item.quantity) || 0;
                  const rate = Number(item.rate) || 0;
                  const lineTotal = qty * rate;

                  return (
                    <tr
                      key={item.id || index}
                      className={index % 2 === 1 && invoice.template === 'modern' ? 'bg-slate-50/50' : ''}
                    >
                      <td className="py-3.5 px-2">
                        <p className="font-semibold text-slate-900 leading-snug">
                          {item.description || 'Service or product description'}
                        </p>
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-slate-600">
                        {formatCurrency(rate, invoice.currency)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-8">
          {/* Payment & Bank Details on Left */}
          <div className="w-full sm:w-7/12 space-y-4">
            {(invoice.payment.bankName || invoice.payment.accountNumber || invoice.payment.routingOrSwift) && (
              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: invoice.accentColor || '#2563eb' }}
                  />
                  Payment Instructions
                </h4>
                {invoice.payment.bankName && (
                  <p>
                    <span className="font-medium text-slate-500">Bank:</span> {invoice.payment.bankName}
                  </p>
                )}
                {invoice.payment.accountName && (
                  <p>
                    <span className="font-medium text-slate-500">Account Name:</span>{' '}
                    {invoice.payment.accountName}
                  </p>
                )}
                {invoice.payment.accountNumber && (
                  <p>
                    <span className="font-medium text-slate-500">Account/IBAN:</span>{' '}
                    <span className="font-mono">{invoice.payment.accountNumber}</span>
                  </p>
                )}
                {invoice.payment.routingOrSwift && (
                  <p>
                    <span className="font-medium text-slate-500">Routing / SWIFT:</span>{' '}
                    <span className="font-mono">{invoice.payment.routingOrSwift}</span>
                  </p>
                )}
                {invoice.payment.paymentLink && (
                  <p className="pt-1">
                    <span className="font-medium text-slate-500">Online Payment:</span>{' '}
                    <a
                      href={invoice.payment.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-mono text-[11px] break-all"
                    >
                      {invoice.payment.paymentLink}
                    </a>
                  </p>
                )}
              </div>
            )}

            {invoice.payment.terms && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Terms & Conditions:</span>
                <p className="leading-relaxed">{invoice.payment.terms}</p>
              </div>
            )}
          </div>

          {/* Subtotal / Discount / Tax / Total Box */}
          <div className="w-full sm:w-5/12 flex flex-col justify-end">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium">
                  {formatCurrency(calc.subtotal, invoice.currency)}
                </span>
              </div>

              {calc.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>
                    Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}
                  </span>
                  <span className="font-mono font-medium">
                    -{formatCurrency(calc.discountAmount, invoice.currency)}
                  </span>
                </div>
              )}

              {calc.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{invoice.taxLabel || 'Tax'} ({invoice.taxRate}%)</span>
                  <span className="font-mono font-medium">
                    +{formatCurrency(calc.taxAmount, invoice.currency)}
                  </span>
                </div>
              )}

              {calc.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling</span>
                  <span className="font-mono font-medium">
                    +{formatCurrency(calc.shippingFee, invoice.currency)}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between pt-3 border-t-2 text-base font-bold text-slate-900"
                style={{
                  borderColor: invoice.template === 'minimal' ? '#0f172a' : invoice.accentColor || '#2563eb',
                }}
              >
                <span>Total</span>
                <span className="font-mono text-lg">
                  {formatCurrency(calc.total, invoice.currency)}
                </span>
              </div>

              {calc.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-xs text-slate-500 pt-1">
                    <span>Amount Paid</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      -{formatCurrency(calc.amountPaid, invoice.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                    <span className="text-slate-800">Balance Due</span>
                    <span
                      className="font-mono text-base"
                      style={{ color: invoice.accentColor || '#2563eb' }}
                    >
                      {formatCurrency(calc.balanceDue, invoice.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-600">
          {invoice.payment.notes || 'Thank you for your business!'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Generated with Client-Side Invoice Generator • No server required
        </p>
      </div>
    </div>
  );
};
