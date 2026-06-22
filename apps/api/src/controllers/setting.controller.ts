import { Request, Response, NextFunction } from 'express';
import { SettingService } from '../services/setting.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const bulkUpdateSchema = z.array(z.object({
  key: z.string(),
  value: z.string(),
  isPublic: z.boolean().optional()
})).min(1);

export class SettingController {
  static async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingService.getAll(true);
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingService.getAll();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = bulkUpdateSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const settings = await SettingService.bulkUpdate(validatedData, userId);
      res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
    } catch (error) {
      next(error);
    }
  }
}

