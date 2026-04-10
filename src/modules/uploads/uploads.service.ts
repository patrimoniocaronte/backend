import fs from 'fs/promises';
import path from 'path';

type DocumentType = 'ticket' | 'invoice' | 'making_of';

interface UploadPayload {
  documentType: DocumentType;
  description: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  uploaderName: string;
}

const uploadFolderMap: Record<DocumentType, string> = {
  ticket: 'tickets',
  invoice: 'invoices',
  making_of: 'making_of',
};

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const getExtensionFromMimeType = (mimeType: string) => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    case 'video/mp4':
      return '.mp4';
    case 'video/webm':
      return '.webm';
    case 'video/quicktime':
      return '.mov';
    default:
      return '';
  }
};

const sanitizeFileName = (value: string) => {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();

  return sanitized || 'documento';
};

export const saveUploadedDocument = async (payload: UploadPayload) => {
  if (!allowedMimeTypes.has(payload.mimeType)) {
    throw new Error('Formato de archivo no permitido');
  }

  const folderName = uploadFolderMap[payload.documentType];
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const destinationDir = path.join(uploadsRoot, folderName);
  await fs.mkdir(destinationDir, { recursive: true });

  const fileBuffer = Buffer.from(payload.contentBase64, 'base64');
  if (!fileBuffer.length) {
    throw new Error('El archivo está vacío');
  }

  const originalExtension = path.extname(payload.fileName).toLowerCase();
  const inferredExtension = getExtensionFromMimeType(payload.mimeType);
  const extension = originalExtension || inferredExtension || '.bin';
  const title = sanitizeFileName(payload.description);
  const uploaderName = sanitizeFileName(payload.uploaderName);
  const finalFileName = `${title}_${uploaderName}${extension}`;
  const absolutePath = path.join(destinationDir, finalFileName);

  await fs.writeFile(absolutePath, fileBuffer);

  return {
    message: 'Documento subido correctamente',
    fileName: finalFileName,
    folder: folderName,
  };
};
