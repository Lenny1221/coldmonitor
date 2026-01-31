import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Customer dashboard overview
router.get('/customer', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customerId! },
      include: {
        locations: {
          include: {
            coldCells: {
              include: {
                devices: {
                  select: {
                    id: true,
                    serialNumber: true,
                    status: true,
                    sensorReadings: {
                      orderBy: {
                        recordedAt: 'desc',
                      },
                      take: 1,
                    },
                  },
                },
                _count: {
                  select: {
                    alerts: {
                      where: {
                        status: 'ACTIVE',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate status for each cold cell and include location info
    const coldCellsWithStatus = customer.locations.flatMap(location =>
      location.coldCells.map(coldCell => {
        const latestReading = coldCell.devices
          .flatMap(d => d.sensorReadings)
          .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];

        let status = 'OK';
        if (coldCell._count.alerts > 0) {
          status = 'ALARM';
        } else if (
          latestReading &&
          (latestReading.temperature > coldCell.temperatureMaxThreshold ||
           latestReading.temperature < coldCell.temperatureMinThreshold)
        ) {
          status = 'WARNING';
        }

        return {
          ...coldCell,
          status,
          currentTemperature: latestReading?.temperature || null,
          lastReadingAt: latestReading?.recordedAt || null,
          location: {
            id: location.id,
            locationName: location.locationName,
            address: location.address,
          },
        };
      })
    );

    const activeAlarmsCount = customer.locations.reduce(
      (sum, loc) =>
        sum +
        loc.coldCells.reduce((cellSum, cell) => cellSum + cell._count.alerts, 0),
      0
    );

    res.json({
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName,
      },
      summary: {
        totalLocations: customer.locations.length,
        totalColdCells: coldCellsWithStatus.length,
        activeAlarms: activeAlarmsCount,
        coldCells: coldCellsWithStatus,
      },
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Technician dashboard overview
router.get('/technician', requireAuth, requireRole('TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        linkedTechnicianId: req.technicianId!,
      },
      include: {
        locations: {
          include: {
            coldCells: {
              include: {
                _count: {
                  select: {
                    devices: true,
                    alerts: {
                      where: {
                        status: 'ACTIVE',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const customersWithStats = customers.map(customer => {
      const totalCells = customer.locations.reduce(
        (sum, loc) => sum + loc.coldCells.length,
        0
      );
      const activeAlarms = customer.locations.reduce(
        (sum, loc) =>
          sum +
          loc.coldCells.reduce((cellSum, cell) => cellSum + cell._count.alerts, 0),
        0
      );

      return {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        totalLocations: customer.locations.length,
        totalCells,
        activeAlarms,
      };
    });

    // Get all active alerts across all customers
    const allAlerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
        coldCell: {
          location: {
            customer: {
              linkedTechnicianId: req.technicianId!,
            },
          },
        },
      },
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: {
                  select: {
                    id: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 50,
    });

    res.json({
      customers: customersWithStats,
      alerts: allAlerts,
      summary: {
        totalCustomers: customers.length,
        totalAlarms: allAlerts.length,
      },
    });
  } catch (error) {
    console.error('Technician dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
