import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './error';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

// Ensure all upload directories exist
const uploadDirs = ['images', 'documents', 'excel', 'generated', 'events', 'faculty', 'students'];
uploadDirs.forEach((dir) => {
  const dirPath = path.join(UPLOAD_BASE, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const mimeType = file.mimetype;
    let subDir = 'documents';

    if (mimeType.startsWith('image/')) {
      subDir = 'images';
    } else if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      subDir = 'excel';
    }

    // Context-based routing
    if (req.path.includes('faculty')) subDir = 'faculty';
    if (req.path.includes('student')) subDir = 'students';
    if (req.path.includes('event')) subDir = 'events';

    const fullPath = path.join(UPLOAD_BASE, subDir);
    cb(null, fullPath);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type '${file.mimetype}' is not allowed`, 400));
  }
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 10 },
});

export const uploadSingle = (fieldName = 'file') => upload.single(fieldName);
export const uploadMultiple = (fieldName = 'files', maxCount = 10) =>
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);
