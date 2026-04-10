import { Request, Response, NextFunction } from 'express';
import * as authService from '../modules/auth/auth.service';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.caronte_session;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No hay sesión activa.' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }

  (req as any).user = { id: decoded.userId, role: decoded.role };
  next();
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'No tienes permisos suficientes para esta acción.' });
    }

    next();
  };
};
