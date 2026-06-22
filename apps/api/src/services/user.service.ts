import { prisma, Prisma, User } from '@cddas/database';
import { AppError } from '../middlewares/error';
import bcrypt from 'bcrypt';

export class UserService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    collegeId?: string;
    departmentId?: string;
    role?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(params.collegeId && { collegeId: params.collegeId }),
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.role && { role: params.role as any }),
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
          { employeeId: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          employeeId: true,
          designation: true,
          isActive: true,
          department: {
            select: { id: true, name: true, shortName: true },
          },
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        employeeId: true,
        designation: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        department: {
          select: { id: true, name: true, shortName: true },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  static async create(data: Prisma.UserUncheckedCreateInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.employeeId ? [{ employeeId: data.employeeId }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === data.email) throw new AppError(409, 'Email already registered');
      if (existing.employeeId === data.employeeId) throw new AppError(409, 'Employee ID already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return user;
  }

  static async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    await this.getById(id);

    if (data.email || data.employeeId) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email as string }] : []),
            ...(data.employeeId ? [{ employeeId: data.employeeId as string }] : []),
          ],
          id: { not: id },
        },
      });

      if (existing) {
        if (existing.email === data.email) throw new AppError(409, 'Email already registered');
        if (existing.employeeId === data.employeeId) throw new AppError(409, 'Employee ID already in use');
      }
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password as string, salt);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (error) {
      throw new AppError(400, 'Cannot delete user because they have associated records. Consider deactivating them instead.');
    }
  }
}
