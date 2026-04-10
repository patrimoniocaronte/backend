"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUploadedDocument = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uploadFolderMap = {
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
const getExtensionFromMimeType = (mimeType) => {
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
const sanitizeFileName = (value) => {
    const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sanitized = normalized
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
    return sanitized || 'documento';
};
const saveUploadedDocument = async (payload) => {
    if (!allowedMimeTypes.has(payload.mimeType)) {
        throw new Error('Formato de archivo no permitido');
    }
    const folderName = uploadFolderMap[payload.documentType];
    const uploadsRoot = path_1.default.resolve(process.cwd(), 'uploads');
    const destinationDir = path_1.default.join(uploadsRoot, folderName);
    await promises_1.default.mkdir(destinationDir, { recursive: true });
    const fileBuffer = Buffer.from(payload.contentBase64, 'base64');
    if (!fileBuffer.length) {
        throw new Error('El archivo está vacío');
    }
    const originalExtension = path_1.default.extname(payload.fileName).toLowerCase();
    const inferredExtension = getExtensionFromMimeType(payload.mimeType);
    const extension = originalExtension || inferredExtension || '.bin';
    const title = sanitizeFileName(payload.description);
    const uploaderName = sanitizeFileName(payload.uploaderName);
    const finalFileName = `${title}_${uploaderName}${extension}`;
    const absolutePath = path_1.default.join(destinationDir, finalFileName);
    await promises_1.default.writeFile(absolutePath, fileBuffer);
    return {
        message: 'Documento subido correctamente',
        fileName: finalFileName,
        folder: folderName,
    };
};
exports.saveUploadedDocument = saveUploadedDocument;
