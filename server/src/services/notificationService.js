const prisma = require('../config/db');

const createNotification = async ({ userId, title, message, type, relatedId }) => {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type, relatedId },
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

const notifyByRole = async ({ role, title, message, type, relatedId, departmentId }) => {
  try {
    const where = { role, isActive: true };
    if (departmentId) where.departmentId = departmentId;

    const users = await prisma.user.findMany({ where, select: { id: true } });
    const data = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      relatedId,
    }));

    if (data.length > 0) {
      await prisma.notification.createMany({ data });
    }
  } catch (error) {
    console.error('Failed to notify by role:', error.message);
  }
};

module.exports = { createNotification, notifyByRole };
