const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');

const getDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { isActive: true };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        allocations: {
          where: {
            booking: {
              status: { in: ['ALLOCATED', 'ONGOING'] },
            },
          },
          include: {
            booking: {
              select: { id: true, destination: true, travelDate: true, returnDate: true, status: true },
            },
            vehicle: { select: { id: true, registrationNumber: true } },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: 'Failed to fetch drivers' });
  }
};

const getDriver = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: parseId(req.params.id) },
      include: {
        allocations: {
          include: {
            booking: {
              select: {
                id: true, facultyName: true, destination: true,
                travelDate: true, returnDate: true, status: true,
              },
            },
            vehicle: { select: { id: true, registrationNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ message: 'Failed to fetch driver' });
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, licenseExpiry, status, assignedVehicleId } = req.body;

    if (!name || !phone || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({ message: 'Name, phone, license number, and license expiry are required' });
    }

    const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (existing) return res.status(400).json({ message: 'License number already exists' });

    // Auto-link matching user account with role DRIVER (by phone or normalized name)
    let matchingUserId = null;
    const cleanDriverName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidateUsers = await prisma.user.findMany({ where: { role: 'DRIVER' } });
    const matchingUser = candidateUsers.find(u =>
      (phone && u.phone && u.phone.trim() === phone.trim()) ||
      u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanDriverName
    );
    if (matchingUser) matchingUserId = matchingUser.id;

    const driver = await prisma.driver.create({
      data: {
        name, phone, licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        status: status || 'AVAILABLE',
        assignedVehicleId: assignedVehicleId ? parseId(assignedVehicleId) : null,
        userId: matchingUserId,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_DRIVER',
      entity: 'Driver',
      entityId: driver.id,
      description: `Added driver ${driver.name}`,
    });

    res.status(201).json(driver);
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ message: 'Failed to create driver' });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, licenseExpiry, status, assignedVehicleId, isActive } = req.body;
    const data = {};

    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
    if (licenseExpiry !== undefined) data.licenseExpiry = new Date(licenseExpiry);
    if (status !== undefined) data.status = status;
    if (assignedVehicleId !== undefined) data.assignedVehicleId = assignedVehicleId ? parseId(assignedVehicleId) : null;
    if (isActive !== undefined) data.isActive = isActive;

    // Link user account if not already linked (by phone or normalized name)
    if (name || phone) {
      const targetPhone = phone || driver?.phone;
      const targetName = (name || driver?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidateUsers = await prisma.user.findMany({ where: { role: 'DRIVER' } });
      const match = candidateUsers.find(u =>
        (targetPhone && u.phone && u.phone.trim() === targetPhone.trim()) ||
        (targetName && u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetName)
      );
      if (match) data.userId = match.id;
    }

    const driver = await prisma.driver.update({
      where: { id: parseId(req.params.id) },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_DRIVER',
      entity: 'Driver',
      entityId: driver.id,
      description: `Updated driver ${driver.name}`,
    });

    res.json(driver);
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ message: 'Failed to update driver' });
  }
};

const checkDriverAvailability = async (req, res) => {
  try {
    const { travelDate, returnDate } = req.query;

    if (!travelDate || !returnDate) {
      return res.status(400).json({ message: 'Travel date and return date are required' });
    }

    const start = new Date(travelDate);
    const end = new Date(returnDate);

    const conflicting = await prisma.vehicleAllocation.findMany({
      where: {
        booking: {
          status: { in: ['ALLOCATED', 'ONGOING'] },
          OR: [{ travelDate: { lte: end }, returnDate: { gte: start } }],
        },
      },
      select: { driverId: true },
    });

    const busyDriverIds = conflicting.map((a) => a.driverId);

    const available = await prisma.driver.findMany({
      where: {
        isActive: true,
        status: { not: 'INACTIVE' },
        id: { notIn: busyDriverIds },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ available, busyDriverIds });
  } catch (error) {
    console.error('Check driver availability error:', error);
    res.status(500).json({ message: 'Failed to check driver availability' });
  }
};

module.exports = { getDrivers, getDriver, createDriver, updateDriver, checkDriverAvailability };
