import React, { useState } from 'react';
import { X, Check, Copy, BookOpen, ShieldCheck, FileDown, Layers, Terminal } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [copiedAction, setCopiedAction] = useState(false);

  if (!isOpen) return null;

  const githubActionCode = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(githubActionCode);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Documentation & GitHub Pages Guide</h2>
              <p className="text-xs text-slate-500">Zero-backend client-side architecture & deployment steps</p>
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
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                100% Client-Side
              </div>
              <p className="text-xs text-slate-600">
                Zero server-side dependencies. All data is processed entirely in the user&apos;s browser memory and LocalStorage.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <FileDown className="w-4 h-4" />
                Browser PDF Engine
              </div>
              <p className="text-xs text-slate-600">
                Uses <code className="font-mono text-[11px] bg-emerald-100/80 px-1 py-0.5 rounded">jspdf</code> and <code className="font-mono text-[11px] bg-emerald-100/80 px-1 py-0.5 rounded">html2canvas</code> for 2x high-DPI A4 vector-ready PDF compilation.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                GitHub Pages Ready
              </div>
              <p className="text-xs text-slate-600">
                Produces static assets in <code className="font-mono text-[11px] bg-amber-100/80 px-1 py-0.5 rounded">dist/</code> that can be published to GitHub Pages with zero server config.
              </p>
            </div>
          </div>

          {/* Section: Hosting on GitHub Pages */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              How to Deploy to GitHub Pages
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed pl-1">
              <li>
                <strong className="text-slate-800">Push to GitHub:</strong> Commit and push this project repository to your GitHub account.
              </li>
              <li>
                <strong className="text-slate-800">Enable GitHub Pages:</strong> In your GitHub repository, navigate to <em>Settings &gt; Pages</em>. Under <em>Build and deployment &gt; Source</em>, select <strong>GitHub Actions</strong>.
              </li>
              <li>
                <strong className="text-slate-800">Add the Workflow:</strong> Create a file named <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">.github/workflows/deploy.yml</code> with the configuration below:
              </li>
            </ol>

            <div className="relative group">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-56 scrollbar-thin">
                <pre>{githubActionCode}</pre>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute top-3 right-3 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                {copiedAction ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: PDF Generation Technical Internals */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold text-slate-900">PDF Generation Capabilities</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This invoice creator gives you two complementary client-side export options:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-1">
              <li>
                <strong className="text-slate-800">Instant PDF Download:</strong> Converts the invoice DOM element to a crisp 2x resolution canvas, packs it into an A4 jsPDF container, and triggers direct browser file download without any print prompts or popups.
              </li>
              <li>
                <strong className="text-slate-800">Print / Native Browser PDF:</strong> Includes a dedicated <code className="font-mono text-slate-800">@media print</code> CSS stylesheet that hides all editor interfaces and outputs true vector text to the browser&apos;s native Print dialog (&quot;Save as PDF&quot;).
              </li>
              <li>
                <strong className="text-slate-800">Offline &amp; Privacy:</strong> No customer data, bank accounts, or financial figures are sent over the network. Everything is safe for confidential invoices.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
