import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middlewares/error';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError(401, 'Unauthorized');

      const { limit, unreadOnly } = req.query;

      const result = await NotificationService.getUserNotifications(
        user.id,
        user.role,
        user.departmentId,
        {
          limit: limit ? Number(limit) : undefined,
          unreadOnly: unreadOnly === 'true'
        }
      );

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError(401, 'Unauthorized');

      await NotificationService.markAsRead(req.params.id, user.id);

      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError(401, 'Unauthorized');

      await NotificationService.markAllAsRead(user.id);

      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
