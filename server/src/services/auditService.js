const prisma = require('../config/db');

const createAuditLog = async ({ userId, action, entity, entityId, description, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        description,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
  }
};

module.exports = { createAuditLog };
