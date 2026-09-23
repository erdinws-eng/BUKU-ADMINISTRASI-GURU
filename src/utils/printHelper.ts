/**
 * Utility helper to handle printing in web environments and sandboxed iframes.
 * Creates an isolated printable document view, reveals print headers/signatures,
 * strips screen-only elements, and triggers the browser's native print preview dialog.
 */

export interface PrintWebOptions {
  title?: string;
  elementId?: string;
  customHtml?: string;
  paperOrientation?: 'portrait' | 'landscape';
}

export function printWebDocument(options: PrintWebOptions = {}): void {
  const {
    title = 'Dokumen Resmi Sekolah',
    elementId,
    customHtml,
    paperOrientation = 'portrait'
  } = options;

  let bodyContent = '';

  if (customHtml) {
    bodyContent = customHtml;
  } else {
    // Find target container: specified element, or main element, or body
    const targetElement = elementId
      ? document.getElementById(elementId)
      : (document.querySelector('main') || document.body);

    if (!targetElement) {
      console.warn('Target element to print was not found');
      return;
    }

    // Clone element so we can modify without affecting current live UI
    const clone = targetElement.cloneNode(true) as HTMLElement;

    // Strip interactive screen-only controls and popups
    clone.querySelectorAll('.no-print, button:not(.allow-print), nav, aside, [role="dialog"]').forEach((el) => el.remove());

    // Ensure official print headers and signatures are visible
    clone.querySelectorAll('.print-only, [class*="print:block"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.classList.remove('hidden');
      htmlEl.style.setProperty('display', 'block', 'important');
    });

    // Clean table presentation for print
    clone.querySelectorAll('table').forEach((tbl) => {
      tbl.style.setProperty('width', '100%', 'important');
      tbl.style.setProperty('border-collapse', 'collapse', 'important');
    });

    bodyContent = clone.innerHTML;
  }

  // Collect active style tags from the current document
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${headStyles}
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .web-print-toolbar {
      position: sticky;
      top: 0;
      z-index: 99999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .web-print-toolbar-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .web-print-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-web-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
      transition: background 0.2s;
    }
    .btn-web-print:hover {
      background: #047857;
    }
    .btn-web-close {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-web-close:hover {
      background: #475569;
    }
    .web-paper-container {
      padding: 24px 16px 48px;
      display: flex;
      justify-content: center;
    }
    .web-paper-sheet {
      background: #ffffff;
      width: ${paperOrientation === 'landscape' ? '297mm' : '210mm'};
      min-height: ${paperOrientation === 'landscape' ? '210mm' : '297mm'};
      padding: 16mm 14mm 18mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .print-only {
      display: block !important;
    }
    .no-print {
      display: none !important;
    }
    @media print {
      body {
        background: transparent !important;
      }
      .web-print-toolbar {
        display: none !important;
      }
      .web-paper-container {
        padding: 0 !important;
      }
      .web-paper-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        min-height: auto !important;
      }
      @page {
        size: A4 ${paperOrientation};
        margin: 12mm 10mm 12mm 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="web-print-toolbar">
    <div class="web-print-toolbar-title">
      <span>📄 Pratinjau Cetak Web — ${title}</span>
    </div>
    <div class="web-print-toolbar-actions">
      <button class="btn-web-print" onclick="window.print()">
        🖨️ Cetak Dokumen / Simpan PDF
      </button>
      <button class="btn-web-close" onclick="window.close()">
        ✕ Tutup
      </button>
    </div>
  </div>

  <div class="web-paper-container">
    <div class="web-paper-sheet">
      ${bodyContent}
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Print trigger error:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener,noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }
  } catch (err) {
    console.warn('Failed to open print window, falling back to in-page window.print:', err);
    window.print();
  }
}
