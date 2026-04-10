import prisma from '../lib/prisma';

export const logAudit = async (data: {
  userId?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  details?: any; // We can log extra info here if needed by stringifying
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource || null,
        ipAddress: data.ipAddress || 'unknown',
        // Note: The schema doesn't have a 'details' field yet, 
        // we can add it to the message or just ignore for now to match current schema.
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]', error);
  }
};
