/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSchoolInitials(school?: any): string {
  if (!school) return 'DPS';
  if (typeof school === 'string') {
    const letters = school.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (letters.length >= 2 && letters.length <= 6) return letters;
    const words = school
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 0 && !/^(and|of|the|for|in|at|to)$/i.test(w));
    if (words.length >= 2) {
      return words.slice(0, 4).map((w: string) => w[0].toUpperCase()).join('');
    }
    return school.slice(0, 3).toUpperCase() || 'DPS';
  }
  if (school.school_code || school.code) {
    const code = school.school_code || school.code;
    const letters = code.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (letters.length >= 2 && letters.length <= 6) return letters;
  }
  if (school.school_name || school.name) {
    const name = school.school_name || school.name;
    const words = name
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 0 && !/^(and|of|the|for|in|at|to)$/i.test(w));
    if (words.length >= 2) {
      return words.slice(0, 4).map((w: string) => w[0].toUpperCase()).join('');
    }
    return name.slice(0, 3).toUpperCase();
  }
  return 'DPS';
}

export function printHtmlElement(elementId: string, docTitle?: string) {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  try {
    const existingFrame = document.getElementById('giterp-print-iframe');
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'giterp-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '1000px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    let stylesHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
      stylesHtml += el.outerHTML;
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <title>${docTitle || 'Official Fee Receipt'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
              background: #ffffff !important;
              color: #122A24 !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .print-wrapper {
              width: 100% !important;
              max-width: 640px !important;
              margin: 0 auto !important;
              padding: 10px !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .no-print, .print\\:hidden {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 4000);
      }
    }, 300);
  } catch (err) {
    console.error('[Print Helper Error]:', err);
    window.print();
  }
}

export function numberToWordsINR(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (n > 0) res += inWords(n);

  return 'Rupees ' + res.trim() + ' Only';
}


