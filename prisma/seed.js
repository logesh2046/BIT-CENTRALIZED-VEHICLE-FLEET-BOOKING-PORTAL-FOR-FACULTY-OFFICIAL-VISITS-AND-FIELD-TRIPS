let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  PrismaClient = require('../server/node_modules/@prisma/client').PrismaClient;
}

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = require('../server/node_modules/bcryptjs');
}



const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.tripStatus.deleteMany();
  await prisma.vehicleAllocation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Computer Science and Engineering', code: 'CSE' } }),
    prisma.department.create({ data: { name: 'Electronics and Communication Engineering', code: 'ECE' } }),
    prisma.department.create({ data: { name: 'Electrical and Electronics Engineering', code: 'EEE' } }),
    prisma.department.create({ data: { name: 'Mechanical Engineering', code: 'MECH' } }),
    prisma.department.create({ data: { name: 'Civil Engineering', code: 'CIVIL' } }),
    prisma.department.create({ data: { name: 'Information Technology', code: 'IT' } }),
    prisma.department.create({ data: { name: 'Artificial Intelligence and Data Science', code: 'AIDS' } }),
    prisma.department.create({ data: { name: 'Master of Business Administration', code: 'MBA' } }),
  ]);

  console.log(`📚 Created ${departments.length} departments`);

  const password = await bcrypt.hash('password123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bit.edu',
      password,
      name: 'System Administrator',
      phone: '9876543210',
      role: 'ADMIN',
      departmentId: departments[0].id,
    },
  });

  const hod = await prisma.user.create({
    data: {
      email: 'hod.cse@bit.edu',
      password,
      name: 'Dr. Ramesh Kumar',
      phone: '9876543211',
      role: 'HOD',
      departmentId: departments[0].id,
    },
  });

  const hodEce = await prisma.user.create({
    data: {
      email: 'hod.ece@bit.edu',
      password,
      name: 'Dr. Priya Sharma',
      phone: '9876543212',
      role: 'HOD',
      departmentId: departments[1].id,
    },
  });

  const transportOfficer = await prisma.user.create({
    data: {
      email: 'transport@bit.edu',
      password,
      name: 'Suresh Babu',
      phone: '9876543213',
      role: 'TRANSPORT_OFFICER',
    },
  });

  const faculty1 = await prisma.user.create({
    data: {
      email: 'faculty1@bit.edu',
      password,
      name: 'Prof. Anand Krishnan',
      phone: '9876543214',
      role: 'FACULTY',
      departmentId: departments[0].id,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'faculty2@bit.edu',
      password,
      name: 'Prof. Meena Sundari',
      phone: '9876543215',
      role: 'FACULTY',
      departmentId: departments[0].id,
    },
  });

  const faculty3 = await prisma.user.create({
    data: {
      email: 'faculty3@bit.edu',
      password,
      name: 'Prof. Vijay Kumar',
      phone: '9876543216',
      role: 'FACULTY',
      departmentId: departments[1].id,
    },
  });

  const driverUser1 = await prisma.user.create({
    data: {
      email: 'driver1@bit.edu',
      password,
      name: 'Murugan K',
      phone: '9876543217',
      role: 'DRIVER',
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      email: 'driver2@bit.edu',
      password,
      name: 'Ravi Shankar',
      phone: '9876543218',
      role: 'DRIVER',
    },
  });

  const driverUser3 = await prisma.user.create({
    data: {
      email: 'driver3@bit.edu',
      password,
      name: 'Senthil Kumar',
      phone: '9876543219',
      role: 'DRIVER',
    },
  });

  console.log('👥 Created users');

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-001',
        vehicleType: 'Bus',
        model: 'Ashok Leyland Viking',
        seatingCapacity: 52,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-06-30'),
        fitnessExpiry: new Date('2027-03-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-002',
        vehicleType: 'Bus',
        model: 'Tata Starbus',
        seatingCapacity: 45,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-08-15'),
        fitnessExpiry: new Date('2027-05-20'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-003',
        vehicleType: 'Mini Bus',
        model: 'Force Traveller',
        seatingCapacity: 26,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-04-30'),
        fitnessExpiry: new Date('2027-02-28'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-004',
        vehicleType: 'Van',
        model: 'Toyota Innova Crysta',
        seatingCapacity: 7,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-09-30'),
        fitnessExpiry: new Date('2027-07-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-005',
        vehicleType: 'Van',
        model: 'Maruti Suzuki Ertiga',
        seatingCapacity: 7,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-12-31'),
        fitnessExpiry: new Date('2027-10-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-006',
        vehicleType: 'Car',
        model: 'Honda City',
        seatingCapacity: 4,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-11-30'),
        fitnessExpiry: new Date('2027-09-30'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-007',
        vehicleType: 'Bus',
        model: 'Eicher Skyline Pro',
        seatingCapacity: 40,
        status: 'MAINTENANCE',
        insuranceExpiry: new Date('2027-05-31'),
        fitnessExpiry: new Date('2027-01-31'),
        maintenanceInfo: 'Engine overhaul in progress',
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TN-39-BIT-008',
        vehicleType: 'Mini Bus',
        model: 'Tempo Traveller',
        seatingCapacity: 12,
        status: 'AVAILABLE',
        insuranceExpiry: new Date('2027-07-15'),
        fitnessExpiry: new Date('2027-04-15'),
      },
    }),
  ]);

  console.log(`🚗 Created ${vehicles.length} vehicles`);

  // Create drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Murugan K',
        phone: '9876543217',
        licenseNumber: 'TN-39-2020-001234',
        licenseExpiry: new Date('2028-12-31'),
        status: 'AVAILABLE',
        userId: driverUser1.id,
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Ravi Shankar',
        phone: '9876543218',
        licenseNumber: 'TN-39-2019-005678',
        licenseExpiry: new Date('2028-06-30'),
        status: 'AVAILABLE',
        userId: driverUser2.id,
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Senthil Kumar',
        phone: '9876543219',
        licenseNumber: 'TN-39-2021-009012',
        licenseExpiry: new Date('2029-03-31'),
        status: 'AVAILABLE',
        userId: driverUser3.id,
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Balasubramanian P',
        phone: '9876543220',
        licenseNumber: 'TN-39-2018-003456',
        licenseExpiry: new Date('2027-09-30'),
        status: 'AVAILABLE',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Karthik Raja',
        phone: '9876543221',
        licenseNumber: 'TN-39-2022-007890',
        licenseExpiry: new Date('2029-12-31'),
        status: 'AVAILABLE',
      },
    }),
  ]);

  console.log(`🧑‍✈️ Created ${drivers.length} drivers`);

  // Create sample bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: faculty1.id,
      facultyName: 'Prof. Anand Krishnan',
      department: 'Computer Science and Engineering',
      contactNumber: '9876543214',
      purpose: 'Industry visit to TCS Coimbatore for final year students',
      destination: 'TCS, Coimbatore',
      startingLocation: 'BIT Campus, Sathyamangalam',
      travelDate: new Date('2026-10-15'),
      departureTime: '08:00',
      returnDate: new Date('2026-10-15'),
      returnTime: '18:00',
      numberOfPassengers: 45,
      vehicleType: 'Bus',
      specialRequirements: 'Need bus with AC',
      status: 'PENDING',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: faculty2.id,
      facultyName: 'Prof. Meena Sundari',
      department: 'Computer Science and Engineering',
      contactNumber: '9876543215',
      purpose: 'Conference at PSG College of Technology',
      destination: 'PSG College of Technology, Coimbatore',
      startingLocation: 'BIT Campus, Sathyamangalam',
      travelDate: new Date('2026-10-20'),
      departureTime: '07:30',
      returnDate: new Date('2026-10-21'),
      returnTime: '20:00',
      numberOfPassengers: 5,
      vehicleType: 'Van',
      status: 'APPROVED',
      approvedBy: hod.id,
      approvedAt: new Date('2026-10-02'),
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      userId: faculty3.id,
      facultyName: 'Prof. Vijay Kumar',
      department: 'Electronics and Communication Engineering',
      contactNumber: '9876543216',
      purpose: 'Workshop at Anna University Chennai',
      destination: 'Anna University, Chennai',
      startingLocation: 'BIT Campus, Sathyamangalam',
      travelDate: new Date('2026-10-25'),
      departureTime: '06:00',
      returnDate: new Date('2026-10-27'),
      returnTime: '22:00',
      numberOfPassengers: 20,
      vehicleType: 'Mini Bus',
      specialRequirements: 'Need to carry equipment boxes',
      remarks: 'Two-day workshop participation',
      status: 'ALLOCATED',
      approvedBy: hodEce.id,
      approvedAt: new Date('2026-10-03'),
    },
  });

  // Create allocation for booking3
  await prisma.vehicleAllocation.create({
    data: {
      bookingId: booking3.id,
      vehicleId: vehicles[2].id, // Mini Bus
      driverId: drivers[0].id,
      allocatedBy: transportOfficer.id,
    },
  });

  await prisma.tripStatus.create({
    data: {
      bookingId: booking3.id,
      status: 'ASSIGNED',
      updatedBy: transportOfficer.id,
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      userId: faculty1.id,
      facultyName: 'Prof. Anand Krishnan',
      department: 'Computer Science and Engineering',
      contactNumber: '9876543214',
      purpose: 'Guest lecture at Kongu Engineering College',
      destination: 'Kongu Engineering College, Perundurai',
      startingLocation: 'BIT Campus, Sathyamangalam',
      travelDate: new Date('2026-09-20'),
      departureTime: '09:00',
      returnDate: new Date('2026-09-20'),
      returnTime: '17:00',
      numberOfPassengers: 3,
      vehicleType: 'Car',
      status: 'COMPLETED',
      approvedBy: hod.id,
      approvedAt: new Date('2026-09-15'),
    },
  });

  await prisma.vehicleAllocation.create({
    data: {
      bookingId: booking4.id,
      vehicleId: vehicles[5].id, // Car
      driverId: drivers[1].id,
      allocatedBy: transportOfficer.id,
    },
  });

  await prisma.tripStatus.createMany({
    data: [
      { bookingId: booking4.id, status: 'ASSIGNED', updatedBy: transportOfficer.id, createdAt: new Date('2026-09-18') },
      { bookingId: booking4.id, status: 'STARTED', updatedBy: driverUser2.id, createdAt: new Date('2026-09-20T09:00:00') },
      { bookingId: booking4.id, status: 'IN_TRANSIT', updatedBy: driverUser2.id, createdAt: new Date('2026-09-20T09:30:00') },
      { bookingId: booking4.id, status: 'COMPLETED', updatedBy: driverUser2.id, createdAt: new Date('2026-09-20T17:00:00') },
    ],
  });

  const booking5 = await prisma.booking.create({
    data: {
      userId: faculty2.id,
      facultyName: 'Prof. Meena Sundari',
      department: 'Computer Science and Engineering',
      contactNumber: '9876543215',
      purpose: 'Research collaboration meeting',
      destination: 'IIT Madras, Chennai',
      startingLocation: 'BIT Campus, Sathyamangalam',
      travelDate: new Date('2026-09-10'),
      departureTime: '05:00',
      returnDate: new Date('2026-09-12'),
      returnTime: '23:00',
      numberOfPassengers: 2,
      vehicleType: 'Car',
      status: 'REJECTED',
      rejectionRemarks: 'Vehicle not available for the requested dates due to scheduled maintenance',
      approvedBy: hod.id,
      approvedAt: new Date('2026-09-08'),
    },
  });

  console.log('📋 Created sample bookings');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: hod.id,
        title: 'New Vehicle Request',
        message: 'Prof. Anand Krishnan has submitted a vehicle request for TCS, Coimbatore.',
        type: 'BOOKING_CREATED',
        relatedId: booking1.id,
      },
      {
        userId: faculty2.id,
        title: 'Booking Approved',
        message: 'Your vehicle request #2 for PSG College of Technology has been approved.',
        type: 'BOOKING_APPROVED',
        relatedId: booking2.id,
        isRead: true,
      },
      {
        userId: transportOfficer.id,
        title: 'Approved Booking Requires Allocation',
        message: 'Booking #2 for PSG College of Technology has been approved and requires vehicle allocation.',
        type: 'BOOKING_NEEDS_ALLOCATION',
        relatedId: booking2.id,
      },
      {
        userId: faculty3.id,
        title: 'Vehicle Allocated',
        message: 'Vehicle TN-39-BIT-003 and driver Murugan K have been assigned for your booking #3.',
        type: 'VEHICLE_ALLOCATED',
        relatedId: booking3.id,
        isRead: true,
      },
      {
        userId: driverUser1.id,
        title: 'New Trip Assigned',
        message: 'You have been assigned to a trip to Anna University, Chennai on 25th October.',
        type: 'TRIP_ASSIGNED',
        relatedId: booking3.id,
      },
      {
        userId: admin.id,
        title: 'Vehicle Maintenance Due',
        message: 'Vehicle TN-39-BIT-007 (Eicher Skyline Pro) is currently under maintenance.',
        type: 'MAINTENANCE_ALERT',
        relatedId: vehicles[6].id,
      },
    ],
  });

  console.log('🔔 Created sample notifications');

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: admin.id,
        description: 'System Administrator logged in',
      },
      {
        userId: faculty1.id,
        action: 'CREATE_BOOKING',
        entity: 'Booking',
        entityId: booking1.id,
        description: 'Created booking #1 for TCS, Coimbatore',
      },
      {
        userId: hod.id,
        action: 'APPROVE_BOOKING',
        entity: 'Booking',
        entityId: booking2.id,
        description: 'Approved booking #2',
      },
      {
        userId: hod.id,
        action: 'REJECT_BOOKING',
        entity: 'Booking',
        entityId: booking5.id,
        description: 'Rejected booking #5: Vehicle not available',
      },
      {
        userId: transportOfficer.id,
        action: 'ALLOCATE_VEHICLE',
        entity: 'VehicleAllocation',
        entityId: 1,
        description: 'Allocated vehicle TN-39-BIT-003 and driver Murugan K to booking #3',
      },
      {
        userId: driverUser2.id,
        action: 'UPDATE_TRIP_STATUS',
        entity: 'TripStatus',
        entityId: 1,
        description: 'Updated trip status for booking #4 to COMPLETED',
      },
    ],
  });

  console.log('📝 Created sample audit logs');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('=================================');
  console.log('Demo Login Credentials:');
  console.log('=================================');
  console.log('Admin:              admin@bit.edu / password123');
  console.log('HOD (CSE):          hod.cse@bit.edu / password123');
  console.log('HOD (ECE):          hod.ece@bit.edu / password123');
  console.log('Transport Officer:  transport@bit.edu / password123');
  console.log('Faculty 1 (CSE):    faculty1@bit.edu / password123');
  console.log('Faculty 2 (CSE):    faculty2@bit.edu / password123');
  console.log('Faculty 3 (ECE):    faculty3@bit.edu / password123');
  console.log('Driver 1:           driver1@bit.edu / password123');
  console.log('Driver 2:           driver2@bit.edu / password123');
  console.log('Driver 3:           driver3@bit.edu / password123');
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
