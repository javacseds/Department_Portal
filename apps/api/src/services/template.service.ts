import { prisma, Prisma, Template } from '@cddas/database';
import { AppError } from '../middlewares/error';
import { PdfGenerator } from '../utils/pdfGenerator';
import { DocxGenerator } from '../utils/docxGenerator';

export class TemplateService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    type?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.TemplateWhereInput = {
      ...(params.type && { type: params.type }),
      ...(params.departmentId && {
        OR: [
          { departmentId: params.departmentId },
          { isGlobal: true },
        ],
      }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.Template.count({ where }),
      prisma.Template.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const template = await prisma.Template.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!template) throw new AppError('Template not found', 404);
    return template;
  }

  static async create(data: Prisma.TemplateUncheckedCreateInput) {
    return prisma.Template.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.TemplateUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.Template.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.Template.delete({ where: { id } });
    return true;
  }

  /**
   * Engine to compile a template with data and return a file buffer
   */
  static async generateDocument(templateId: string, payload: any) {
    const template = await this.getById(templateId);

    // 1. Interpolate variables (simple regex replacement for Handlebars-like syntax {{var}})
    let compiledContent = template.content;
    
    // Replace variables
    for (const variable of template.variables) {
      const value = payload[variable] || '';
      // Global replace for {{variableName}}
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      compiledContent = compiledContent.replace(regex, String(value));
    }

    // 2. Generate file based on type
    if (template.type === 'pdf') {
      try {
        const buffer = await PdfGenerator.generateFromHtml(compiledContent);
        return { buffer, type: 'application/pdf', filename: `${template.name.replace(/\s+/g, '_')}_Generated.pdf` };
      } catch (error) {
        console.error('PDF Generation Error:', error);
        throw new AppError('Failed to generate PDF document', 500);
      }
    } 
    else if (template.type === 'docx') {
      try {
        const buffer = await DocxGenerator.generateFromHtml(compiledContent);
        return { buffer, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename: `${template.name.replace(/\s+/g, '_')}_Generated.docx` };
      } catch (error) {
        console.error('DOCX Generation Error:', error);
        throw new AppError('Failed to generate Word document', 500);
      }
    }
    
    throw new AppError(`Unsupported template type: ${template.type}`, 400);
  }
}


