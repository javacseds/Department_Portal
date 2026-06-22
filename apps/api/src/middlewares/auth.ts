import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from './error';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    collegeId: string;
    departmentId?: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as {
      id: string;
      email: string;
      role: UserRole;
      collegeId: string;
      departmentId?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        collegeId: true,
        departmentId: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions for this action', 403));
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Super admin has all permissions
      if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
      }

      // Check user-specific permissions
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: req.user.id,
          permission: { name: permission },
          granted: true,
        },
      });

      if (userPermission) return next();

      // Check role permissions
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: { name: req.user.role },
          permission: { name: permission },
        },
      });

      if (!rolePermission) {
        return next(new AppError(`Permission '${permission}' required`, 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
