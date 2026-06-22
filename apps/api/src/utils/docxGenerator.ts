import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, HeadingLevel, AlignmentType, ImageRun,
  Header, Footer, PageNumber, NumberFormat,
} from 'docx';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'generated');

interface DocxColumn {
  header: string;
  key: string;
  width?: number;
}

interface DocxOptions {
  title: string;
  collegeName: string;
  subtitle?: string;
  content?: string;
  tableColumns?: DocxColumn[];
  tableData?: Record<string, unknown>[];
  date?: string;
  academicYear?: string;
  includePageNumbers?: boolean;
}

export async function generateDocx(options: DocxOptions): Promise<string> {
  const {
    title, collegeName, subtitle, tableColumns, tableData,
    date, academicYear, includePageNumbers = true,
  } = options;

  const paragraphs: (Paragraph | Table)[] = [];

  // ── College Name ─────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      text: collegeName,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // ── Document Title ────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28,
          color: '6366F1',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // ── Subtitle / Academic Year ──────────────────────────────
  if (subtitle || academicYear) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle || '',
            italics: true,
            color: '64748B',
            size: 20,
          }),
          ...(academicYear ? [new TextRun({ text: ` | Academic Year: ${academicYear}`, color: '6366F1', size: 20 })] : []),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  // ── Date ─────────────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${date || new Date().toLocaleDateString('en-IN')}`,
          size: 18,
          color: '94A3B8',
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
    })
  );

  // ── Divider ───────────────────────────────────────────────
  paragraphs.push(new Paragraph({ text: '─'.repeat(70), spacing: { after: 200 } }));

  // ── Table ─────────────────────────────────────────────────
  if (tableColumns && tableData) {
    const headerRow = new TableRow({
      tableHeader: true,
      children: tableColumns.map((col) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: col.header, bold: true, color: 'FFFFFF', size: 18 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: '6366F1' },
          width: { size: col.width || 2000, type: WidthType.DXA },
        })
      ),
    });

    const dataRows = tableData.map((record, rowIdx) =>
      new TableRow({
        children: tableColumns.map((col) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(record[col.key] || ''), size: 18 })],
              }),
            ],
            shading: { fill: rowIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
          })
        ),
      })
    );

    paragraphs.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  // ── Footer signatures ─────────────────────────────────────
  paragraphs.push(new Paragraph({ text: '', spacing: { before: 800 } }));
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'HOD', bold: true }),
        new TextRun({ text: '\t\t\t\t\t\t\t' }),
        new TextRun({ text: 'Principal', bold: true }),
      ],
      spacing: { before: 400 },
    })
  );

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: collegeName, size: 18, color: '6366F1' }),
                  new TextRun({ text: ` | ${title}`, size: 18, color: '94A3B8' }),
                ],
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
              }),
            ],
          }),
        },
        footers: includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Page ' }),
                      new TextRun({ children: [PageNumber.CURRENT] }),
                      new TextRun({ text: ' of ' }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            }
          : undefined,
        children: paragraphs,
      },
    ],
    numbering: {
      config: [{ reference: 'default', levels: [{ level: 0, format: NumberFormat.DECIMAL, text: '%1.' }] }],
    },
  });

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${uuidv4()}.docx`;
  const filePath = path.join(OUTPUT_DIR, filename);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/generated/${filename}`;
}
