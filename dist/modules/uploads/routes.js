"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const uploads_controller_1 = require("./uploads.controller");
const router = (0, express_1.Router)();
router.post('/documents', [
    (0, express_validator_1.body)('documentType').isIn(['ticket', 'invoice', 'making_of']).withMessage('Tipo de documento no válido'),
    (0, express_validator_1.body)('description').isString().trim().notEmpty().withMessage('La descripción es obligatoria'),
    (0, express_validator_1.body)('fileName').isString().trim().notEmpty().withMessage('El nombre del archivo es obligatorio'),
    (0, express_validator_1.body)('mimeType').isString().trim().notEmpty().withMessage('El tipo MIME es obligatorio'),
    (0, express_validator_1.body)('contentBase64').isString().trim().notEmpty().withMessage('El contenido del archivo es obligatorio'),
], uploads_controller_1.uploadDocument);
exports.default = router;
