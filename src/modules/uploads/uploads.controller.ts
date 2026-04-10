import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../lib/prisma';
import { saveUploadedDocument } from './uploads.service';

export const uploadDocument = async (req: Request, res: Response) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de subida no válidos',
      details: validationErrors.array(),
    });
  }

  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const result = await saveUploadedDocument({
      ...req.body,
      uploaderName: user.name,
    });
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'No se pudo guardar el documento',
    });
  }
};
