import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});

export class AuthController {
  // POST /api/v1/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const deviceInfo = req.headers['user-agent'] || '';

      const result = await authService.login({
        ...validated,
        ipAddress,
        deviceInfo,
      });

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth/refresh',
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/refresh
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
      }

      const result = await authService.refreshAccessToken(token);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/logout
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      await authService.logout(req.user!.id, refreshToken);

      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/logout-all
  async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logoutAllDevices(req.user!.id);
      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
      res.json({ success: true, message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/auth/me
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/auth/change-password
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      await authService.changePassword(
        req.user!.id,
        validated.currentPassword,
        validated.newPassword
      );
      res.json({ success: true, message: 'Password changed successfully. Please login again.' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
