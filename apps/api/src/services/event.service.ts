import { prisma, Prisma, Event } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class EventService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    type?: string;
    status?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { venue: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
        files: true,
        approvals: true,
        circulars: true,
      },
    });

    if (!event) throw new AppError('Event not found', 404);
    return event;
  }

  static async create(data: Prisma.EventUncheckedCreateInput) {
    return prisma.event.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.EventUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.event.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.event.delete({ where: { id } });
    return true;
  }
}

