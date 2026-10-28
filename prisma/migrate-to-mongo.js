const { MongoClient, ObjectId } = require('mongodb');
const { PrismaClient: SqlitePrisma } = require('@prisma/client');

const MONGO_URI = 'mongodb+srv://logesh2046_db_user:W7a4tbRxC1SKy7Gp@cluster0.rmcvjxf.mongodb.net/bit_fleet?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  console.log('🚀 Starting SQLite -> MongoDB Atlas migration...');
  const sqlitePrisma = new SqlitePrisma();

  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db('bit_fleet');
  console.log('✅ Connected to MongoDB Atlas bit_fleet database');

  // ID mappings (SQLite integer ID -> MongoDB ObjectId)
  const deptMap = new Map();
  const userMap = new Map();
  const vehicleMap = new Map();
  const driverMap = new Map();
  const bookingMap = new Map();

  // 1. Departments
  const departments = await sqlitePrisma.department.findMany();
  console.log(`Migrating ${departments.length} departments...`);
  await db.collection('Department').deleteMany({});
  for (const d of departments) {
    const newId = new ObjectId();
    deptMap.set(d.id, newId);
    await db.collection('Department').insertOne({
      _id: newId,
      name: d.name,
      code: d.code,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    });
  }

  // 2. Users
  const users = await sqlitePrisma.user.findMany();
  console.log(`Migrating ${users.length} users...`);
  await db.collection('User').deleteMany({});
  for (const u of users) {
    const newId = new ObjectId();
    userMap.set(u.id, newId);
    await db.collection('User').insertOne({
      _id: newId,
      email: u.email,
      password: u.password,
      name: u.name,
      phone: u.phone,
      role: u.role,
      departmentId: u.departmentId ? deptMap.get(u.departmentId) : null,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    });
  }

  // 3. Vehicles
  const vehicles = await sqlitePrisma.vehicle.findMany();
  console.log(`Migrating ${vehicles.length} vehicles...`);
  await db.collection('Vehicle').deleteMany({});
  for (const v of vehicles) {
    const newId = new ObjectId();
    vehicleMap.set(v.id, newId);
    await db.collection('Vehicle').insertOne({
      _id: newId,
      registrationNumber: v.registrationNumber,
      vehicleType: v.vehicleType,
      model: v.model,
      seatingCapacity: v.seatingCapacity,
      status: v.status,
      insuranceExpiry: v.insuranceExpiry,
      fitnessExpiry: v.fitnessExpiry,
      maintenanceInfo: v.maintenanceInfo,
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    });
  }

  // 4. Drivers
  const drivers = await sqlitePrisma.driver.findMany();
  console.log(`Migrating ${drivers.length} drivers...`);
  await db.collection('Driver').deleteMany({});
  for (const d of drivers) {
    const newId = new ObjectId();
    driverMap.set(d.id, newId);
    await db.collection('Driver').insertOne({
      _id: newId,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
      licenseExpiry: d.licenseExpiry,
      status: d.status,
      assignedVehicleId: d.assignedVehicleId ? vehicleMap.get(d.assignedVehicleId) : null,
      isActive: d.isActive,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      userId: d.userId ? userMap.get(d.userId) : null
    });
  }

  // 5. Bookings
  const bookings = await sqlitePrisma.booking.findMany();
  console.log(`Migrating ${bookings.length} bookings...`);
  await db.collection('Booking').deleteMany({});
  for (const b of bookings) {
    const newId = new ObjectId();
    bookingMap.set(b.id, newId);
    await db.collection('Booking').insertOne({
      _id: newId,
      userId: userMap.get(b.userId),
      facultyName: b.facultyName,
      department: b.department,
      contactNumber: b.contactNumber,
      purpose: b.purpose,
      destination: b.destination,
      startingLocation: b.startingLocation,
      travelDate: b.travelDate,
      departureTime: b.departureTime,
      returnDate: b.returnDate,
      returnTime: b.returnTime,
      numberOfPassengers: b.numberOfPassengers,
      vehicleType: b.vehicleType,
      specialRequirements: b.specialRequirements,
      remarks: b.remarks,
      status: b.status,
      rejectionRemarks: b.rejectionRemarks,
      approvedBy: b.approvedBy ? String(userMap.get(b.approvedBy)) : null,
      approvedAt: b.approvedAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    });
  }

  // 6. Allocations
  const allocations = await sqlitePrisma.vehicleAllocation.findMany();
  console.log(`Migrating ${allocations.length} allocations...`);
  await db.collection('VehicleAllocation').deleteMany({});
  for (const a of allocations) {
    const newId = new ObjectId();
    await db.collection('VehicleAllocation').insertOne({
      _id: newId,
      bookingId: bookingMap.get(a.bookingId),
      vehicleId: vehicleMap.get(a.vehicleId),
      driverId: driverMap.get(a.driverId),
      allocatedBy: userMap.get(a.allocatedBy) || new ObjectId(),
      allocatedAt: a.allocatedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    });
  }

  // 7. Trip Status
  const tripStatuses = await sqlitePrisma.tripStatus.findMany();
  console.log(`Migrating ${tripStatuses.length} trip statuses...`);
  await db.collection('TripStatus').deleteMany({});
  for (const t of tripStatuses) {
    await db.collection('TripStatus').insertOne({
      _id: new ObjectId(),
      bookingId: bookingMap.get(t.bookingId),
      status: t.status,
      remarks: t.remarks,
      updatedBy: userMap.get(t.updatedBy) || new ObjectId(),
      createdAt: t.createdAt
    });
  }

  // 8. Notifications
  const notifications = await sqlitePrisma.notification.findMany();
  console.log(`Migrating ${notifications.length} notifications...`);
  await db.collection('Notification').deleteMany({});
  for (const n of notifications) {
    await db.collection('Notification').insertOne({
      _id: new ObjectId(),
      userId: userMap.get(n.userId),
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      relatedId: n.relatedId ? String(bookingMap.get(n.relatedId) || n.relatedId) : null,
      createdAt: n.createdAt
    });
  }

  console.log('🎉 Migration from SQLite to MongoDB Atlas completed successfully!');
  await sqlitePrisma.$disconnect();
  await mongoClient.close();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
