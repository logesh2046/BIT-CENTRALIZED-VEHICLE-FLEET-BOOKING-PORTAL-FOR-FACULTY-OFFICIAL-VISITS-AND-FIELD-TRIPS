const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');
const { createNotification, notifyByRole } = require('../services/notificationService');

const getBookings = async (req, res) => {
  try {
    const { status, department, faculty, vehicle, driver, destination, startDate, endDate, page = 1, limit = 20 } = req.query;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'FACULTY') {
      where.userId = req.user.id;
    } else if (req.user.role === 'HOD') {
      // HOD sees bookings from their department
      if (req.user.department) {
        where.department = req.user.department.name;
      }
    }

    if (status) where.status = status;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (faculty) where.facultyName = { contains: faculty, mode: 'insensitive' };
    if (destination) where.destination = { contains: destination, mode: 'insensitive' };
    if (startDate) where.travelDate = { ...where.travelDate, gte: new Date(startDate) };
    if (endDate) where.travelDate = { ...where.travelDate, lte: new Date(endDate) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          allocation: {
            include: {
              vehicle: { select: { id: true, registrationNumber: true, vehicleType: true, model: true } },
              driver: { select: { id: true, name: true, phone: true } },
            },
          },
          tripStatus: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

const getBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseId(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        allocation: {
          include: {
            vehicle: true,
            driver: true,
          },
        },
        tripStatus: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Access control
    if (req.user.role === 'FACULTY' && booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      facultyName, department, contactNumber, purpose, destination,
      startingLocation, travelDate, departureTime, returnDate, returnTime,
      numberOfPassengers, vehicleType, specialRequirements, remarks,
    } = req.body;

    // Validation
    const required = { facultyName, department, contactNumber, purpose, destination, startingLocation, travelDate, departureTime, returnDate, returnTime, numberOfPassengers, vehicleType };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        facultyName,
        department,
        contactNumber,
        purpose,
        destination,
        startingLocation,
        travelDate: new Date(travelDate),
        departureTime,
        returnDate: new Date(returnDate),
        returnTime,
        numberOfPassengers: parseInt(numberOfPassengers),
        vehicleType,
        specialRequirements: specialRequirements || null,
        remarks: remarks || null,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      description: `Created booking #${booking.id} for ${destination}`,
    });

    // Notify HOD
    await notifyByRole({
      role: 'HOD',
      title: 'New Vehicle Request',
      message: `${facultyName} has submitted a vehicle request for ${destination} on ${new Date(travelDate).toLocaleDateString()}.`,
      type: 'BOOKING_CREATED',
      relatedId: booking.id,
      departmentId: req.user.departmentId,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

const updateBooking = async (req, res) => {
  try {
    const bookingId = parseId(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'FACULTY' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(existing.status) && req.user.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Cannot edit completed or cancelled bookings' });
    }

    const {
      facultyName, department, contactNumber, purpose, destination,
      startingLocation, travelDate, departureTime, returnDate, returnTime,
      numberOfPassengers, vehicleType, specialRequirements, remarks,
    } = req.body;

    const data = {};
    if (facultyName !== undefined) data.facultyName = facultyName;
    if (department !== undefined) data.department = department;
    if (contactNumber !== undefined) data.contactNumber = contactNumber;
    if (purpose !== undefined) data.purpose = purpose;
    if (destination !== undefined) data.destination = destination;
    if (startingLocation !== undefined) data.startingLocation = startingLocation;
    if (travelDate !== undefined) data.travelDate = new Date(travelDate);
    if (departureTime !== undefined) data.departureTime = departureTime;
    if (returnDate !== undefined) data.returnDate = new Date(returnDate);
    if (returnTime !== undefined) data.returnTime = returnTime;
    if (numberOfPassengers !== undefined) data.numberOfPassengers = parseInt(numberOfPassengers);
    if (vehicleType !== undefined) data.vehicleType = vehicleType;
    if (specialRequirements !== undefined) data.specialRequirements = specialRequirements;
    if (remarks !== undefined) data.remarks = remarks;

    const booking = await prisma.booking.update({ where: { id: bookingId }, data });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      description: `Updated booking #${booking.id}`,
    });

    res.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
};

const approveBooking = async (req, res) => {
  try {
    const bookingId = parseId(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'APPROVE_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      description: `Approved booking #${booking.id}`,
    });

    // Notify faculty
    await createNotification({
      userId: existing.userId,
      title: 'Booking Approved',
      message: `Your vehicle request #${booking.id} for ${existing.destination} has been approved.`,
      type: 'BOOKING_APPROVED',
      relatedId: booking.id,
    });

    // Notify transport officer
    await notifyByRole({
      role: 'TRANSPORT_OFFICER',
      title: 'Approved Booking Requires Allocation',
      message: `Booking #${booking.id} for ${existing.destination} has been approved and requires vehicle allocation.`,
      type: 'BOOKING_NEEDS_ALLOCATION',
      relatedId: booking.id,
    });

    res.json(booking);
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ message: 'Failed to approve booking' });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const bookingId = parseId(req.params.id);
    const { rejectionRemarks } = req.body;
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REJECTED',
        rejectionRemarks: rejectionRemarks || null,
        approvedBy: req.user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'REJECT_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      description: `Rejected booking #${booking.id}: ${rejectionRemarks || 'No reason provided'}`,
    });

    await createNotification({
      userId: existing.userId,
      title: 'Booking Rejected',
      message: `Your vehicle request #${booking.id} for ${existing.destination} has been rejected.${rejectionRemarks ? ' Reason: ' + rejectionRemarks : ''}`,
      type: 'BOOKING_REJECTED',
      relatedId: booking.id,
    });

    res.json(booking);
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Failed to reject booking' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const bookingId = parseId(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'FACULTY' && existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CANCEL_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      description: `Cancelled booking #${booking.id}`,
    });

    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

const getRouteInfo = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseId(req.params.id) },
      include: {
        allocation: {
          include: {
            vehicle: { select: { registrationNumber: true, vehicleType: true, model: true } },
            driver: { select: { name: true, phone: true } },
          },
        },
        tripStatus: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!booking) return res.status(404).json({ message: 'Trip/Booking not found' });

    res.json({
      id: booking.id,
      facultyName: booking.facultyName,
      department: booking.department,
      contactNumber: booking.contactNumber,
      destination: booking.destination,
      startingLocation: booking.startingLocation,
      travelDate: booking.travelDate,
      departureTime: booking.departureTime,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
      numberOfPassengers: booking.numberOfPassengers,
      vehicleType: booking.vehicleType,
      status: booking.status,
      purpose: booking.purpose,
      allocation: booking.allocation,
      currentTripStatus: booking.tripStatus[0]?.status || 'SCHEDULED',
    });
  } catch (error) {
    console.error('Get route info error:', error);
    res.status(500).json({ message: 'Failed to fetch route info' });
  }
};

module.exports = {
  getBookings, getBooking, createBooking, updateBooking,
  approveBooking, rejectBooking, cancelBooking, getRouteInfo,
};

