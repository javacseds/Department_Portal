import { prisma, Prisma, Meeting } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class MomService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.MeetingWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { agenda: { contains: params.search, mode: 'insensitive' } },
          { minutes: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!meeting) throw new AppError(404, 'Meeting not found');
    return meeting;
  }

  static async create(data: Prisma.MeetingUncheckedCreateInput) {
    return prisma.meeting.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.MeetingUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.meeting.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.meeting.delete({ where: { id } });
    return true;
  }
}
