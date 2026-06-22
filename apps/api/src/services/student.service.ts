import { prisma, Prisma, Student } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class StudentService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    batch?: string;
    semester?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.batch && { batch: params.batch }),
      ...(params.semester && { semester: Number(params.semester) }),
      ...(params.search && {
        OR: [
          { rollNumber: { contains: params.search, mode: 'insensitive' } },
          { registerNumber: { contains: params.search, mode: 'insensitive' } },
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: {
            select: { id: true, name: true, shortName: true },
          },
        },
        orderBy: [{ batch: 'desc' }, { rollNumber: 'asc' }],
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, shortName: true },
        },
        achievements: true,
      },
    });

    if (!student) throw new AppError('Student not found', 404);
    return student;
  }

  static async create(data: Prisma.StudentUncheckedCreateInput) {
    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { rollNumber: data.rollNumber },
          ...(data.registerNumber ? [{ registerNumber: data.registerNumber }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.rollNumber === data.rollNumber) throw new AppError('Roll Number already exists', 409);
      if (existing.registerNumber === data.registerNumber) throw new AppError('Register Number already exists', 409);
    }

    return prisma.student.create({
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.StudentUncheckedUpdateInput) {
    await this.getById(id);

    if (data.rollNumber || data.registerNumber) {
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            ...(data.rollNumber ? [{ rollNumber: data.rollNumber as string }] : []),
            ...(data.registerNumber ? [{ registerNumber: data.registerNumber as string }] : []),
          ],
          id: { not: id },
        },
      });

      if (existing) {
        if (existing.rollNumber === data.rollNumber) throw new AppError('Roll Number already in use', 409);
        if (existing.registerNumber === data.registerNumber) throw new AppError('Register Number already in use', 409);
      }
    }

    return prisma.student.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, shortName: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.student.delete({ where: { id } });
    return true;
  }
}


