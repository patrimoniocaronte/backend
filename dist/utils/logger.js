"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logAudit = async (data) => {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId: data.userId || null,
                action: data.action,
                resource: data.resource || null,
                ipAddress: data.ipAddress || 'unknown',
                // Note: The schema doesn't have a 'details' field yet, 
                // we can add it to the message or just ignore for now to match current schema.
            },
        });
    }
    catch (error) {
        console.error('[Audit Log Error]', error);
    }
};
exports.logAudit = logAudit;
