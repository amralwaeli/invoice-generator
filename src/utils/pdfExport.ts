import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

const PDF_EXTENSION = '.pdf';
const PDF_MARGIN_MM = 8;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const EXPORTING_CLASS = 'is-exporting';

/**
 * Tracks the temporary export class per element. This prevents one overlapping
 * export from restoring interactive controls while another capture is running.
 */
const exportStates = new WeakMap<HTMLElement, { count: number; managesClass: boolean }>();

function reportProgress(options: PDFExportOptions, status: string) {
  try {
    options.onProgress?.(status);
  } catch (error) {
    // A presentation callback should not be able to abort a financial document export.
    console.warn('PDF export progress callback failed:', error);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Keeps download names portable across Windows, macOS, and browsers. The file
 * never touches the local filesystem, but a clean name avoids failed downloads
 * and confusing names such as "invoice.pdf.pdf".
 */
function sanitizeFilename(filename?: string): string {
  let baseName = (filename || 'invoice')
    .normalize('NFKC')
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, '-')
    .replace(/[\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .replace(/[. ]+$/g, '')
    .trim();

  if (!baseName || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(baseName)) {
    baseName = 'invoice';
  }

  // Leave room for the extension while keeping names practical in common file systems.
  return `${baseName.slice(0, 116) || 'invoice'}${PDF_EXTENSION}`;
}

function beginExport(element: HTMLElement): () => void {
  let state = exportStates.get(element);

  if (!state) {
    state = {
      count: 0,
      managesClass: !element.classList.contains(EXPORTING_CLASS),
    };
    exportStates.set(element, state);
  }

  if (state.count === 0 && state.managesClass) {
    element.classList.add(EXPORTING_CLASS);
  }

  state.count += 1;

  return () => {
    const current = exportStates.get(element);
    if (!current) return;

    current.count -= 1;
    if (current.count > 0) return;

    if (current.managesClass) {
      element.classList.remove(EXPORTING_CLASS);
    }
    exportStates.delete(element);
  };
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0);
      return;
    }

    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function waitForImage(image: HTMLImageElement, timeoutMs = 4000): Promise<void> {
  if (image.complete) {
    return image.decode ? image.decode().catch(() => undefined) : Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      resolve();
    };

    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
    timeoutId = setTimeout(finish, timeoutMs);
  });
}

async function waitForStableLayout(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(images.map((image) => waitForImage(image)));

  // Font loading is best effort: older browsers simply skip this branch.
  const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  try {
    await fonts?.ready;
  } catch {
    // The fallback font is still suitable for export.
  }

  await nextFrame();
}

/**
 * Returns positions where a page can safely end. Invoice rows are the most
 * important boundaries: choosing a row start prevents a multi-page export
 * from cutting the corresponding line item in half.
 */
function collectSafeBreakOffsets(element: HTMLElement): number[] {
  const rootRect = element.getBoundingClientRect();
  const candidates = new Set<number>();

  const addOffset = (node: Element) => {
    const rect = node.getBoundingClientRect();
    const offset = rect.top - rootRect.top;
    if (offset > 1 && offset < rootRect.height - 1) {
      candidates.add(Math.round(offset));
    }
  };

  // Direct children preserve major invoice sections together when they fit.
  Array.from(element.children).forEach(addOffset);
  // Tables and rows make reliable boundaries without requiring any App markup changes.
  element
    .querySelectorAll('table, tr, .pdf-keep-together, [data-pdf-keep-together]')
    .forEach(addOffset);

  return Array.from(candidates).sort((a, b) => a - b);
}

interface PdfSlice {
  top: number;
  height: number;
}

function planPageSlices(
  totalHeight: number,
  maximumPageHeight: number,
  safeBreakOffsets: number[]
): PdfSlice[] {
  const slices: PdfSlice[] = [];
  const minimumUsefulPageHeight = Math.floor(maximumPageHeight * 0.45);
  let top = 0;

  while (top < totalHeight) {
    const remaining = totalHeight - top;
    if (remaining <= maximumPageHeight) {
      slices.push({ top, height: remaining });
      break;
    }

    const idealEnd = top + maximumPageHeight;
    const earliestSafeEnd = top + minimumUsefulPageHeight;
    const safeEnd = safeBreakOffsets
      .filter((offset) => offset >= earliestSafeEnd && offset < idealEnd)
      .pop();
    const end = safeEnd && safeEnd > top ? safeEnd : idealEnd;

    slices.push({ top, height: Math.max(1, end - top) });
    top = end;
  }

  return slices;
}

function createCanvasSlice(source: HTMLCanvasElement, top: number, height: number): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = height;

  const context = slice.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare a PDF page canvas.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, top, source.width, height, 0, 0, slice.width, slice.height);
  return slice;
}

/**
 * Client-side PDF generator using html2canvas and jsPDF. It renders a clean,
 * high-resolution invoice and slices long documents at invoice-row boundaries
 * where possible, rather than repeatedly positioning one oversized image.
 */
export async function generateInvoicePDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  if (!element) {
    throw new Error('A valid invoice element is required to generate a PDF.');
  }

  const endExport = beginExport(element);
  let canvas: HTMLCanvasElement | null = null;

  try {
    reportProgress(options, 'Preparing document...');
    await waitForStableLayout(element);

    const safeBreakOffsets = collectSafeBreakOffsets(element);
    reportProgress(options, 'Rendering high-resolution document...');

    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas) {
      throw new Error('The invoice could not be rendered for PDF export.');
    }

    if (!canvas.width || !canvas.height) {
      throw new Error('The invoice could not be rendered for PDF export.');
    }

    const contentWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const contentHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const maximumPageHeight = Math.max(
      1,
      Math.floor((contentHeight * canvas.width) / contentWidth)
    );
    const cssToCanvasScale = canvas.width / Math.max(1, element.scrollWidth);
    const canvasHeight = canvas.height;
    const canvasBreakOffsets = safeBreakOffsets
      .map((offset) => Math.round(offset * cssToCanvasScale))
      .filter((offset) => offset > 0 && offset < canvasHeight);
    const slices = planPageSlices(canvas.height, maximumPageHeight, canvasBreakOffsets);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (const [index, slicePlan] of slices.entries()) {
      reportProgress(options, `Formatting page ${index + 1} of ${slices.length}...`);
      if (index > 0) pdf.addPage();

      const pageCanvas = createCanvasSlice(canvas, slicePlan.top, slicePlan.height);
      try {
        const imageData = pageCanvas.toDataURL('image/jpeg', 0.96);
        const pageHeight = (slicePlan.height * contentWidth) / canvas.width;
        pdf.addImage(imageData, 'JPEG', PDF_MARGIN_MM, PDF_MARGIN_MM, contentWidth, pageHeight);
      } finally {
        // Promptly release each temporary page bitmap on long invoices.
        pageCanvas.width = 1;
        pageCanvas.height = 1;
      }
    }

    reportProgress(options, 'Downloading PDF file...');
    pdf.save(sanitizeFilename(options.filename));
  } catch (error) {
    console.error('Client-side PDF generation failed:', error);
    throw new Error(`Could not generate the PDF: ${getErrorMessage(error)}`);
  } finally {
    // Re-enable controls even when rendering, image decoding, or download fails.
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    endExport();
  }
}

/**
 * Triggers the native print dialog when possible, and falls back to a
 * print-ready PDF in sandboxed previews or blocked print contexts.
 */
export async function printInvoice(
  element?: HTMLElement | null,
  options?: { filename?: string; onProgress?: (status: string) => void }
): Promise<{ method: 'native' | 'pdf_download'; error?: string }> {
  const isInIframe = window.self !== window.top;

  if (!isInIframe) {
    try {
      window.print();
      return { method: 'native' };
    } catch (error) {
      console.warn('Native window.print() failed:', error);
    }
  }

  if (element) {
    try {
      await generateInvoicePDF(element, {
        filename: options?.filename || 'Yaman_Mart_Invoice.pdf',
        onProgress: options?.onProgress,
      });
      return { method: 'pdf_download' };
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Print-ready PDF generation failed:', error);
      return { method: 'pdf_download', error: message };
    }
  }

  return {
    method: 'native',
    error: 'Browser printing is unavailable and no invoice element was provided for PDF fallback.',
  };
}
