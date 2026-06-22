import { prisma, Prisma, Achievement } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class AchievementService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    type?: string;
    status?: string;
    facultyId?: string;
    studentId?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AchievementWhereInput = {
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.facultyId && { facultyId: params.facultyId }),
      ...(params.studentId && { studentId: params.studentId }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.achievement.count({ where }),
      prisma.achievement.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, shortName: true } },
          faculty: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          student: {
            select: { id: true, firstName: true, lastName: true, rollNumber: true }
          }
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
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, shortName: true } },
        faculty: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        student: {
          select: { id: true, firstName: true, lastName: true, rollNumber: true }
        }
      },
    });

    if (!achievement) throw new AppError(404, 'Achievement not found');
    return achievement;
  }

  static async create(data: Prisma.AchievementUncheckedCreateInput) {
    return prisma.achievement.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.AchievementUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.achievement.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.achievement.delete({ where: { id } });
    return true;
  }
}
