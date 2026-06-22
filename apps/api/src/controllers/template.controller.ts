import { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['pdf', 'docx', 'excel']),
  content: z.string().min(1),
  variables: z.array(z.string()),
  departmentId: z.string().optional(),
  isGlobal: z.boolean().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

export class TemplateController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, type } = req.query;
      
      const result = await TemplateService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        type: type as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await TemplateService.getById(req.params.id);
      res.status(200).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createTemplateSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const template = await TemplateService.create({
        ...validatedData,
        createdBy: userId,
      });

      res.status(201).json({ success: true, message: 'Template created successfully', data: template });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateTemplateSchema.parse(req.body);
      const template = await TemplateService.update(req.params.id, validatedData);
      res.status(200).json({ success: true, message: 'Template updated successfully', data: template });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await TemplateService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = req.body; // Map of variables

      const document = await TemplateService.generateDocument(id, payload);

      // Send the file
      res.setHeader('Content-Type', document.type);
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.send(document.buffer);
    } catch (error) {
      next(error);
    }
  }
}

