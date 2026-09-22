import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DEFAULT_YAMAN_MART_INVOICE,
  SimpleInvoiceData,
  SimpleInvoiceItem,
} from './utils/yamanMartDefaults.ts';
import { generateInvoicePDF, printInvoice } from './utils/pdfExport.ts';

type Toast = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type DisplayStatus = 'draft' | 'sent' | 'paid' | 'overdue';

interface SavedInvoice {
  id: string;
  name: string;
  savedAt: number;
  invoice: SimpleInvoiceData;
}

const DRAFT_STORAGE_KEY = 'yaman_mart_invoice_studio_draft_v2';
const LIBRARY_STORAGE_KEY = 'yaman_mart_invoice_studio_library_v2';

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }

  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInDays(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function makeInvoiceNumber(): string {
  return 'YM-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
}

function createLineItem(): SimpleInvoiceItem {
  return {
    id: newId('line'),
    description: '',
    quantity: 1,
    unitPrice: '',
  };
}

function cloneDefaultInvoice(): SimpleInvoiceData {
  return {
    ...DEFAULT_YAMAN_MART_INVOICE,
    items: DEFAULT_YAMAN_MART_INVOICE.items.map((item) => ({ ...item })),
  };
}

function createBlankInvoice(): SimpleInvoiceData {
  return {
    ...cloneDefaultInvoice(),
    invoiceNumber: makeInvoiceNumber(),
    date: todayIso(),
    dueDate: dateInDays(14),
    status: 'draft',
    customerName: '',
    customerPhone: '',
    items: [],
    discountType: 'fixed',
    discountValue: 0,
    taxType: 'percentage',
    taxRate: 0,
  };
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumberInput(value: unknown, fallback: number | ''): number | '' {
  if (value === '') return '';
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function normalizeItems(value: unknown): SimpleInvoiceItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item) => ({
      id: readString(item.id, newId('line')),
      description: readString(item.description, ''),
      quantity: readNumberInput(item.quantity, 1),
      unitPrice: readNumberInput(item.unitPrice, ''),
    }));
}

function normalizeInvoice(value: unknown): SimpleInvoiceData {
  const defaults = cloneDefaultInvoice();
  if (!isRecord(value)) return defaults;

  const items = normalizeItems(value.items);
  const status =
    value.status === 'sent' || value.status === 'paid' || value.status === 'draft'
      ? value.status
      : defaults.status;

  return {
    ...defaults,
    invoiceNumber: readString(value.invoiceNumber, defaults.invoiceNumber),
    date: readString(value.date, defaults.date),
    dueDate: readString(value.dueDate, defaults.dueDate),
    status,
    customerName: readString(value.customerName, defaults.customerName),
    customerPhone: readString(value.customerPhone, defaults.customerPhone || ''),
    items: items.length > 0 ? items : defaults.items,
    discountType: value.discountType === 'percentage' ? 'percentage' : 'fixed',
    discountValue: readNumberInput(value.discountValue, 0),
    taxType: value.taxType === 'fixed' ? 'fixed' : 'percentage',
    taxRate: readNumberInput(value.taxRate, 0),
    taxName: readString(value.taxName, defaults.taxName),
    notes: readString(value.notes, defaults.notes),
    remarks: readString(value.remarks, defaults.remarks),
    currencySymbol: readString(value.currencySymbol, defaults.currencySymbol),
    logoUrl: defaults.logoUrl,
    shopName: defaults.shopName,
    companyReg: defaults.companyReg,
    shopAddress: defaults.shopAddress,
    shopEmail: readString(value.shopEmail, defaults.shopEmail),
    shopPhone: readString(value.shopPhone, defaults.shopPhone),
    bankName: defaults.bankName,
    accountName: defaults.accountName,
    accountNumber: defaults.accountNumber,
  };
}

function loadDraft(): SimpleInvoiceData {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem('yaman_mart_invoice');
    if (!saved) return createBlankInvoice();

    const parsed = JSON.parse(saved);
    const normalized = normalizeInvoice(parsed);
    return normalized.items.length === 0 || normalized.customerName === ''
      ? normalized
      : createBlankInvoice();
  } catch {
    return createBlankInvoice();
  }
}

function loadLibrary(): SavedInvoice[] {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .filter((entry) => isRecord(entry.invoice))
      .map((entry) => ({
        id: readString(entry.id, newId('draft')),
        name: readString(entry.name, 'Saved invoice'),
        savedAt: typeof entry.savedAt === 'number' ? entry.savedAt : Date.now(),
        invoice: normalizeInvoice(entry.invoice),
      }))
      .slice(0, 30);
  } catch {
    return [];
  }
}

function numericValue(value: number | ''): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function formatMoney(value: number, symbol: string): string {
  return (
    (symbol || 'RM') +
    ' ' +
    value.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
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

function filenameBase(invoice: SimpleInvoiceData): string {
  const safeNumber = (invoice.invoiceNumber || 'invoice')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return safeNumber || 'invoice';
}

function statusFor(invoice: SimpleInvoiceData): DisplayStatus {
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'sent' && invoice.dueDate && invoice.dueDate < todayIso()) return 'overdue';
  return invoice.status;
}

const statusDetails: Record<DisplayStatus, { label: string; className: string }> = {
  draft: {
    label: 'مسودة',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  sent: {
    label: 'تستحق الدفع',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  paid: {
    label: 'مدفوعة',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  overdue: {
    label: 'متأخرة',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
};

export default function App() {
  const [invoice, setInvoice] = useState<SimpleInvoiceData>(loadDraft);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>(loadLibrary);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => {
      return sum + numericValue(item.quantity) * numericValue(item.unitPrice);
    }, 0);
    const discountInput = numericValue(invoice.discountValue);
    const discountRequested =
      invoice.discountType === 'percentage'
        ? (subtotal * Math.min(discountInput, 100)) / 100
        : discountInput;
    const discountAmount = Math.min(discountRequested, subtotal);
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxInput = numericValue(invoice.taxRate);
    const taxAmount =
      invoice.taxType === 'percentage'
        ? (taxableAmount * Math.min(taxInput, 100)) / 100
        : taxInput;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      total: taxableAmount + taxAmount,
      quantity: invoice.items.reduce((sum, item) => sum + numericValue(item.quantity), 0),
    };
  }, [invoice]);

  const displayStatus = statusFor(invoice);
  const displayStatusInfo = statusDetails[displayStatus];

  const showToast = (type: Toast['type'], text: string, duration = 3800) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ type, text });
    toastTimerRef.current = window.setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(invoice));
    } catch {
      // A full or disabled browser store should never interrupt invoicing.
    }
  }, [invoice]);

  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(savedInvoices.slice(0, 30)));
    } catch {
      // The working draft continues to be usable if the library cannot persist.
    }
  }, [savedInvoices]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const updateInvoice = (updates: Partial<SimpleInvoiceData>) => {
    setInvoice((current) => ({ ...current, ...updates }));
  };

  const updateItem = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice',
    rawValue: string
  ) => {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item;
        if (field === 'description') return { ...item, description: rawValue };
        return {
          ...item,
          [field]: rawValue === '' ? '' : Math.max(0, Number(rawValue) || 0),
        };
      }),
    }));
  };

  const addItem = () => {
    setInvoice((current) => ({
      ...current,
      items: [...current.items, createLineItem()],
    }));
  };

  const duplicateItem = (id: string) => {
    setInvoice((current) => {
      const itemIndex = current.items.findIndex((item) => item.id === id);
      if (itemIndex < 0) return current;

      const items = [...current.items];
      const source = items[itemIndex];
      items.splice(itemIndex + 1, 0, {
        ...source,
        id: newId('line'),
        description: source.description ? source.description + ' (copy)' : '',
      });
      return { ...current, items };
    });
  };

  const removeItem = (id: string) => {
    setInvoice((current) => {
      if (current.items.length === 1) {
        return { ...current, items: [] };
      }
      return {
        ...current,
        items: current.items.filter((item) => item.id !== id),
      };
    });
  };

  const handleNewInvoice = () => {
    if (!window.confirm('Start a fresh invoice? Your current work is already autosaved.')) return;
    setInvoice(createBlankInvoice());
    setActiveDraftId(null);
    showToast('success', 'Fresh invoice created.');
  };

  const handleSaveDraft = () => {
    const draft: SavedInvoice = {
      id: activeDraftId || newId('draft'),
      name: (invoice.customerName.trim() || 'Walk-in customer') + ' — ' + invoice.invoiceNumber,
      savedAt: Date.now(),
      invoice: normalizeInvoice(invoice),
    };

    setSavedInvoices((current) => {
      const withoutCurrent = current.filter((entry) => entry.id !== draft.id);
      return [draft, ...withoutCurrent].slice(0, 30);
    });
    setActiveDraftId(draft.id);
    showToast('success', 'Invoice saved to your browser library.');
  };

  const handleLoadDraft = (draft: SavedInvoice) => {
    setInvoice(normalizeInvoice(draft.invoice));
    setActiveDraftId(draft.id);
    setIsLibraryOpen(false);
    showToast('success', 'Saved invoice loaded.');
  };

  const handleDeleteDraft = (id: string) => {
    setSavedInvoices((current) => current.filter((entry) => entry.id !== id));
    if (activeDraftId === id) setActiveDraftId(null);
    showToast('info', 'Saved invoice removed.');
  };

  const handleDownloadData = () => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filenameBase(invoice) + '-backup.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast('success', 'Invoice backup downloaded.');
  };

  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result || ''));
        if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
          throw new Error('Invalid invoice backup');
        }
        setInvoice(normalizeInvoice(parsed));
        setActiveDraftId(null);
        setIsLibraryOpen(false);
        showToast('success', 'Invoice backup imported.');
      } catch {
        showToast('error', 'That file is not a valid invoice backup.');
      }
    };
    reader.onerror = () => showToast('error', 'The backup file could not be read.');
    reader.readAsText(file);
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) {
      showToast('error', 'Invoice preview is unavailable.');
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('Preparing your PDF…');
      await generateInvoicePDF(previewRef.current, {
        filename: filenameBase(invoice) + '.pdf',
        onProgress: setExportStatus,
      });
      showToast('success', 'PDF downloaded successfully.');
    } catch (error) {
      console.error('PDF export failed:', error);
      showToast('error', 'Could not create the PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  const handlePrint = async () => {
    if (!previewRef.current) {
      showToast('error', 'Invoice preview is unavailable.');
      return;
    }

    try {
      setIsPrinting(true);
      const result = await printInvoice(previewRef.current, {
        filename: filenameBase(invoice) + '.pdf',
        onProgress: setExportStatus,
      });
      showToast(
        'success',
        result.method === 'native' ? 'Print dialog opened.' : 'Print-ready PDF downloaded.'
      );
    } catch (error) {
      console.error('Print failed:', error);
      showToast('error', 'Could not prepare the invoice for printing.');
    } finally {
      setIsPrinting(false);
      setExportStatus('');
    }
  };

  const handleCopyAccount = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(invoice.accountNumber);
      setCopiedAccount(true);
      showToast('success', 'Account number copied.');
      window.setTimeout(() => setCopiedAccount(false), 1800);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = invoice.accountNumber;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand('copy');
        textArea.remove();
        if (!copied) throw new Error('Copy failed');
        setCopiedAccount(true);
        showToast('success', 'Account number copied.');
        window.setTimeout(() => setCopiedAccount(false), 1800);
      } catch {
        showToast('error', 'Copy was blocked. Please copy the number manually.');
      }
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">
                  Yaman Mart
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  استوديو الفاتورة
                </span>
              </div>
              <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                فواتير احترافية، محفوظة بشكل خاص في هذا المتصفح
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleNewInvoice}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">جديد</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">المكتبة</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden md:inline">حفظ المسودة</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isExporting}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isPrinting ? 'جارِ التحضير' : 'طباعة'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting || isPrinting}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{isExporting ? exportStatus || 'جارِ التصدير' : 'تحميل PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:py-8">
        <aside className="editor-panel space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700">مساحة الفاتورة</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-950">أنشئ بثقة</h2>
              </div>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                حفظ تلقائي
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <span className={labelClass}>رقم الفاتورة</span>
                <input
                  className={fieldClass}
                  value={invoice.invoiceNumber}
                  onChange={(event) => updateInvoice({ invoiceNumber: event.target.value })}
                  placeholder="YM-2026-000001"
                />
              </label>
              <label>
                <span className={labelClass}>تاريخ الإصدار</span>
                <input
                  type="date"
                  className={fieldClass}
                  value={invoice.date}
                  onChange={(event) => updateInvoice({ date: event.target.value })}
                />
              </label>
              <label>
                <span className={labelClass}>تاريخ الاستحقاق</span>
                <input
                  type="date"
                  className={fieldClass}
                  value={invoice.dueDate}
                  onChange={(event) => updateInvoice({ dueDate: event.target.value })}
                />
              </label>
            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">الفاتورة لصالح</h2>
                <p className="text-[11px] text-slate-500">تفاصيل العميل على الفاتورة النهائية</p>
              </div>
            </div>
            <div className="space-y-3">
              <label>
                <span className={labelClass}>العميل أو الشركة</span>
                <input
                  className={fieldClass}
                  value={invoice.customerName}
                  onChange={(event) => updateInvoice({ customerName: event.target.value })}
                  placeholder="اسم العميل"
                />
              </label>
              <label>
                <span className={labelClass}>رقم الهاتف <span className="normal-case tracking-normal">(اختياري)</span></span>
                <input
                  type="tel"
                  className={fieldClass}
                  value={invoice.customerPhone || ''}
                  onChange={(event) => updateInvoice({ customerPhone: event.target.value })}
                  placeholder="+60 12 345 6789"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">العناصر والتسعير</h2>
                <p className="text-[11px] text-slate-500">{invoice.items.length} عنصر</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-800"
              >
                <Plus className="h-3.5 w-3.5" />
                أضف عنصر
              </button>
            </div>

            <div className="space-y-3">
              {invoice.items.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      السطر {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateItem(item.id)}
                        aria-label={'Duplicate line ' + (index + 1)}
                        title="تكرار السطر"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-emerald-700"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={'Delete line ' + (index + 1)}
                        title="حذف السطر"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label={'Description for line ' + (index + 1)}
                    className={fieldClass}
                    value={item.description}
                    onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                    placeholder="وصف المنتج أو الخدمة"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">الكمية</span>
                      <input
                        aria-label={'Quantity for line ' + (index + 1)}
                        type="number"
                        min="0"
                        step="any"
                        className={fieldClass + ' font-mono'}
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">السعر</span>
                      <input
                        aria-label={'Unit price for line ' + (index + 1)}
                        type="number"
                        min="0"
                        step="0.01"
                        className={fieldClass + ' font-mono'}
                        value={item.unitPrice}
                        onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)}
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-right font-mono text-xs font-bold text-emerald-800">
                    {formatMoney(numericValue(item.quantity) * numericValue(item.unitPrice), invoice.currencySymbol)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">الشروط والتعديلات</h2>
                <p className="text-[11px] text-slate-500">الخصم، الضريبة، وملاحظات الدفع</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelClass}>نوع الخصم</span>
                <select
                  className={fieldClass}
                  value={invoice.discountType}
                  onChange={(event) =>
                    updateInvoice({
                      discountType: event.target.value === 'percentage' ? 'percentage' : 'fixed',
                    })
                  }
                >
                  <option value="fixed">المبلغ (RM)</option>
                  <option value="percentage">النسبة (%)</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>قيمة الخصم</span>
                <input
                  type="number"
                  min="0"
                  max={invoice.discountType === 'percentage' ? 100 : undefined}
                  step={invoice.discountType === 'percentage' ? 1 : 0.01}
                  className={fieldClass + ' font-mono'}
                  value={invoice.discountValue}
                  onChange={(event) =>
                    updateInvoice({
                      discountValue: event.target.value === '' ? '' : Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </label>
              <label>
                <span className={labelClass}>اسم الضريبة</span>
                <input
                  className={fieldClass}
                  value={invoice.taxName}
                  onChange={(event) => updateInvoice({ taxName: event.target.value })}
                  placeholder="ضريبة / SST"
                />
              </label>
              <label>
                <span className={labelClass}>نوع الضريبة</span>
                <select
                  className={fieldClass}
                  value={invoice.taxType}
                  onChange={(event) =>
                    updateInvoice({
                      taxType: event.target.value === 'fixed' ? 'fixed' : 'percentage',
                    })
                  }
                >
                  <option value="percentage">النسبة (%)</option>
                  <option value="fixed">المبلغ (RM)</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className={labelClass}>قيمة الضريبة</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={invoice.taxType === 'percentage' ? 100 : undefined}
                    step={invoice.taxType === 'percentage' ? 0.5 : 0.01}
                    className={fieldClass + ' font-mono'}
                    value={invoice.taxRate}
                    onChange={(event) =>
                      updateInvoice({
                        taxRate: event.target.value === '' ? '' : Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                  {invoice.taxType === 'percentage' && (
                    <button
                      type="button"
                      onClick={() => updateInvoice({ taxRate: 6 })}
                      className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      ضبط 6%
                    </button>
                  )}
                </div>
              </label>
            </div>

            <label className="mt-4 block">
              <span className={labelClass}>ملاحظات تظهر في الفاتورة</span>
              <textarea
                rows={3}
                className={fieldClass + ' resize-y leading-relaxed'}
                value={invoice.remarks}
                onChange={(event) => updateInvoice({ remarks: event.target.value })}
                placeholder="شروط الدفع أو ملاحظات التسليم أو غيرها"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-800">جهة الدفع</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{invoice.bankName}</p>
                <p className="mt-0.5 font-mono text-xs font-bold tracking-wide text-slate-700">{invoice.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100"
              >
                {copiedAccount ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedAccount ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
            <p className="mt-3 border-t border-amber-200/80 pt-3 text-[11px] leading-relaxed text-amber-900/80">{invoice.notes}</p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="no-print mb-3 flex items-center justify-between gap-4 px-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">المستند المباشر</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">ما الذي يستلمه العميل</p>
            </div>
            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm sm:inline">
              تنسيق جاهز لـ A4
            </span>
          </div>

          <div className="overflow-x-auto pb-4">
            <div
              ref={previewRef}
              id="printable-invoice"
              className="invoice-document mx-auto min-h-[1120px] w-full max-w-[794px] bg-white p-4 text-slate-800 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200 sm:p-8 md:p-12"
            >
              <div className="flex min-h-[1024px] flex-col">
                <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={invoice.logoUrl || './yaman_mart_banner.jpg'}
                    alt="Store logo"
                    className="h-28 w-full object-cover bg-slate-100"
                  />
                </div>

                <div className="flex items-start justify-between gap-8 border-b-2 border-slate-900 pb-8">
                  <div className="max-w-[440px]">
                    <p className="text-xl font-black tracking-tight text-slate-950">{invoice.shopName}</p>
                    {invoice.companyReg && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                        Registration no. {invoice.companyReg}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">{invoice.shopAddress}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">{invoice.shopEmail}</p>
                    <p className="text-[11px] font-medium text-slate-500">{invoice.shopPhone}</p>
                  </div>

                  <div className="min-w-[180px] text-right">
                    <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950">INVOICE</h2>
                    <p className="mt-1 font-mono text-sm font-bold text-emerald-800">{invoice.invoiceNumber || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 py-8">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Bill to</p>
                    <p className="mt-3 text-base font-bold text-slate-900">{invoice.customerName.trim() || 'Walk-in customer'}</p>
                    {invoice.customerPhone && <p className="mt-1 text-xs text-slate-500">{invoice.customerPhone}</p>}
                  </div>
                  <dl className="space-y-2 text-right text-xs">
                    <div className="flex items-center justify-between gap-6">
                      <dt className="font-semibold uppercase tracking-wider text-slate-400">Issue date</dt>
                      <dd className="font-bold text-slate-800">{formatDate(invoice.date)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="font-semibold uppercase tracking-wider text-slate-400">Due date</dt>
                      <dd className="font-bold text-slate-800">{formatDate(invoice.dueDate)}</dd>
                    </div>
                  </dl>
                </div>

                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white">
                      <th className="w-12 rounded-l-lg px-3 py-3 text-center">#</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="w-20 px-3 py-3 text-center">Qty</th>
                      <th className="w-28 px-3 py-3 text-right">Rate</th>
                      <th className="w-32 rounded-r-lg px-3 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                          لا توجد عناصر مضافة بعد. أضف كل عنصر واحدًا تلو الآخر.
                        </td>
                      </tr>
                    ) : (
                      invoice.items.map((item, index) => {
                        const lineTotal = numericValue(item.quantity) * numericValue(item.unitPrice);
                        return (
                          <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/70' : ''}>
                            <td className="px-3 py-4 text-center font-mono text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</td>
                            <td className="px-3 py-4 text-sm font-semibold text-slate-800">
                              {item.description.trim() || 'Item description'}
                            </td>
                            <td className="px-3 py-4 text-center font-mono text-xs font-semibold text-slate-600">
                              {numericValue(item.quantity)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-slate-600">
                              {formatMoney(numericValue(item.unitPrice), invoice.currencySymbol)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs font-extrabold text-slate-900">
                              {formatMoney(lineTotal, invoice.currencySymbol)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="mt-8 grid grid-cols-[1fr_260px] gap-10">
                  <div className="space-y-5">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-800">تفاصيل الدفع</p>
                      <div className="mt-3 grid grid-cols-[100px_1fr] gap-y-1.5 text-xs">
                        <span className="font-medium text-slate-500">Bank</span>
                        <span className="font-bold text-slate-800">{invoice.bankName}</span>
                        <span className="font-medium text-slate-500">Account name</span>
                        <span className="font-bold text-slate-800">{invoice.accountName}</span>
                        <span className="font-medium text-slate-500">Account no.</span>
                        <span className="font-mono font-extrabold tracking-wide text-slate-900">{invoice.accountNumber}</span>
                      </div>
                      <p className="mt-3 border-t border-amber-200/80 pt-3 text-[10px] leading-relaxed text-amber-900/80">{invoice.notes}</p>
                    </div>

                    {invoice.remarks.trim() && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Remarks</p>
                        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">{invoice.remarks}</p>
                      </div>
                    )}
                  </div>

                  <div className="self-start rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                    <div className="flex justify-between gap-4 py-1.5 text-slate-600">
                      <span>Items ({totals.quantity})</span>
                      <span className="font-mono font-semibold">{formatMoney(totals.subtotal, invoice.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between gap-4 py-1.5 text-slate-600">
                      <span>
                        Discount
                        {numericValue(invoice.discountValue) > 0 && invoice.discountType === 'percentage'
                          ? ' (' + numericValue(invoice.discountValue) + '%)'
                          : ''}
                      </span>
                      <span className="font-mono font-semibold text-emerald-800">− {formatMoney(totals.discountAmount, invoice.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-slate-200 py-1.5 text-slate-600">
                      <span>
                        {invoice.taxName.trim() || 'Tax'}
                        {numericValue(invoice.taxRate) > 0 && invoice.taxType === 'percentage'
                          ? ' (' + numericValue(invoice.taxRate) + '%)'
                          : ''}
                      </span>
                      <span className="font-mono font-semibold">+ {formatMoney(totals.taxAmount, invoice.currencySymbol)}</span>
                    </div>
                    <div className="mt-3 flex justify-between gap-4 border-t-2 border-slate-900 pt-3">
                      <span className="font-extrabold uppercase tracking-wide text-slate-900">Total due</span>
                      <span className="font-mono text-base font-black text-emerald-800">{formatMoney(totals.total, invoice.currencySymbol)}</span>
                    </div>
                  </div>
                </div>

                <footer className="mt-auto pt-10 text-center">
                  <div className="border-t border-slate-200 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">شكراً لك على ثقتك بنا</p>
                    <p className="mt-1 text-[10px] text-slate-400">{invoice.shopName} · {invoice.shopAddress}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{invoice.shopEmail} · {invoice.shopPhone}</p>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </section>
      </main>

      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportData}
        className="hidden"
      />

      {isLibraryOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">Browser library</p>
                <h2 id="library-title" className="mt-1 text-lg font-extrabold tracking-tight text-slate-950">مسودات الفواتير المحفوظة</h2>
                <p className="mt-1 text-xs text-slate-500">احفظ أو حمل أو نقل بيانات الفاتورة بدون خادم.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                aria-label="Close invoice library"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  <Save className="h-4 w-4" />
                  حفظ المسودة الحالية
                </button>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  تصدير نسخة احتياطية
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  استيراد نسخة احتياطية
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">مسوداتك المحفوظة</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{savedInvoices.length}</span>
              </div>

              {savedInvoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <FolderOpen className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">لا توجد مسودات محفوظة</p>
                  <p className="mt-1 text-xs text-slate-500">احفظ الفاتورة الحالية للحفاظ على نسخة مسماة هنا.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedInvoices.map((draft) => (
                    <div key={draft.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/20">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">{draft.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDate(draft.invoice.date)} · {draft.invoice.items.length} lines · {formatMoney(
                            draft.invoice.items.reduce(
                              (sum, item) => sum + numericValue(item.quantity) * numericValue(item.unitPrice),
                              0
                            ),
                            draft.invoice.currencySymbol
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-700"
                      >
                        تحميل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        aria-label={'Delete ' + draft.name}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={
            'no-print fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl ' +
            (toast.type === 'success'
              ? 'border-emerald-700 bg-emerald-950 text-emerald-50'
              : toast.type === 'error'
                ? 'border-rose-700 bg-rose-950 text-rose-50'
                : 'border-sky-700 bg-sky-950 text-sky-50')
          }
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-current" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
