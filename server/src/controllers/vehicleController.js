const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');

const getVehicles = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const where = { isActive: true };

    if (status) where.status = status;
    if (type) where.vehicleType = type;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        allocations: {
          where: {
            booking: {
              status: { in: ['ALLOCATED', 'ONGOING'] },
            },
          },
          include: {
            driver: { select: { id: true, name: true, phone: true } },
            booking: {
              select: { id: true, travelDate: true, returnDate: true, destination: true, status: true },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicles' });
  }
};

const getVehicle = async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseId(req.params.id) },
      include: {
        allocations: {
          include: {
            driver: { select: { id: true, name: true, phone: true } },
            booking: {
              select: {
                id: true, facultyName: true, destination: true,
                travelDate: true, returnDate: true, status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber, vehicleType, model, seatingCapacity,
      status, insuranceExpiry, fitnessExpiry, maintenanceInfo,
    } = req.body;

    if (!registrationNumber || !vehicleType || !model || !seatingCapacity) {
      return res.status(400).json({ message: 'Registration number, type, model, and capacity are required' });
    }

    const existing = await prisma.vehicle.findUnique({ where: { registrationNumber } });
    if (existing) return res.status(400).json({ message: 'Registration number already exists' });

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber,
        vehicleType,
        model,
        seatingCapacity: parseInt(seatingCapacity),
        status: status || 'AVAILABLE',
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        maintenanceInfo,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      description: `Added vehicle ${vehicle.registrationNumber}`,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: 'Failed to create vehicle' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const {
      registrationNumber, vehicleType, model, seatingCapacity,
      status, insuranceExpiry, fitnessExpiry, maintenanceInfo, isActive,
    } = req.body;

    const data = {};
    if (registrationNumber !== undefined) data.registrationNumber = registrationNumber;
    if (vehicleType !== undefined) data.vehicleType = vehicleType;
    if (model !== undefined) data.model = model;
    if (seatingCapacity !== undefined) data.seatingCapacity = parseInt(seatingCapacity);
    if (status !== undefined) data.status = status;
    if (insuranceExpiry !== undefined) data.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
    if (fitnessExpiry !== undefined) data.fitnessExpiry = fitnessExpiry ? new Date(fitnessExpiry) : null;
    if (maintenanceInfo !== undefined) data.maintenanceInfo = maintenanceInfo;
    if (isActive !== undefined) data.isActive = isActive;

    const vehicle = await prisma.vehicle.update({
      where: { id: parseId(req.params.id) },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      description: `Updated vehicle ${vehicle.registrationNumber}`,
    });

    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: 'Failed to update vehicle' });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { travelDate, returnDate, vehicleType, passengers } = req.query;

    if (!travelDate || !returnDate) {
      return res.status(400).json({ message: 'Travel date and return date are required' });
    }

    const start = new Date(travelDate);
    const end = new Date(returnDate);

    // Find vehicles that have conflicting allocations
    const conflictingAllocations = await prisma.vehicleAllocation.findMany({
      where: {
        booking: {
          status: { in: ['ALLOCATED', 'ONGOING'] },
          OR: [
            {
              travelDate: { lte: end },
              returnDate: { gte: start },
            },
          ],
        },
      },
      select: { vehicleId: true },
    });

    const busyVehicleIds = conflictingAllocations.map((a) => a.vehicleId);

    const where = {
      isActive: true,
      status: { not: 'MAINTENANCE' },
      id: { notIn: busyVehicleIds },
    };

    if (vehicleType) where.vehicleType = vehicleType;
    if (passengers) where.seatingCapacity = { gte: parseInt(passengers) };

    const available = await prisma.vehicle.findMany({ where, orderBy: { seatingCapacity: 'asc' } });

    // Also get all vehicles for reference
    const allVehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      orderBy: { seatingCapacity: 'asc' },
    });

    res.json({
      available,
      all: allVehicles,
      busyVehicleIds,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Failed to check availability' });
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, checkAvailability };
