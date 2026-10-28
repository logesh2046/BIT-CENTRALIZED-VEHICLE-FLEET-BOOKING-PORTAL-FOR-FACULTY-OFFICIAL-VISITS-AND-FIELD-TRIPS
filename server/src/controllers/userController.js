const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');

const getUsers = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (role) where.role = role;
    if (department) where.departmentId = parseId(department);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, phone: true, role: true,
          departmentId: true, isActive: true, createdAt: true,
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseId(req.params.id) },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        departmentId: true, isActive: true, createdAt: true,
        department: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, name, phone, role, departmentId } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Email, password, name, and role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, name, phone,
        role, departmentId: departmentId ? parseId(departmentId) : null,
      },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        departmentId: true, isActive: true, createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      description: `Created user ${user.name} with role ${user.role}`,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, phone, role, departmentId, isActive } = req.body;
    const data = {};

    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;
    if (departmentId !== undefined) data.departmentId = departmentId ? parseId(departmentId) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: parseId(req.params.id) },
      data,
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        departmentId: true, isActive: true, createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      description: `Updated user ${user.name}`,
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: parseId(req.params.id) },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, resetPassword, getDepartments };
