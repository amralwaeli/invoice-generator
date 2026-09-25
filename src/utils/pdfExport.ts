import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

const PDF_EXTENSION = '.pdf';
const PDF_MARGIN_MM = 12;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const EXPORT_SCALE = 3;

function reportProgress(options: PDFExportOptions, status: string) {
  try { options.onProgress?.(status); } catch { /* noop */ }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
  return `${baseName.slice(0, 116) || 'invoice'}${PDF_EXTENSION}`;
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

async function waitForImage(image: HTMLImageElement, timeoutMs = 5000): Promise<void> {
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
  const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  try { await fonts?.ready; } catch { /* fine */ }
  await nextFrame();
}

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
  Array.from(element.children).forEach(addOffset);
  element.querySelectorAll('table, tr, .pdf-keep-together, [data-pdf-keep-together]').forEach(addOffset);
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
  if (!context) throw new Error('Could not prepare a PDF page canvas.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, top, source.width, height, 0, 0, slice.width, slice.height);
  return slice;
}

export async function generateInvoicePDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  if (!element) {
    throw new Error('A valid invoice element is required to generate a PDF.');
  }

  const wasExporting = element.classList.contains('is-exporting');
  element.classList.add('is-exporting');

  // Capture references before hiding
  const editorPanel = document.querySelector('.editor-panel') as HTMLElement | null;
  const headerEl = document.querySelector('header') as HTMLElement | null;
  const libraryModal = document.querySelector('[aria-modal="true"]') as HTMLElement | null;
  const editableInputs = Array.from(element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'));

  // Hide app chrome for clean capture
  const hiddenElements: HTMLElement[] = [];
  if (editorPanel) { editorPanel.style.display = 'none'; hiddenElements.push(editorPanel); }
  if (headerEl) { headerEl.style.display = 'none'; hiddenElements.push(headerEl); }
  if (libraryModal) { libraryModal.style.display = 'none'; hiddenElements.push(libraryModal); }

  const originalInputValues: Array<{ el: Element; value: string }> = [];
  editableInputs.forEach((el) => {
    const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
    originalInputValues.push({ el, value: inputEl.value });
    (el as HTMLElement).style.display = 'none';
  });

  // Force reflow
  void element.offsetHeight;
  await nextFrame();

  let canvas: HTMLCanvasElement | null = null;
  let isComplete = false;

  try {
    reportProgress(options, 'Preparing document...');
    await waitForStableLayout(element);

    reportProgress(options, 'Rendering high-resolution document...');
    canvas = await html2canvas(element, {
      scale: EXPORT_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (doc) => {
        const cloneEditor = doc.querySelector('.editor-panel') as HTMLElement | null;
        if (cloneEditor) cloneEditor.style.display = 'none';
        const cloneHeader = doc.querySelector('header') as HTMLElement | null;
        if (cloneHeader) cloneHeader.style.display = 'none';
      },
    });

    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error('The invoice could not be rendered for PDF export.');
    }

    if (canvas.width < 100 || canvas.height < 100) {
      throw new Error('The rendered invoice is too small — display may have been hidden.');
    }

    const contentWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const contentHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const maxPageHeightPx = Math.floor((contentHeight * canvas.width) / contentWidth);
    const cssToCanvasScale = canvas.width / Math.max(1, element.scrollWidth);
    const canvasHeight = canvas.height;
    const canvasBreakOffsets = collectSafeBreakOffsets(element)
      .map((offset) => Math.round(offset * cssToCanvasScale))
      .filter((offset) => offset > 0 && offset < canvasHeight);
    const slices = planPageSlices(canvasHeight, maxPageHeightPx, canvasBreakOffsets);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    for (const [index, slicePlan] of slices.entries()) {
      reportProgress(options, `Formatting page ${index + 1} of ${slices.length}...`);
      if (index > 0) pdf.addPage();
      const pageCanvas = createCanvasSlice(canvas, slicePlan.top, slicePlan.height);
      try {
        const imageData = pageCanvas.toDataURL('image/jpeg', 0.96);
        const pageHeight = (slicePlan.height * contentWidth) / canvas.width;
        pdf.addImage(imageData, 'JPEG', PDF_MARGIN_MM, PDF_MARGIN_MM, contentWidth, pageHeight);
      } finally {
        pageCanvas.width = 1;
        pageCanvas.height = 1;
      }
    }

    reportProgress(options, 'Downloading PDF file...');
    pdf.save(sanitizeFilename(options.filename));
    isComplete = true;
  } catch (error) {
    console.error('Client-side PDF generation failed:', error);
    throw new Error(`Could not generate the PDF: ${getErrorMessage(error)}`);
  } finally {
    if (canvas && !isComplete) {
      canvas.width = 1;
      canvas.height = 1;
    }
    // Restore everything
    if (editorPanel) editorPanel.style.display = '';
    if (headerEl) headerEl.style.display = '';
    if (libraryModal) libraryModal.style.display = '';
    editableInputs.forEach((el, i) => {
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
      (el as HTMLElement).style.display = '';
      if (i < originalInputValues.length) {
        inputEl.value = originalInputValues[i].value;
      }
    });
    if (!wasExporting) {
      element.classList.remove('is-exporting');
    }
  }
}

export async function printInvoice(
  element?: HTMLElement | null,
  options?: { filename?: string; onProgress?: (status: string) => void }
): Promise<{ method: 'pdf_download'; error?: string; success: boolean }> {
  if (!element) {
    return { method: 'pdf_download', error: 'Invoice preview is unavailable.', success: false };
  }

  try {
    await generateInvoicePDF(element, {
      filename: options?.filename || 'Yaman_Mart_Invoice.pdf',
      onProgress: options?.onProgress,
    });
    return { method: 'pdf_download', success: true };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Print-ready PDF generation failed:', error);
    return { method: 'pdf_download', error: message, success: false };
  }
}
