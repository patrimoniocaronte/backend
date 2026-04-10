import { Router } from 'express';
import { body } from 'express-validator';
import { uploadDocument } from './uploads.controller';

const router = Router();

router.post(
  '/documents',
  [
    body('documentType').isIn(['ticket', 'invoice', 'making_of']).withMessage('Tipo de documento no válido'),
    body('description').isString().trim().notEmpty().withMessage('La descripción es obligatoria'),
    body('fileName').isString().trim().notEmpty().withMessage('El nombre del archivo es obligatorio'),
    body('mimeType').isString().trim().notEmpty().withMessage('El tipo MIME es obligatorio'),
    body('contentBase64').isString().trim().notEmpty().withMessage('El contenido del archivo es obligatorio'),
  ],
  uploadDocument,
);

export default router;
