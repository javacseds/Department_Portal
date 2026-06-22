import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/export.service';

export class ExportController {
  static async exportAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, year } = req.query;
      const userId = req.user?.id;

      const buffer = await ExportService.exportFacultyAchievements(
        departmentId as string,
        year as string,
        userId
      );

      res.setHeader('Content-Disposition', `attachment; filename="Achievements_Report_${year || 'All'}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async exportEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, year } = req.query;
      const userId = req.user?.id;

      const buffer = await ExportService.exportEventsReport(
        departmentId as string,
        year as string,
        userId
      );

      res.setHeader('Content-Disposition', `attachment; filename="Events_Report_${year || 'All'}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
