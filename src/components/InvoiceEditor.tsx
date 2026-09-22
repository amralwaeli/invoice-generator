import React, { useRef } from 'react';
import { InvoiceData, InvoiceItem, TemplateStyle } from '../types.ts';
import { CURRENCIES } from '../utils/currencies.ts';
import {
  Plus,
  Trash2,
  Copy,
  Upload,
  Image as ImageIcon,
  Building2,
  User,
  CreditCard,
  FileText,
  Palette,
  Percent,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

const ACCENT_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Navy Slate', hex: '#0f172a' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Teal Forest', hex: '#0f766e' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'Burnt Amber', hex: '#d97706' },
];

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  activeSection,
  setActiveSection,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateSender = (field: string, value: string) => {
    onChange({
      ...invoice,
      sender: { ...invoice.sender, [field]: value },
    });
  };

  const updateClient = (field: string, value: string) => {
    onChange({
      ...invoice,
      client: { ...invoice.client, [field]: value },
    });
  };

  const updatePayment = (field: string, value: string) => {
    onChange({
      ...invoice,
      payment: { ...invoice.payment, [field]: value },
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      quantity: 1,
      rate: 0,
    };
    onChange({
      ...invoice,
      items: [...invoice.items, newItem],
    });
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const nextItems = [...invoice.items];
    nextItems[index] = {
      ...nextItems[index],
      [field]: field === 'quantity' || field === 'rate' ? Number(value) : value,
    };
    onChange({
      ...invoice,
      items: nextItems,
    });
  };

  const handleDuplicateItem = (index: number) => {
    const itemToClone = invoice.items[index];
    const cloned: InvoiceItem = {
      ...itemToClone,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: `${itemToClone.description} (Copy)`,
    };
    const nextItems = [...invoice.items];
    nextItems.splice(index + 1, 0, cloned);
    onChange({
      ...invoice,
      items: nextItems,
    });
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = invoice.items.filter((_, i) => i !== index);
    onChange({
      ...invoice,
      items: nextItems,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB for fast browser export.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          ...invoice,
          logoUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onChange({ ...invoice, logoUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navItems = [
    { id: 'items', label: 'Items & Pricing', icon: FileText },
    { id: 'parties', label: 'Sender & Client', icon: Building2 },
    { id: 'details', label: 'Invoice Meta', icon: User },
    { id: 'totals', label: 'Taxes & Discounts', icon: Percent },
    { id: 'payment', label: 'Banking & Terms', icon: CreditCard },
    { id: 'styling', label: 'Template & Theme', icon: Palette },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Tab Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-2 overflow-x-auto flex gap-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.id === 'items' && invoice.items.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                  {invoice.items.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] space-y-6">
        {/* SECTION: ITEMS */}
        {activeSection === 'items' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Line Items</h3>
                <p className="text-xs text-slate-500">
                  Add deliverables, hourly rates, or products for this invoice.
                </p>
              </div>
              <button
                id="btn-add-item-top"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {invoice.items.map((item, idx) => {
                const rowTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Website Frontend Architecture & React Components"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 pt-6">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          title="Duplicate Item"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          title="Delete Item"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Quantity / Hours
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Unit Rate ({invoice.currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Total
                        </label>
                        <div className="h-8 flex items-center px-3 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-800">
                          {rowTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                id="btn-add-item-bottom"
                onClick={handleAddItem}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Add Another Line Item
              </button>
            </div>
          </div>
        )}

        {/* SECTION: SENDER & CLIENT */}
        {activeSection === 'parties' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Company Logo (Optional)
              </label>
              <div className="flex items-center gap-4">
                {invoice.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={invoice.logoUrl}
                      alt="Uploaded Logo"
                      className="h-16 w-32 object-contain bg-white p-2 rounded-lg border border-slate-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-[10px] shadow hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span>No logo</span>
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
                  >
                    {invoice.logoUrl ? 'Change Logo Image' : 'Upload Logo (PNG/JPEG)'}
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Client-side only. Stored locally, rendered directly into PDF.
                  </p>
                </div>
              </div>
            </div>

            {/* Sender (From) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Sender (Your Business)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Business / Sender Name
                  </label>
                  <input
                    type="text"
                    value={invoice.sender.name}
                    onChange={(e) => updateSender('name', e.target.value)}
                    placeholder="e.g. Acme Innovations LLC"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={invoice.sender.email}
                    onChange={(e) => updateSender('email', e.target.value)}
                    placeholder="billing@yourbiz.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={invoice.sender.phone}
                    onChange={(e) => updateSender('phone', e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={invoice.sender.address}
                    onChange={(e) => updateSender('address', e.target.value)}
                    placeholder="100 Main St, Suite 200"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    City, State, Zip
                  </label>
                  <input
                    type="text"
                    value={invoice.sender.cityStateZip}
                    onChange={(e) => updateSender('cityStateZip', e.target.value)}
                    placeholder="Seattle, WA 98101"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={invoice.sender.country}
                    onChange={(e) => updateSender('country', e.target.value)}
                    placeholder="United States"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Tax ID / VAT Registration #
                  </label>
                  <input
                    type="text"
                    value={invoice.sender.taxId || ''}
                    onChange={(e) => updateSender('taxId', e.target.value)}
                    placeholder="e.g. US-12345678 or GB12345678"
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Client (To) */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Client (Bill To)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Client Name or Company
                  </label>
                  <input
                    type="text"
                    value={invoice.client.name}
                    onChange={(e) => updateClient('name', e.target.value)}
                    placeholder="Client Company Inc."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={invoice.client.email}
                    onChange={(e) => updateClient('email', e.target.value)}
                    placeholder="accounts@client.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={invoice.client.phone}
                    onChange={(e) => updateClient('phone', e.target.value)}
                    placeholder="+1 (555) 987-6543"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Address</label>
                  <input
                    type="text"
                    value={invoice.client.address}
                    onChange={(e) => updateClient('address', e.target.value)}
                    placeholder="500 Tech Blvd"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    City, State, Zip
                  </label>
                  <input
                    type="text"
                    value={invoice.client.cityStateZip}
                    onChange={(e) => updateClient('cityStateZip', e.target.value)}
                    placeholder="Austin, TX 78701"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={invoice.client.country}
                    onChange={(e) => updateClient('country', e.target.value)}
                    placeholder="United States"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Client Tax / VAT ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={invoice.client.taxId || ''}
                    onChange={(e) => updateClient('taxId', e.target.value)}
                    placeholder="VAT-998877"
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoice.showShipping}
                  onChange={(e) => onChange({ ...invoice, showShipping: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Include separate Shipping Address
              </label>

              {invoice.showShipping && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    value={invoice.shippingAddress || ''}
                    onChange={(e) => onChange({ ...invoice, shippingAddress: e.target.value })}
                    placeholder="Warehouse Receiving, Dock 4, 1200 Logistics Way..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: DETAILS & META */}
        {activeSection === 'details' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Invoice Metadata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => onChange({ ...invoice, invoiceNumber: e.target.value })}
                  placeholder="INV-2026-001"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Currency
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => onChange({ ...invoice, currency: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => onChange({ ...invoice, issueDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => onChange({ ...invoice, dueDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  PO / Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={invoice.poNumber || ''}
                  onChange={(e) => onChange({ ...invoice, poNumber: e.target.value })}
                  placeholder="PO-99120"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Status Tag
                </label>
                <select
                  value={invoice.status}
                  onChange={(e) => onChange({ ...invoice, status: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Paid in Full</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Quick Due Date Presets */}
            <div className="pt-2">
              <label className="text-[11px] font-medium text-slate-500 block mb-1.5">
                Quick Due Date Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Due on Receipt', days: 0 },
                  { label: 'Net 15', days: 15 },
                  { label: 'Net 30', days: 30 },
                  { label: 'Net 60', days: 60 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const base = invoice.issueDate ? new Date(invoice.issueDate) : new Date();
                      base.setDate(base.getDate() + preset.days);
                      onChange({
                        ...invoice,
                        dueDate: base.toISOString().split('T')[0],
                      });
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: TOTALS, TAXES & DISCOUNTS */}
        {activeSection === 'totals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Taxes, Discounts & Adjustments</h3>

            {/* Discount */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-800 block">
                Discount
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={invoice.discountType}
                    onChange={(e) =>
                      onChange({ ...invoice, discountType: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({invoice.currency})</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invoice.discountValue}
                    onChange={(e) => onChange({ ...invoice, discountValue: Number(e.target.value) })}
                    className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-800 block">
                Tax / VAT / GST
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Tax Label
                  </label>
                  <input
                    type="text"
                    value={invoice.taxLabel}
                    onChange={(e) => onChange({ ...invoice, taxLabel: e.target.value })}
                    placeholder="VAT / Sales Tax / GST"
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invoice.taxRate}
                    onChange={(e) => onChange({ ...invoice, taxRate: Number(e.target.value) })}
                    className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Shipping & Amount Paid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Shipping Fee ({invoice.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoice.shippingFee}
                  onChange={(e) => onChange({ ...invoice, shippingFee: Number(e.target.value) })}
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Amount Already Paid ({invoice.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoice.amountPaid}
                  onChange={(e) => onChange({ ...invoice, amountPaid: Number(e.target.value) })}
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: PAYMENT & NOTES */}
        {activeSection === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Payment & Bank Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={invoice.payment.bankName}
                  onChange={(e) => updatePayment('bankName', e.target.value)}
                  placeholder="JPMorgan Chase / Barclays"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={invoice.payment.accountName}
                  onChange={(e) => updatePayment('accountName', e.target.value)}
                  placeholder="Apex Studio Labs Inc."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Account / IBAN Number
                </label>
                <input
                  type="text"
                  value={invoice.payment.accountNumber}
                  onChange={(e) => updatePayment('accountNumber', e.target.value)}
                  placeholder="1234567890 or GB..."
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Routing / SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  value={invoice.payment.routingOrSwift}
                  onChange={(e) => updatePayment('routingOrSwift', e.target.value)}
                  placeholder="ROUT123 or SWIFTCODE"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Online Payment / Stripe / PayPal Link (Optional)
                </label>
                <input
                  type="url"
                  value={invoice.payment.paymentLink || ''}
                  onChange={(e) => updatePayment('paymentLink', e.target.value)}
                  placeholder="https://pay.stripe.com/..."
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Notes & Thank You Message
                </label>
                <textarea
                  rows={2}
                  value={invoice.payment.notes}
                  onChange={(e) => updatePayment('notes', e.target.value)}
                  placeholder="Thank you for your business! Please quote invoice number on remittance."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={invoice.payment.terms}
                  onChange={(e) => updatePayment('terms', e.target.value)}
                  placeholder="Payment is due within 30 days. Overdue balances are subject to a late fee."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: STYLING & TEMPLATES */}
        {activeSection === 'styling' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Document Template Layout</h3>
              <p className="text-xs text-slate-500 mb-3">
                Choose the architectural style for your exported PDF and print document.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'modern', name: 'Modern Clean', desc: 'Balanced headers, soft badges, versatile' },
                  { id: 'executive', name: 'Executive Dark', desc: 'Prominent colored band, premium feel' },
                  { id: 'minimal', name: 'Minimalist Mono', desc: 'Typographic Swiss layout, high-contrast' },
                  { id: 'compact', name: 'Compact Dense', desc: 'Optimized spacing for complex line items' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onChange({ ...invoice, template: tpl.id as TemplateStyle })}
                    className={`p-3 text-left rounded-xl border transition ${
                      invoice.template === tpl.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{tpl.name}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Accent Color</h4>
              <div className="flex flex-wrap items-center gap-2.5">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onChange({ ...invoice, accentColor: c.hex })}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      invoice.accentColor === c.hex
                        ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}

                {/* Custom Color Picker */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-2">
                  <input
                    type="color"
                    value={invoice.accentColor || '#2563eb'}
                    onChange={(e) => onChange({ ...invoice, accentColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-[11px] font-mono text-slate-500">Custom</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
