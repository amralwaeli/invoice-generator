export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface BusinessDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  cityStateZip: string;
  country: string;
  taxId?: string;
}

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSwift: string;
  paymentLink?: string;
  notes: string;
  terms: string;
}

export type TemplateStyle = 'modern' | 'minimal' | 'executive' | 'compact';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface InvoiceData {
  id: string;
  title: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  poNumber?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  currency: string;
  logoUrl?: string;

  sender: BusinessDetails;
  client: BusinessDetails;
  shippingAddress?: string;
  showShipping: boolean;

  items: InvoiceItem[];

  discountType: 'percentage' | 'fixed';
  discountValue: number;

  taxRate: number;
  taxLabel: string;

  shippingFee: number;
  amountPaid: number;

  payment: PaymentDetails;
  template: TemplateStyle;
  accentColor: string;
}

export interface SavedInvoiceSummary {
  id: string;
  title: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  total: number;
  currency: string;
  updatedAt: number;
}
