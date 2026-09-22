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

  // Currency
  currencySymbol: string;
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
  logoUrl: './yaman_mart_banner.jpg',

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
  currencySymbol: 'RM',
};
