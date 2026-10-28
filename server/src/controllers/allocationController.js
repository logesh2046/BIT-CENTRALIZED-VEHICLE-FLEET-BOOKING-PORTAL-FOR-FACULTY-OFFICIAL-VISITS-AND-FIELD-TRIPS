const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');
const { createAuditLog } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendFacultyAllocationEmail, sendDriverAllocationEmail, sendEmail } = require('../services/emailService');

const createAllocation = async (req, res) => {
  try {
    const { bookingId, vehicleId, driverId } = req.body;

    if (!bookingId || !vehicleId || !driverId) {
      return res.status(400).json({ message: 'Booking ID, vehicle ID, and driver ID are required' });
    }

    // Check booking exists and is approved
    const booking = await prisma.booking.findUnique({ where: { id: parseId(bookingId) } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Only approved bookings can be allocated' });
    }

    // Check existing allocation
    const existingAllocation = await prisma.vehicleAllocation.findUnique({
      where: { bookingId: parseId(bookingId) },
    });
    if (existingAllocation) {
      return res.status(400).json({ message: 'Booking already has a vehicle allocation' });
    }

    // Check vehicle availability
    const vehicle = await prisma.vehicle.findUnique({ where: { id: parseId(vehicleId) } });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status === 'MAINTENANCE') {
      return res.status(400).json({ message: 'Vehicle is under maintenance' });
    }

    // Check vehicle conflict
    const vehicleConflict = await prisma.vehicleAllocation.findFirst({
      where: {
        vehicleId: parseId(vehicleId),
        booking: {
          status: { in: ['ALLOCATED', 'ONGOING'] },
          travelDate: { lte: booking.returnDate },
          returnDate: { gte: booking.travelDate },
        },
      },
    });
    if (vehicleConflict) {
      return res.status(400).json({ message: 'Vehicle has a conflicting booking during this period' });
    }

    // Check driver availability
    const driver = await prisma.driver.findUnique({ where: { id: parseId(driverId) } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const driverConflict = await prisma.vehicleAllocation.findFirst({
      where: {
        driverId: parseId(driverId),
        booking: {
          status: { in: ['ALLOCATED', 'ONGOING'] },
          travelDate: { lte: booking.returnDate },
          returnDate: { gte: booking.travelDate },
        },
      },
    });
    if (driverConflict) {
      return res.status(400).json({ message: 'Driver has a conflicting assignment during this period' });
    }

    // Create allocation and update booking status
    const allocation = await prisma.$transaction(async (tx) => {
      const alloc = await tx.vehicleAllocation.create({
        data: {
          bookingId: parseId(bookingId),
          vehicleId: parseId(vehicleId),
          driverId: parseId(driverId),
          allocatedBy: req.user.id,
        },
        include: {
          vehicle: true,
          driver: true,
          booking: {
            include: {
              user: true,
            },
          },
        },
      });

      await tx.booking.update({
        where: { id: parseId(bookingId) },
        data: { status: 'ALLOCATED' },
      });

      // Create trip status entry
      await tx.tripStatus.create({
        data: {
          bookingId: parseId(bookingId),
          status: 'ASSIGNED',
          updatedBy: req.user.id,
        },
      });

      return alloc;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ALLOCATE_VEHICLE',
      entity: 'VehicleAllocation',
      entityId: allocation.id,
      description: `Allocated vehicle ${vehicle.registrationNumber} and driver ${driver.name} to booking #${bookingId}`,
    });

    // Notify faculty
    await createNotification({
      userId: booking.userId,
      title: 'Vehicle Allocated',
      message: `Vehicle ${vehicle.registrationNumber} and driver ${driver.name} have been assigned for your booking #${bookingId}.`,
      type: 'VEHICLE_ALLOCATED',
      relatedId: parseId(bookingId),
    });

    // Notify driver (find driver's user account if exists)
    if (driver.userId) {
      await createNotification({
        userId: driver.userId,
        title: 'New Trip Assigned',
        message: `You have been assigned to a trip to ${booking.destination} on ${booking.travelDate.toLocaleDateString()}.`,
        type: 'TRIP_ASSIGNED',
        relatedId: parseId(bookingId),
      });
    }

    // Trigger Brevo SMTP email notifications (Bilingual to Faculty, Tamil-first to Driver)
    Promise.allSettled([
      sendFacultyAllocationEmail({ booking: allocation.booking, vehicle: allocation.vehicle, driver: allocation.driver, isUpdate: false }),
      sendDriverAllocationEmail({ booking: allocation.booking, vehicle: allocation.vehicle, driver: allocation.driver, isUpdate: false }),
    ]).catch((emailErr) => {
      console.error('[EMAIL DISPATCH ERROR]', emailErr.message);
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error('Create allocation error:', error);
    res.status(500).json({ message: 'Failed to create allocation' });
  }
};

const getAllocations = async (req, res) => {
  try {
    const allocations = await prisma.vehicleAllocation.findMany({
      include: {
        booking: {
          select: {
            id: true,
            facultyName: true,
            destination: true,
            startingLocation: true,
            contactNumber: true,
            travelDate: true,
            departureTime: true,
            returnDate: true,
            returnTime: true,
            status: true,
            department: true,
            numberOfPassengers: true,
            vehicleType: true,
            purpose: true,
          },
        },
        vehicle: { select: { id: true, registrationNumber: true, vehicleType: true, model: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(allocations);
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Failed to fetch allocations' });
  }
};

const updateAllocation = async (req, res) => {
  try {
    const { vehicleId, driverId } = req.body;
    const allocationId = parseId(req.params.id);

    const existing = await prisma.vehicleAllocation.findUnique({
      where: { id: allocationId },
      include: {
        booking: true,
        driver: true,
        vehicle: true,
      },
    });

    if (!existing) return res.status(404).json({ message: 'Allocation not found' });

    if (['COMPLETED', 'CANCELLED'].includes(existing.booking.status)) {
      return res.status(400).json({ message: 'Cannot modify allocation for completed or cancelled bookings' });
    }

    const data = {};

    if (vehicleId) {
      // Check vehicle conflict
      const vehicleConflict = await prisma.vehicleAllocation.findFirst({
        where: {
          vehicleId: parseId(vehicleId),
          id: { not: allocationId },
          booking: {
            status: { in: ['ALLOCATED', 'ONGOING'] },
            travelDate: { lte: existing.booking.returnDate },
            returnDate: { gte: existing.booking.travelDate },
          },
        },
      });
      if (vehicleConflict) {
        return res.status(400).json({ message: 'Vehicle has a conflicting booking during this period' });
      }
      data.vehicleId = parseId(vehicleId);
    }

    if (driverId) {
      const driverConflict = await prisma.vehicleAllocation.findFirst({
        where: {
          driverId: parseId(driverId),
          id: { not: allocationId },
          booking: {
            status: { in: ['ALLOCATED', 'ONGOING'] },
            travelDate: { lte: existing.booking.returnDate },
            returnDate: { gte: existing.booking.travelDate },
          },
        },
      });
      if (driverConflict) {
        return res.status(400).json({ message: 'Driver has a conflicting assignment during this period' });
      }
      data.driverId = parseId(driverId);
    }

    const allocation = await prisma.vehicleAllocation.update({
      where: { id: allocationId },
      data,
      include: {
        vehicle: true,
        driver: true,
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_ALLOCATION',
      entity: 'VehicleAllocation',
      entityId: allocation.id,
      description: `Updated allocation for booking #${existing.bookingId}`,
    });

    // Notify faculty of updated assignment
    await createNotification({
      userId: allocation.booking.userId,
      title: 'Vehicle Allocation Updated',
      message: `The assignment for your booking #${allocation.bookingId} was updated to vehicle ${allocation.vehicle.registrationNumber} and driver ${allocation.driver.name}.`,
      type: 'ALLOCATION_UPDATED',
      relatedId: allocation.bookingId,
    });

    // Notify assigned driver
    if (allocation.driver.userId) {
      await createNotification({
        userId: allocation.driver.userId,
        title: 'Trip Assignment Updated',
        message: `Your assignment for booking #${allocation.bookingId} to ${allocation.booking.destination} has been updated.`,
        type: 'TRIP_UPDATED',
        relatedId: allocation.bookingId,
      });
    }

    // If driver changed, notify previous driver
    if (driverId && parseId(driverId) !== existing.driverId && existing.driver?.userId) {
      await createNotification({
        userId: existing.driver.userId,
        title: 'Trip Reassigned',
        message: `Your duty for booking #${allocation.bookingId} to ${allocation.booking.destination} has been reassigned by the Transport Office.`,
        type: 'TRIP_REASSIGNED',
        relatedId: allocation.bookingId,
      });
    }

    // Trigger assignment change emails (Bilingual to Faculty, Tamil-first to Driver)
    Promise.allSettled([
      sendFacultyAllocationEmail({ booking: allocation.booking, vehicle: allocation.vehicle, driver: allocation.driver, isUpdate: true }),
      sendDriverAllocationEmail({ booking: allocation.booking, vehicle: allocation.vehicle, driver: allocation.driver, isUpdate: true }),
    ]).catch((emailErr) => {
      console.error('[EMAIL UPDATE DISPATCH ERROR]', emailErr.message);
    });

    res.json(allocation);
  } catch (error) {
    console.error('Update allocation error:', error);
    res.status(500).json({ message: 'Failed to update allocation' });
  }
};

const getEmailLogs = async (req, res) => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({ message: 'Failed to fetch email notification logs' });
  }
};

const sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Recipient email address is required' });

    const result = await sendEmail({
      to,
      role: 'TEST',
      subject: '[BIT Fleet] Brevo SMTP Free Notification Verification',
      text: 'This is a test notification confirming that Brevo Free SMTP is configured and functioning on the BIT Centralized Vehicle Fleet Booking Portal.',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #0f172a; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="color: white; margin: 0; font-size: 18px;">Bannari Amman Institute of Technology</h2>
              <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Centralized Vehicle Fleet Booking Portal</p>
            </div>
            <h3 style="color: #16a34a; margin-top: 0;">✅ Brevo Free SMTP Test Successful</h3>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
              This test confirms that your SMTP credentials configured in <code>server/.env</code> are working with Brevo's free relay service.
            </p>
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; border-radius: 0 6px 6px 0; font-size: 13px; color: #1e40af; margin-top: 16px;">
              <strong>Bilingual & Tamil-first emails</strong> are automatically dispatched to faculty and drivers upon vehicle assignment and modifications.
            </div>
          </div>
        </div>
      `,
    });

    res.json(result);
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};

module.exports = { createAllocation, getAllocations, updateAllocation, getEmailLogs, sendTestEmail };

