import { prisma, Prisma, Circular } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class CircularService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    type?: string;
    role?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.CircularWhereInput = {
      ...(params.type && { type: params.type }),
      ...(params.departmentId && {
        OR: [
          { departmentId: params.departmentId },
          { isGlobal: true },
        ],
      }),
      ...(params.role && { targetAudience: { has: params.role } }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { content: { contains: params.search, mode: 'insensitive' } },
          { referenceNo: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.circular.count({ where }),
      prisma.circular.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { issueDate: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const circular = await prisma.circular.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!circular) throw new AppError(404, 'Circular not found');
    return circular;
  }

  static async create(data: Prisma.CircularUncheckedCreateInput) {
    // Ensure reference number is unique
    const existing = await prisma.circular.findUnique({
      where: { referenceNo: data.referenceNo },
    });

    if (existing) throw new AppError(409, 'Circular with this Reference Number already exists');

    return prisma.circular.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.CircularUncheckedUpdateInput) {
    await this.getById(id);

    if (data.referenceNo) {
      const existing = await prisma.circular.findFirst({
        where: { referenceNo: data.referenceNo as string, id: { not: id } },
      });
      if (existing) throw new AppError(409, 'Circular with this Reference Number already exists');
    }

    return prisma.circular.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.circular.delete({ where: { id } });
    return true;
  }
}
