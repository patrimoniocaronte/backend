"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const authService = __importStar(require("./auth.service"));
const logger_1 = require("../../utils/logger");
const DEV_ADMIN_USERNAME = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
const DEV_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@caronte.com';
const DEV_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123';
const DEV_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador Caronte';
const prismaAny = prisma_1.default;
const isDatabaseUnavailable = (error) => {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const prismaError = error;
    return (prismaError.name === 'PrismaClientInitializationError' ||
        prismaError.message?.includes("Can't reach database server") === true);
};
const ensureDevelopmentAdmin = async (username, password) => {
    if (process.env.NODE_ENV === 'production') {
        return null;
    }
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
const login = async (req, res) => {
    try {
        const validationErrors = (0, express_validator_1.validationResult)(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de acceso no válidos',
                details: validationErrors.array(),
            });
        }
        const { username, password } = req.body;
        const user = (await prismaAny.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username },
                ],
            },
        })) ??
            (await ensureDevelopmentAdmin(username, password));
        if (!user) {
            await (0, logger_1.logAudit)({ action: 'AUTH_LOGIN_FAILED', resource: username, ipAddress: req.ip });
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const isMatch = await authService.comparePassword(password, user.passwordHash);
        if (!isMatch) {
            await (0, logger_1.logAudit)({ action: 'AUTH_LOGIN_FAILED', resource: username, ipAddress: req.ip });
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = authService.generateToken({ userId: user.id, role: user.role });
        res.cookie('caronte_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        await (0, logger_1.logAudit)({ userId: user.id, action: 'AUTH_LOGIN_SUCCESS', ipAddress: req.ip });
        return res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('[AUTH_LOGIN_ERROR]', error);
        if (isDatabaseUnavailable(error)) {
            return res.status(503).json({
                error: 'La base de datos no está disponible. Arranca PostgreSQL e inténtalo de nuevo.',
            });
        }
        return res.status(500).json({ error: 'Error interno en el servidor' });
    }
};
exports.login = login;
const logout = async (req, res) => {
    const userId = req.user?.id;
    res.clearCookie('caronte_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    await (0, logger_1.logAudit)({ userId, action: 'AUTH_LOGOUT', ipAddress: req.ip });
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
};
exports.logout = logout;
const me = async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        console.error('[AUTH_ME_ERROR]', error);
        if (isDatabaseUnavailable(error)) {
            return res.status(503).json({
                error: 'La base de datos no está disponible.',
            });
        }
        return res.status(500).json({ error: 'Error interno en el servidor' });
    }
};
exports.me = me;
