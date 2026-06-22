import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.string(),
  level: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  venue: z.string().optional(),
  organizer: z.string().optional(),
  targetAudience: z.string().optional(),
  budget: z.number().optional(),
  status: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

export class EventController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, type, status } = req.query;
      
      const result = await EventService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        type: type as string,
        status: status as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.getById(req.params.id);
      res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createEventSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const payload = {
        ...validatedData,
        startDate: new Date(validatedData.startDate).toISOString() as any,
        endDate: new Date(validatedData.endDate).toISOString() as any,
        createdBy: userId,
      };

      const event = await EventService.create(payload);

      res.status(201).json({ success: true, message: 'Event created successfully', data: event });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateEventSchema.parse(req.body);
      
      const payload: any = { ...validatedData };
      if (validatedData.startDate) payload.startDate = new Date(validatedData.startDate).toISOString();
      if (validatedData.endDate) payload.endDate = new Date(validatedData.endDate).toISOString();

      const event = await EventService.update(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await EventService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
