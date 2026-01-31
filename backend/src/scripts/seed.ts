import { prisma } from '../config/database';
import { generateApiKey } from '../utils/crypto';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Clean existing data (optional - be careful in production!)
    // await prisma.sensorReading.deleteMany();
    // await prisma.alert.deleteMany();
    // await prisma.device.deleteMany();
    // await prisma.coldCell.deleteMany();
    // await prisma.location.deleteMany();
    // await prisma.customer.deleteMany();
    // await prisma.technician.deleteMany();
    // await prisma.user.deleteMany();

    // 1. Create Technician
    const technicianPassword = await bcrypt.hash('technician123', 10);
    const technicianUser = await prisma.user.create({
      data: {
        email: 'tech@example.com',
        password: technicianPassword,
        role: 'TECHNICIAN',
      },
    });

    const technician = await prisma.technician.create({
      data: {
        userId: technicianUser.id,
        name: 'John Technician',
        email: 'tech@example.com',
        phone: '+1-555-0100',
        companyName: 'Tech Services Inc.',
      },
    });

    logger.info('Created technician', { technicianId: technician.id });

    // 2. Create Customers
    const customer1Password = await bcrypt.hash('customer123', 10);
    const customer1User = await prisma.user.create({
      data: {
        email: 'customer1@example.com',
        password: customer1Password,
        role: 'CUSTOMER',
      },
    });

    const customer1 = await prisma.customer.create({
      data: {
        userId: customer1User.id,
        companyName: 'Fresh Foods Market',
        contactName: 'Jane Smith',
        email: 'customer1@example.com',
        phone: '+1-555-0200',
        address: '123 Main St, City, State 12345',
        linkedTechnicianId: technician.id,
        emailVerified: true,
      },
    });

    const customer2Password = await bcrypt.hash('customer123', 10);
    const customer2User = await prisma.user.create({
      data: {
        email: 'customer2@example.com',
        password: customer2Password,
        role: 'CUSTOMER',
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        userId: customer2User.id,
        companyName: 'Bakery Delight',
        contactName: 'Bob Johnson',
        email: 'customer2@example.com',
        phone: '+1-555-0300',
        address: '456 Oak Ave, City, State 12345',
        linkedTechnicianId: technician.id,
        emailVerified: true,
      },
    });

    logger.info('Created customers', {
      customer1Id: customer1.id,
      customer2Id: customer2.id,
    });

    // 3. Create Locations
    const location1 = await prisma.location.create({
      data: {
        locationName: 'Main Store',
        address: '123 Main St, City, State 12345',
        customerId: customer1.id,
      },
    });

    const location2 = await prisma.location.create({
      data: {
        locationName: 'Warehouse',
        address: '789 Warehouse Blvd, City, State 12345',
        customerId: customer1.id,
      },
    });

    const location3 = await prisma.location.create({
      data: {
        locationName: 'Bakery Location',
        address: '456 Oak Ave, City, State 12345',
        customerId: customer2.id,
      },
    });

    logger.info('Created locations', {
      location1Id: location1.id,
      location2Id: location2.id,
      location3Id: location3.id,
    });

    // 4. Create Cold Cells
    const coldCell1 = await prisma.coldCell.create({
      data: {
        name: 'Freezer 1',
        type: 'freezer',
        temperatureMinThreshold: -25,
        temperatureMaxThreshold: -15,
        locationId: location1.id,
      },
    });

    const coldCell2 = await prisma.coldCell.create({
      data: {
        name: 'Fridge 1',
        type: 'fridge',
        temperatureMinThreshold: 2,
        temperatureMaxThreshold: 8,
        locationId: location1.id,
      },
    });

    const coldCell3 = await prisma.coldCell.create({
      data: {
        name: 'Freezer 2',
        type: 'freezer',
        temperatureMinThreshold: -25,
        temperatureMaxThreshold: -15,
        locationId: location2.id,
      },
    });

    const coldCell4 = await prisma.coldCell.create({
      data: {
        name: 'Bakery Fridge',
        type: 'fridge',
        temperatureMinThreshold: 2,
        temperatureMaxThreshold: 8,
        locationId: location3.id,
      },
    });

    logger.info('Created cold cells', {
      coldCell1Id: coldCell1.id,
      coldCell2Id: coldCell2.id,
      coldCell3Id: coldCell3.id,
      coldCell4Id: coldCell4.id,
    });

    // 5. Create Devices with API keys
    const device1 = await prisma.device.create({
      data: {
        serialNumber: 'SN-001',
        apiKey: generateApiKey(),
        status: 'ONLINE',
        firmwareVersion: '1.0.0',
        coldCellId: coldCell1.id,
      },
    });

    const device2 = await prisma.device.create({
      data: {
        serialNumber: 'SN-002',
        apiKey: generateApiKey(),
        status: 'ONLINE',
        firmwareVersion: '1.0.0',
        coldCellId: coldCell2.id,
      },
    });

    const device3 = await prisma.device.create({
      data: {
        serialNumber: 'SN-003',
        apiKey: generateApiKey(),
        status: 'ONLINE',
        firmwareVersion: '1.0.0',
        coldCellId: coldCell3.id,
      },
    });

    const device4 = await prisma.device.create({
      data: {
        serialNumber: 'SN-004',
        apiKey: generateApiKey(),
        status: 'OFFLINE',
        firmwareVersion: '1.0.0',
        coldCellId: coldCell4.id,
      },
    });

    logger.info('Created devices', {
      device1Id: device1.id,
      device1ApiKey: device1.apiKey,
      device2Id: device2.id,
      device2ApiKey: device2.apiKey,
      device3Id: device3.id,
      device3ApiKey: device3.apiKey,
      device4Id: device4.id,
      device4ApiKey: device4.apiKey,
    });

    // 6. Create Sample Sensor Readings
    const now = new Date();
    const readings: any[] = [];

    // Generate readings for the last 24 hours (one per hour)
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      // Device 1 (Freezer) - normal range
      readings.push({
        deviceId: device1.id,
        temperature: -18 + Math.random() * 2, // -18 to -16
        humidity: 45 + Math.random() * 10,
        powerStatus: true,
        doorStatus: false,
        batteryLevel: 85 + Math.floor(Math.random() * 10),
        recordedAt: timestamp,
      });

      // Device 2 (Fridge) - normal range
      readings.push({
        deviceId: device2.id,
        temperature: 4 + Math.random() * 2, // 4 to 6
        humidity: 60 + Math.random() * 10,
        powerStatus: true,
        doorStatus: Math.random() > 0.9, // 10% chance door is open
        batteryLevel: 90 + Math.floor(Math.random() * 10),
        recordedAt: timestamp,
      });

      // Device 3 (Freezer) - some alerts
      const temp3 = i < 3 ? -12 : -18 + Math.random() * 2; // High temp for first 3 hours
      readings.push({
        deviceId: device3.id,
        temperature: temp3,
        humidity: 45 + Math.random() * 10,
        powerStatus: i < 2 ? false : true, // Power loss for first 2 hours
        doorStatus: false,
        batteryLevel: 80 + Math.floor(Math.random() * 10),
        recordedAt: timestamp,
      });
    }

    await prisma.sensorReading.createMany({
      data: readings,
    });

    logger.info('Created sensor readings', { count: readings.length });

    // 7. Create some alerts (from the high temp and power loss)
    const alert1 = await prisma.alert.create({
      data: {
        coldCellId: coldCell3.id,
        type: 'HIGH_TEMP',
        value: -12,
        threshold: -15,
        status: 'RESOLVED',
        triggeredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolutionNote: 'Temperature returned to normal',
      },
    });

    const alert2 = await prisma.alert.create({
      data: {
        coldCellId: coldCell3.id,
        type: 'POWER_LOSS',
        status: 'RESOLVED',
        triggeredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        resolutionNote: 'Power restored',
      },
    });

    logger.info('Created alerts', { alert1Id: alert1.id, alert2Id: alert2.id });

    logger.info('✅ Database seed completed successfully!');
    logger.info('\n📋 Test Credentials:');
    logger.info('Technician: tech@example.com / technician123');
    logger.info('Customer 1: customer1@example.com / customer123');
    logger.info('Customer 2: customer2@example.com / customer123');
    logger.info('\n🔑 Device API Keys (for testing):');
    logger.info(`Device SN-001: ${device1.apiKey}`);
    logger.info(`Device SN-002: ${device2.apiKey}`);
    logger.info(`Device SN-003: ${device3.apiKey}`);
    logger.info(`Device SN-004: ${device4.apiKey}`);
  } catch (error) {
    logger.error('Error seeding database', error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;
