import { prisma, Prisma, Form } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class FormService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    category?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      isActive: true,
      ...(params.departmentId && {
        OR: [
          { departmentId: params.departmentId },
          { isPublic: true },
        ],
      }),
      ...(params.category && { category: params.category }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.form.count({ where }),
      prisma.form.findMany({
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
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!form) throw new AppError(404, 'Form not found');
    return form;
  }

  static async create(data: Prisma.FormUncheckedCreateInput) {
    return prisma.form.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.FormUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.form.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.form.delete({ where: { id } });
    return true;
  }
}
