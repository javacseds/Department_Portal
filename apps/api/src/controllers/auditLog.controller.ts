import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLog.service';

export class AuditLogController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, action, entity, userId } = req.query;

      const result = await AuditLogService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        action: action as string,
        entity: entity as string,
        userId: userId as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
