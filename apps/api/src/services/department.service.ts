import { prisma, Prisma, Department } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class DepartmentService {
  /**
   * Get all departments with optional pagination and search
   */
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    collegeId?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {
      ...(params.collegeId && { collegeId: params.collegeId }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { shortName: { contains: params.search, mode: 'insensitive' } },
          { code: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          hod: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { users: true, faculty: true, students: true },
          },
        },
        orderBy: { name: 'asc' },
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

  /**
   * Get a single department by ID
   */
  static async getById(id: string): Promise<Department> {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        hod: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        college: {
          select: { id: true, name: true, shortName: true },
        },
        _count: {
          select: { users: true, faculty: true, students: true, documents: true, events: true },
        },
      },
    });

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return department;
  }

  /**
   * Create a new department
   */
  static async create(data: Prisma.DepartmentUncheckedCreateInput): Promise<Department> {
    // Check for existing department code
    const existing = await prisma.department.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError(409, `Department code '${data.code}' already exists`);
    }

    return prisma.department.create({
      data,
    });
  }

  /**
   * Update a department
   */
  static async update(id: string, data: Prisma.DepartmentUncheckedUpdateInput): Promise<Department> {
    // Check if department exists
    await this.getById(id);

    // If updating code, check for conflicts
    if (data.code) {
      const existing = await prisma.department.findFirst({
        where: { code: data.code as string, id: { not: id } },
      });

      if (existing) {
        throw new AppError(409, `Department code '${data.code}' is already in use`);
      }
    }

    return prisma.department.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a department
   */
  static async delete(id: string): Promise<boolean> {
    // Check if it exists
    await this.getById(id);

    try {
      await prisma.department.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // Handle foreign key constraint failures (e.g. users still assigned)
      throw new AppError(400, 'Cannot delete department because it has associated users, faculty, or students. Please reassign them first.');
    }
  }
}
