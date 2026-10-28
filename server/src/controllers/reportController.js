const prisma = require('../config/db');

const getReports = async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Summary stats
    const [
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      allocatedBookings,
      ongoingBookings,
      completedBookings,
      cancelledBookings,
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      totalDrivers,
      availableDrivers,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'APPROVED' } }),
      prisma.booking.count({ where: { status: 'REJECTED' } }),
      prisma.booking.count({ where: { status: 'ALLOCATED' } }),
      prisma.booking.count({ where: { status: 'ONGOING' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.vehicle.count({ where: { isActive: true, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { isActive: true, status: { in: ['BOOKED', 'IN_USE'] } } }),
      prisma.vehicle.count({ where: { isActive: true, status: 'MAINTENANCE' } }),
      prisma.driver.count({ where: { isActive: true } }),
      prisma.driver.count({ where: { isActive: true, status: 'AVAILABLE' } }),
    ]);

    // Monthly bookings for the current year
    const monthlyBookings = await prisma.booking.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startOfYear } },
      _count: true,
    });

    // Get bookings per month
    const allBookingsThisYear = await prisma.booking.findMany({
      where: { createdAt: { gte: startOfYear } },
      select: { createdAt: true, status: true },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(now.getFullYear(), i).toLocaleString('default', { month: 'short' }),
      bookings: 0,
      completed: 0,
      rejected: 0,
    }));

    allBookingsThisYear.forEach((b) => {
      const month = b.createdAt.getMonth();
      monthlyData[month].bookings++;
      if (b.status === 'COMPLETED') monthlyData[month].completed++;
      if (b.status === 'REJECTED') monthlyData[month].rejected++;
    });

    // Department-wise bookings
    const departmentBookings = await prisma.booking.groupBy({
      by: ['department'],
      _count: true,
      orderBy: { _count: { department: 'desc' } },
      take: 10,
    });

    // Vehicle utilization
    const vehicleUtilization = await prisma.vehicle.findMany({
      where: { isActive: true },
      select: {
        id: true,
        registrationNumber: true,
        vehicleType: true,
        _count: { select: { allocations: true } },
      },
      orderBy: { allocations: { _count: 'desc' } },
      take: 10,
    });

    res.json({
      summary: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        allocatedBookings,
        ongoingBookings,
        completedBookings,
        cancelledBookings,
        totalVehicles,
        availableVehicles,
        inUseVehicles,
        maintenanceVehicles,
        totalDrivers,
        availableDrivers,
      },
      monthlyData,
      departmentBookings: departmentBookings.map((d) => ({
        department: d.department,
        count: d._count,
      })),
      vehicleUtilization: vehicleUtilization.map((v) => ({
        vehicle: v.registrationNumber,
        type: v.vehicleType,
        trips: v._count.allocations,
      })),
      statusDistribution: [
        { name: 'Pending', value: pendingBookings },
        { name: 'Approved', value: approvedBookings },
        { name: 'Allocated', value: allocatedBookings },
        { name: 'Ongoing', value: ongoingBookings },
        { name: 'Completed', value: completedBookings },
        { name: 'Rejected', value: rejectedBookings },
        { name: 'Cancelled', value: cancelledBookings },
      ],
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Failed to generate reports' });
  }
};

module.exports = { getReports };
