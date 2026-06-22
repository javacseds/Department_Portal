import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface ProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
}

interface ProcessResult {
  processedPath: string;
  processedUrl: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;
}

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const THUMBNAIL_SIZE = 200;
const DEFAULT_QUALITY = 85;

export async function processImage(
  filePath: string,
  storedName: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const {
    width = MAX_WIDTH,
    height = MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    fit = 'inside',
    format = 'webp',
    generateThumbnail = true,
  } = options;

  const dir = path.dirname(filePath);
  const baseName = path.basename(storedName, path.extname(storedName));

  // Process main image
  const processedName = `${baseName}_processed.${format}`;
  const processedPath = path.join(dir, processedName);

  const imageInfo = await sharp(filePath)
    .resize(width, height, { fit, withoutEnlargement: true })
    .toFormat(format, { quality })
    .toFile(processedPath);

  const processedUrl = processedPath
    .replace(path.join(process.cwd(), 'uploads'), '/uploads')
    .replace(/\\/g, '/');

  // Generate thumbnail
  let thumbnailPath: string | undefined;
  let thumbnailUrl: string | undefined;

  if (generateThumbnail) {
    const thumbName = `${baseName}_thumb.${format}`;
    thumbnailPath = path.join(dir, thumbName);

    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover' })
      .toFormat(format, { quality: 70 })
      .toFile(thumbnailPath);

    thumbnailUrl = thumbnailPath
      .replace(path.join(process.cwd(), 'uploads'), '/uploads')
      .replace(/\\/g, '/');
  }

  const stats = fs.statSync(processedPath);

  return {
    processedPath,
    processedUrl,
    thumbnailPath,
    thumbnailUrl,
    width: imageInfo.width || 0,
    height: imageInfo.height || 0,
    fileSize: stats.size,
  };
}

export async function getImageMetadata(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha,
  };
}
