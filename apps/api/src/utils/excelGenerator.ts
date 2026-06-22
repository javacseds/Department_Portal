import ExcelJS from 'exceljs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

interface ExcelGenerateOptions {
  title: string;
  subtitle?: string;
  collegeName?: string;
  logoPath?: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  sheetName?: string;
  footerText?: string;
}

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'generated');

export async function generateExcel(options: ExcelGenerateOptions): Promise<string> {
  const {
    title, subtitle, collegeName, columns, data,
    sheetName = 'Report', footerText,
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CDDAS System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    properties: { tabColor: { argb: 'FF6366F1' } },
  });

  let currentRow = 1;

  // ── College Name (Title Row) ─────────────────────────────
  if (collegeName) {
    sheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const titleCell = sheet.getCell(currentRow, 1);
    titleCell.value = collegeName;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 30;
    currentRow++;
  }

  // ── Report Title ─────────────────────────────────────────
  sheet.mergeCells(currentRow, 1, currentRow, columns.length);
  const reportTitle = sheet.getCell(currentRow, 1);
  reportTitle.value = title;
  reportTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF6366F1' } };
  reportTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(currentRow).height = 25;
  currentRow++;

  // ── Subtitle ─────────────────────────────────────────────
  if (subtitle) {
    sheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const subCell = sheet.getCell(currentRow, 1);
    subCell.value = subtitle;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subCell.alignment = { horizontal: 'center' };
    sheet.getRow(currentRow).height = 18;
    currentRow++;
  }

  // ── Generated Date ────────────────────────────────────────
  sheet.mergeCells(currentRow, 1, currentRow, columns.length);
  const dateCell = sheet.getCell(currentRow, 1);
  dateCell.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
  dateCell.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
  dateCell.alignment = { horizontal: 'right' };
  currentRow++;

  // ── Empty row spacer ─────────────────────────────────────
  currentRow++;

  // ── Header Row ────────────────────────────────────────────
  const headerRow = sheet.getRow(currentRow);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF4338CA' } },
      bottom: { style: 'thin', color: { argb: 'FF4338CA' } },
      left: { style: 'thin', color: { argb: 'FF4338CA' } },
      right: { style: 'thin', color: { argb: 'FF4338CA' } },
    };
    sheet.getColumn(i + 1).width = col.width || 20;
  });
  headerRow.height = 28;
  currentRow++;

  // ── Data Rows ─────────────────────────────────────────────
  data.forEach((record, rowIndex) => {
    const dataRow = sheet.getRow(currentRow);
    const isEven = rowIndex % 2 === 0;

    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = record[col.key] as ExcelJS.CellValue;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        left: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      };
      if (col.style) Object.assign(cell, col.style);
    });

    dataRow.height = 22;
    currentRow++;
  });

  // ── Footer ────────────────────────────────────────────────
  if (footerText) {
    currentRow++;
    sheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const footerCell = sheet.getCell(currentRow, 1);
    footerCell.value = footerText;
    footerCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    footerCell.alignment = { horizontal: 'center' };
  }

  // ── Row count summary ────────────────────────────────────
  currentRow++;
  sheet.mergeCells(currentRow, 1, currentRow, columns.length);
  const summaryCell = sheet.getCell(currentRow, 1);
  summaryCell.value = `Total Records: ${data.length}`;
  summaryCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF6366F1' } };
  summaryCell.alignment = { horizontal: 'right' };

  // ── Save File ─────────────────────────────────────────────
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${uuidv4()}.xlsx`;
  const filePath = path.join(OUTPUT_DIR, filename);
  await workbook.xlsx.writeFile(filePath);

  return `/uploads/generated/${filename}`;
}
