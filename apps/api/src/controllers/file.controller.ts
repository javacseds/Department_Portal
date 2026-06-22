import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/file.service';
import { AppError } from '../middlewares/error';

export class FileController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file provided');
      }

      const { departmentId, eventId, category, tags, description, academicYear } = req.body;
      
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const fileRecord = await FileService.handleFileUpload(req.file, {
        userId,
        departmentId,
        eventId,
        category,
        tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : undefined,
        description,
        academicYear,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: fileRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new AppError(400, 'No files provided');
      }

      const { departmentId, eventId, category, tags, description, academicYear } = req.body;
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const files = req.files as Express.Multer.File[];
      const uploadedRecords = [];

      for (const file of files) {
        const record = await FileService.handleFileUpload(file, {
          userId,
          departmentId,
          eventId,
          category,
          tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : undefined,
          description,
          academicYear,
        });
        uploadedRecords.push(record);
      }

      res.status(201).json({
        success: true,
        message: `${uploadedRecords.length} files uploaded successfully`,
        data: uploadedRecords,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, category, mimeType } = req.query;
      
      const result = await FileService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        category: category as string,
        mimeType: mimeType as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const file = await FileService.getById(req.params.id);
      res.status(200).json({ success: true, data: file });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await FileService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
