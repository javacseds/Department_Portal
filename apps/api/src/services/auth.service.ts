import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AppError } from '../middlewares/error';
import { logger } from '../utils/logger';

interface LoginPayload {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  collegeId: string;
  departmentId?: string;
}

export class AuthService {
  // ── Generate Tokens ──────────────────────────────────────
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    } as jwt.SignOptions);
  }

  generateRefreshToken(): string {
    return uuidv4() + '-' + uuidv4();
  }

  // ── Login ─────────────────────────────────────────────────
  async login(payload: LoginPayload) {
    const { email, password, deviceInfo, ipAddress } = payload;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        college: { select: { name: true, logoUrl: true } },
        department: { select: { name: true, shortName: true } },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact admin.', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          module: 'auth',
          description: `Failed login attempt for ${email}`,
          ipAddress,
        },
      });
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      departmentId: user.departmentId || undefined,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiry,
        deviceInfo,
        ipAddress,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'auth',
        description: `User ${user.email} logged in`,
        ipAddress,
        device: deviceInfo,
      },
    });

    const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  // ── Refresh Token ─────────────────────────────────────────
  async refreshAccessToken(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new AppError('Refresh token expired, please login again', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Account deactivated', 403);
    }

    const accessToken = this.generateAccessToken({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      collegeId: storedToken.user.collegeId,
      departmentId: storedToken.user.departmentId || undefined,
    });

    return { accessToken };
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { isRevoked: true },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        module: 'auth',
        description: 'User logged out',
      },
    });
  }

  // ── Logout All Devices ────────────────────────────────────
  async logoutAllDevices(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  // ── Change Password ───────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });

    // Revoke all refresh tokens
    await this.logoutAllDevices(userId);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        module: 'auth',
        description: 'User changed their password',
      },
    });
  }

  // ── Get Profile ───────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        designation: true,
        employeeId: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        createdAt: true,
        college: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        department: { select: { id: true, name: true, shortName: true, code: true } },
        permissions: {
          include: { permission: true },
          where: { granted: true },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const authService = new AuthService();
