import puppeteer from 'puppeteer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'generated');

interface PDFOptions {
  html: string;
  filename?: string;
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: { top: string; right: string; bottom: string; left: string };
  headerTemplate?: string;
  footerTemplate?: string;
}

export async function generatePDF(options: PDFOptions): Promise<string> {
  const {
    html,
    format = 'A4',
    orientation = 'portrait',
    margin = { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    headerTemplate,
    footerTemplate,
  } = options;

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = options.filename || `${uuidv4()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, filename);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Inject print-safe CSS
    await page.addStyleTag({
      content: `
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { margin: 0; }
      `,
    });

    await page.pdf({
      path: filePath,
      format,
      landscape: orientation === 'landscape',
      margin,
      printBackground: true,
      displayHeaderFooter: !!(headerTemplate || footerTemplate),
      headerTemplate: headerTemplate || '<span></span>',
      footerTemplate: footerTemplate || `
        <div style="font-size:9px; color:#94A3B8; width:100%; text-align:center; padding: 0 15mm;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });

    return `/uploads/generated/${filename}`;
  } finally {
    await browser.close();
  }
}

export function buildDocumentHTML(options: {
  collegeName: string;
  logoUrl?: string;
  title: string;
  subtitle?: string;
  content: string;
  watermark?: string;
  principalSignature?: string;
  hodSignature?: string;
  date?: string;
  academicYear?: string;
  qrCodeUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #1E293B; line-height: 1.6; }
    .page { padding: 20mm 15mm; position: relative; min-height: 100vh; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt; color: rgba(0,0,0,0.04); font-weight: bold; pointer-events: none; z-index: 0; }
    .header { text-align: center; border-bottom: 3px double #6366F1; padding-bottom: 12px; margin-bottom: 20px; }
    .college-name { font-size: 18pt; font-weight: bold; color: #1E293B; }
    .document-title { font-size: 14pt; font-weight: bold; color: #6366F1; margin-top: 8px; }
    .subtitle { font-size: 10pt; color: #64748B; margin-top: 4px; }
    .content { margin: 20px 0; }
    .content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .content th { background: #6366F1; color: white; padding: 8px 12px; text-align: left; font-size: 10pt; }
    .content td { padding: 7px 12px; border: 1px solid #E2E8F0; font-size: 10pt; }
    .content tr:nth-child(even) td { background: #F8FAFC; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-block { text-align: center; }
    .signature-line { border-top: 1px solid #1E293B; width: 150px; margin: 0 auto; padding-top: 4px; font-size: 10pt; }
    .meta-info { font-size: 9pt; color: #94A3B8; text-align: right; margin-top: 8px; }
    .qr-code { position: absolute; bottom: 20mm; right: 15mm; }
    .academic-year-badge { display: inline-block; background: #EEF2FF; color: #6366F1;
      border: 1px solid #C7D2FE; border-radius: 4px; padding: 2px 8px; font-size: 9pt; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="page">
    ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
    <div class="header">
      ${options.logoUrl ? `<img src="${options.logoUrl}" alt="Logo" style="height:60px; margin-bottom:8px;" />` : ''}
      <div class="college-name">${options.collegeName}</div>
      <div class="document-title">${options.title}</div>
      ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
      ${options.academicYear ? `<span class="academic-year-badge">Academic Year: ${options.academicYear}</span>` : ''}
    </div>
    <div class="content">
      ${options.content}
    </div>
    <div class="footer">
      ${options.hodSignature ? `
        <div class="signature-block">
          <div class="signature-line">HOD</div>
        </div>
      ` : '<div></div>'}
      <div class="meta-info">
        <div>Date: ${options.date || new Date().toLocaleDateString('en-IN')}</div>
        <div>Document ID: ${Date.now()}</div>
      </div>
      ${options.principalSignature ? `
        <div class="signature-block">
          <div class="signature-line">Principal</div>
        </div>
      ` : '<div></div>'}
    </div>
    ${options.qrCodeUrl ? `<div class="qr-code"><img src="${options.qrCodeUrl}" width="60" height="60" /></div>` : ''}
  </div>
</body>
</html>`;
}
