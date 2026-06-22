import { prisma, Prisma, FileUpload } from '@cddas/database';
import { AppError } from '../middlewares/error';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

export class FileService {
  /**
   * Process and save uploaded file to DB
   */
  static async handleFileUpload(
    file: Express.Multer.File,
    data: {
      userId: string;
      departmentId?: string;
      eventId?: string;
      category?: string;
      tags?: string[];
      description?: string;
      academicYear?: string;
    }
  ) {
    let finalPath = file.path;
    let finalUrl = `/uploads/${path.relative(UPLOAD_BASE, file.path).replace(/\\/g, '/')}`;
    let isProcessed = false;
    let thumbnailUrl = null;
    let width = null;
    let height = null;

    // Process image with Sharp if applicable
    if (file.mimetype.startsWith('image/')) {
      try {
        const metadata = await sharp(file.path).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        // Create a thumbnail
        const thumbFilename = `thumb_${path.basename(file.path)}`;
        const thumbPath = path.join(path.dirname(file.path), thumbFilename);
        
        await sharp(file.path)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbPath);
        
        thumbnailUrl = `/uploads/${path.relative(UPLOAD_BASE, thumbPath).replace(/\\/g, '/')}`;
        isProcessed = true;
      } catch (error) {
        console.error('Error processing image with sharp:', error);
        // Continue saving even if sharp fails
      }
    }

    return prisma.fileUpload.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        filePath: finalPath,
        fileUrl: finalUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: data.userId,
        departmentId: data.departmentId,
        eventId: data.eventId,
        category: data.category,
        tags: data.tags || [],
        description: data.description,
        academicYear: data.academicYear,
        isProcessed,
        thumbnailUrl,
        width,
        height,
      },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    category?: string;
    mimeType?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.FileUploadWhereInput = {
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.category && { category: params.category }),
      ...(params.mimeType && { mimeType: { startsWith: params.mimeType } }),
      ...(params.search && {
        OR: [
          { originalName: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { tags: { has: params.search } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.fileUpload.count({ where }),
      prisma.fileUpload.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploader: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, shortName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const file = await prisma.fileUpload.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, shortName: true } },
      },
    });

    if (!file) throw new AppError('File not found', 404);
    return file;
  }

  static async delete(id: string) {
    const file = await this.getById(id);

    try {
      // 1. Delete physical file
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      
      // 2. Delete thumbnail if exists
      if (file.thumbnailUrl) {
        const thumbPath = path.join(UPLOAD_BASE, file.thumbnailUrl.replace('/uploads/', ''));
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }

      // 3. Delete from DB
      await prisma.fileUpload.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      throw new AppError('Failed to delete file completely', 500);
    }
  }
}

