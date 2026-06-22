import { prisma, Prisma, Faculty } from '@cddas/database';
import { AppError } from '../middlewares/error';
import { UserService } from './user.service';
import { USER_ROLES } from '@cddas/shared';

export class FacultyService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.FacultyWhereInput = {
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.search && {
        OR: [
          { employeeId: { contains: params.search, mode: 'insensitive' } },
          { designation: { contains: params.search, mode: 'insensitive' } },
          { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
          { user: { email: { contains: params.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.faculty.count({ where }),
      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
          },
          department: {
            select: { id: true, name: true, shortName: true },
          },
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
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
        },
        department: {
          select: { id: true, name: true, shortName: true },
        },
        achievements: true,
        publications: true,
        patents: true,
      },
    });

    if (!faculty) throw new AppError(404, 'Faculty not found');
    return faculty;
  }

  /**
   * Creates a Faculty record and implicitly creates the User record
   */
  static async create(data: any & { collegeId: string }) {
    // Check if employee ID exists in faculty
    const existingFaculty = await prisma.faculty.findUnique({
      where: { employeeId: data.employeeId },
    });

    if (existingFaculty) {
      throw new AppError(409, 'Faculty with this Employee ID already exists');
    }

    // Use a transaction to create User and Faculty together
    return prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await UserService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password || 'Faculty@123', // Default password
        role: USER_ROLES.FACULTY,
        employeeId: data.employeeId,
        designation: data.designation,
        phone: data.phone,
        collegeId: data.collegeId,
        departmentId: data.departmentId,
      });

      // 2. Create the faculty profile
      const faculty = await tx.faculty.create({
        data: {
          userId: user.id,
          departmentId: data.departmentId,
          employeeId: data.employeeId,
          designation: data.designation,
          qualification: data.qualification,
          specialization: data.specialization,
          experience: data.experience ? Number(data.experience) : null,
          dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
          isActive: data.isActive !== false,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      return faculty;
    });
  }

  static async update(id: string, data: any) {
    const faculty = await this.getById(id);

    return prisma.$transaction(async (tx) => {
      // 1. Update User part
      if (data.firstName || data.lastName || data.email || data.phone || data.password) {
        await UserService.update(faculty.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          designation: data.designation,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
        });
      }

      // 2. Update Faculty part
      const updateData: any = {
        designation: data.designation,
        qualification: data.qualification,
        specialization: data.specialization,
      };

      if (data.employeeId) updateData.employeeId = data.employeeId;
      if (data.departmentId) updateData.departmentId = data.departmentId;
      if (data.experience !== undefined) updateData.experience = Number(data.experience);
      if (data.dateOfJoining) updateData.dateOfJoining = new Date(data.dateOfJoining);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      return tx.faculty.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });
    });
  }

  static async delete(id: string) {
    const faculty = await this.getById(id);
    
    // We only delete the faculty profile. The user record can be deactivated or deleted separately.
    // However, if we want strict cleanup, we delete the user. Let's delete the user.
    await UserService.delete(faculty.userId);
    return true; // Prisma Cascade will delete the faculty record
  }
}
