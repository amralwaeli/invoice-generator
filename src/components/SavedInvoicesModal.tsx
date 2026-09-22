import React, { useRef, useState } from 'react';
import { InvoiceData } from '../types.ts';
import { SAMPLE_INVOICE_DEV, SAMPLE_INVOICE_CONSULTING, BLANK_INVOICE_FACTORY } from '../utils/sampleData.ts';
import { formatCurrency } from '../utils/currencies.ts';
import { calculateInvoice } from '../utils/calculations.ts';
import { X, FolderOpen, Save, Download, Upload, Trash2, Sparkles, PlusCircle } from 'lucide-react';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvoice: InvoiceData;
  onLoadInvoice: (inv: InvoiceData) => void;
}

const STORAGE_KEY = 'client_invoice_generator_saved_list_v1';

export const SavedInvoicesModal: React.FC<SavedInvoicesModalProps> = ({
  isOpen,
  onClose,
  currentInvoice,
  onLoadInvoice,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saveTitle, setSaveTitle] = useState(
    currentInvoice.title || `${currentInvoice.sender.name || 'Invoice'} - ${currentInvoice.invoiceNumber}`
  );
  const [savedList, setSavedList] = useState<InvoiceData[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!isOpen) return null;

  const persistList = (list: InvoiceData[]) => {
    setSavedList(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const handleSaveCurrent = () => {
    const toSave: InvoiceData = {
      ...currentInvoice,
      title: saveTitle.trim() || `Invoice ${currentInvoice.invoiceNumber}`,
      id: currentInvoice.id || `inv-${Date.now()}`,
    };

    const existingIndex = savedList.findIndex((item) => item.id === toSave.id);
    let updated: InvoiceData[];
    if (existingIndex >= 0) {
      updated = [...savedList];
      updated[existingIndex] = toSave;
    } else {
      updated = [toSave, ...savedList];
    }

    persistList(updated);
    setSaveSuccessMsg('Invoice saved to browser storage!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedList.filter((item) => item.id !== id);
    persistList(updated);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentInvoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${currentInvoice.invoiceNumber || 'invoice'}_backup.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object' && parsed.invoiceNumber && parsed.items) {
            onLoadInvoice(parsed);
            onClose();
          } else {
            alert('Invalid invoice JSON structure.');
          }
        } catch {
          alert('Could not parse the selected JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage &amp; Load Invoices</h2>
              <p className="text-xs text-slate-500">Local browser storage and sample templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Save Active Invoice Card */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Save Current Invoice
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Give this draft a memorable title..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Save Draft
              </button>
            </div>
            {saveSuccessMsg && (
              <p className="text-xs text-emerald-600 font-medium">{saveSuccessMsg}</p>
            )}
          </div>

          {/* Quick Sample Presets */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Ready-Made Presets (1-Click Load)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onLoadInvoice(SAMPLE_INVOICE_DEV);
                  onClose();
                }}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-left transition"
              >
                <span className="text-xs font-bold text-slate-900 block">Web Development</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Frontend, PDF engine &amp; QA</span>
                <span className="text-[11px] font-mono text-blue-600 font-semibold block mt-1">
                  $7,382.40 USD
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadInvoice(SAMPLE_INVOICE_CONSULTING);
                  onClose();
                }}
                className="p-3 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 rounded-xl text-left transition"
              >
                <span className="text-xs font-bold text-slate-900 block">Strategic Consulting</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Architecture &amp; Workshops</span>
                <span className="text-[11px] font-mono text-teal-600 font-semibold block mt-1">
                  €11,184.00 EUR
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadInvoice(BLANK_INVOICE_FACTORY());
                  onClose();
                }}
                className="p-3 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-xl text-left transition"
              >
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                  <PlusCircle className="w-3 h-3 text-slate-500" />
                  Blank Invoice
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Start fresh with new details</span>
                <span className="text-[11px] font-mono text-slate-400 block mt-1">Clean slate</span>
              </button>
            </div>
          </div>

          {/* User Saved Invoices List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Saved In Local Storage ({savedList.length})
            </h3>
            {savedList.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                No saved drafts yet. Save your current invoice above to access it anytime in this browser.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {savedList.map((item) => {
                  const calc = calculateInvoice(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onLoadInvoice(item);
                        onClose();
                      }}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50/60 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.title || item.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.client.name || 'Client'} • #{item.invoiceNumber} • {item.issueDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {formatCurrency(calc.total, item.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSaved(item.id, e)}
                          title="Delete draft"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Import / Export JSON */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">Data Portability (Zero Server Required):</span>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Import JSON
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
