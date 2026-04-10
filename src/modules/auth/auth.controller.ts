import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../lib/prisma';
import * as authService from './auth.service';
import { logAudit } from '../../utils/logger';

const DEV_ADMIN_USERNAME = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
const DEV_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@caronte.com';
const DEV_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123';
const DEV_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador Caronte';
const prismaAny = prisma as any;

const isDatabaseUnavailable = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const prismaError = error as { name?: string; message?: string };
  return (
    prismaError.name === 'PrismaClientInitializationError' ||
    prismaError.message?.includes("Can't reach database server") === true
  );
};

const ensureDevelopmentAdmin = async (username: string, password: string) => {
  // Allow bootstrap in production if no user exists or credentials match env vars

  if (username !== DEV_ADMIN_USERNAME || password !== DEV_ADMIN_PASSWORD) {
    return null;
  }

  const existingUser = await prismaAny.user.findFirst({
    where: {
      OR: [
        { username: DEV_ADMIN_USERNAME },
        { email: DEV_ADMIN_EMAIL },
      ],
    },
  });

  const hashedPassword = await authService.hashPassword(DEV_ADMIN_PASSWORD);

  if (existingUser) {
    return prismaAny.user.update({
      where: { id: existingUser.id },
      data: {
        username: DEV_ADMIN_USERNAME,
        email: DEV_ADMIN_EMAIL,
        name: DEV_ADMIN_NAME,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
  }

  return prismaAny.user.create({
    data: {
      username: DEV_ADMIN_USERNAME,
      email: DEV_ADMIN_EMAIL,
      name: DEV_ADMIN_NAME,
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de acceso no válidos',
        details: validationErrors.array(),
      });
    }

    const { username, password } = req.body;

    const user =
      (await prismaAny.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username },
          ],
        },
      })) ??
      (await ensureDevelopmentAdmin(username, password));

    if (!user) {
      await logAudit({ action: 'AUTH_LOGIN_FAILED', resource: username, ipAddress: req.ip });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await logAudit({ action: 'AUTH_LOGIN_FAILED', resource: username, ipAddress: req.ip });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = authService.generateToken({ userId: user.id, role: user.role });

    res.cookie('caronte_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await logAudit({ userId: user.id, action: 'AUTH_LOGIN_SUCCESS', ipAddress: req.ip });

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[AUTH_LOGIN_ERROR]', error);

    if (isDatabaseUnavailable(error)) {
      return res.status(503).json({
        error: 'La base de datos no está disponible. Arranca PostgreSQL e inténtalo de nuevo.',
      });
    }

    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  res.clearCookie('caronte_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  await logAudit({ userId, action: 'AUTH_LOGOUT', ipAddress: req.ip });

  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prismaAny.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[AUTH_ME_ERROR]', error);

    if (isDatabaseUnavailable(error)) {
      return res.status(503).json({
        error: 'La base de datos no está disponible.',
      });
    }

    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
};
