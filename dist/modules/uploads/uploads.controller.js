"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const uploads_service_1 = require("./uploads.service");
const uploadDocument = async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de subida no válidos',
            details: validationErrors.array(),
        });
    }
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        const result = await (0, uploads_service_1.saveUploadedDocument)({
            ...req.body,
            uploaderName: user.name,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({
            error: error.message || 'No se pudo guardar el documento',
        });
    }
};
exports.uploadDocument = uploadDocument;
