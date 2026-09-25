export interface SimpleInvoiceItem {
  id: string;
  description: string;
  quantity: number | '';
  unitPrice: number | '';
}

export interface SimpleInvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid';
  customerName: string;
  customerPhone?: string;

  // Shop Details
  shopName: string;
  companyReg?: string;
  shopAddress: string;
  shopEmail: string;
  shopPhone: string;
  logoUrl: string;

  // Items
  items: SimpleInvoiceItem[];

  // Tax and Discount
  discountType: 'percentage' | 'fixed';
  discountValue: number | '';
  taxType: 'percentage' | 'fixed';
  taxRate: number | '';
  taxName: string;

  // Payment info & Remarks
  bankName: string;
  accountName: string;
  accountNumber: string;
  notes: string;
  remarks: string;
}

export const DEFAULT_YAMAN_MART_INVOICE: SimpleInvoiceData = {
  invoiceNumber: `YM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  status: 'draft',
  customerName: 'Cash / Walk-in Customer',
  customerPhone: '',

  shopName: 'Yaman Mart Sdn. Bhd.',
  companyReg: '201901046148 (1355478-V)',
  shopAddress: 'NO. 9, JALAN DATARAN LARKIN 1, TAMAN DATARAN LARKIN, 80350, JOHOR BAHRU, JOHOR.',
  shopEmail: 'mohd123alyosfyi@gmail.com',
  shopPhone: '+6011-11500277',
  logoUrl: '/yaman_mart_banner.jpg',

  items: [],

  discountType: 'fixed',
  discountValue: 0,
  taxType: 'percentage',
  taxRate: 0,
  taxName: 'SST / Tax',

  bankName: 'Maybank',
  accountName: 'Yaman Mart',
  accountNumber: '551593546985',
  notes: 'Thank you for shopping at Yaman Mart! For inquiries or bulk orders, please visit our store.',
  remarks: 'Goods sold are not returnable or refundable. All payments via Maybank transfer or Cash.',
};

export function numericValue(value: number | ''): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

export function formatMoney(value: number): string {
  return (
    'RM ' +
    value.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(value: string): string {
  if (!value) return '—';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return value;
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parts[0], parts[1] - 1, parts[2]));
}

export function makeInvoiceNumber(): string {
  return 'YM-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateInDays(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function filenameBase(invoice: SimpleInvoiceData): string {
  const safeNumber = (invoice.invoiceNumber || 'invoice')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return safeNumber || 'invoice';
}
