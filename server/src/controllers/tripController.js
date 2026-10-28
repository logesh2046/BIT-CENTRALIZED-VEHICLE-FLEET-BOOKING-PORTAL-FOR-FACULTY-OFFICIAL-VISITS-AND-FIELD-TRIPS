const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const getTrips = async (req, res) => {
  try {
    const where = {};

    // For drivers, show only their trips
    if (req.user.role === 'DRIVER') {
      // Find the driver record for this user
      const driver = await prisma.driver.findFirst({ where: { userId: req.user.id } });
      if (!driver) {
        return res.json({ trips: [] });
      }

      const allocations = await prisma.vehicleAllocation.findMany({
        where: { driverId: driver.id },
        select: { bookingId: true },
      });
      where.id = { in: allocations.map((a) => a.bookingId) };
    }

    // Only show allocated/ongoing/completed bookings in trips
    where.status = { in: ['ALLOCATED', 'ONGOING', 'COMPLETED'] };

    const trips = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        allocation: {
          include: {
            vehicle: { select: { id: true, registrationNumber: true, vehicleType: true, model: true } },
            driver: { select: { id: true, name: true, phone: true } },
          },
        },
        tripStatus: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { travelDate: 'desc' },
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Failed to fetch trips' });
  }
};

const updateTripStatus = async (req, res) => {
  try {
    const bookingId = parseId(req.params.id);
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['ASSIGNED', 'STARTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { allocation: true },
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!['ALLOCATED', 'ONGOING'].includes(booking.status) && status !== 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot update trip status for this booking' });
    }

    // Driver access check
    if (req.user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (!driver || !booking.allocation || booking.allocation.driverId !== driver.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const tripStatusEntry = await tx.tripStatus.create({
        data: {
          bookingId,
          status,
          remarks: remarks || null,
          updatedBy: req.user.id,
        },
      });

      // Update booking status
      let bookingStatus = booking.status;
      if (status === 'STARTED' || status === 'IN_TRANSIT') bookingStatus = 'ONGOING';
      if (status === 'COMPLETED') bookingStatus = 'COMPLETED';
      if (status === 'CANCELLED') bookingStatus = 'CANCELLED';

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: bookingStatus },
      });

      return tripStatusEntry;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_TRIP_STATUS',
      entity: 'TripStatus',
      entityId: result.id,
      description: `Updated trip status for booking #${bookingId} to ${status}`,
    });

    // Notify faculty
    await createNotification({
      userId: booking.userId,
      title: 'Trip Status Updated',
      message: `Trip to ${booking.destination} status updated to ${status.replace('_', ' ')}.`,
      type: 'TRIP_STATUS_UPDATE',
      relatedId: bookingId,
    });

    res.json(result);
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ message: 'Failed to update trip status' });
  }
};

module.exports = { getTrips, updateTripStatus };
