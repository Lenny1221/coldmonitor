import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';

const router = Router();

/**
 * GET /dashboard/customer
 * Customer dashboard overview
 */
router.get(
  '/customer',
  requireAuth,
  requireRole('CUSTOMER'),
  async (req: AuthRequest, res, next) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.customerId! },
        include: {
          linkedTechnician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
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
          linkedTechnician: customer.linkedTechnician,
        },
        summary: {
          totalLocations: customer.locations.length,
          totalColdCells: coldCellsWithStatus.length,
          activeAlarms: activeAlarmsCount,
          coldCells: coldCellsWithStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/devices
 * All devices with latest heartbeat, online/offline (offline if no heartbeat in 10 min)
 */
router.get(
  '/devices',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      let devices: Array<{
        id: string;
        serialNumber: string;
        coldCellId: string;
        coldCell: { name: string };
        firmwareVersion: string | null;
        status: string;
        lastHeartbeat: { createdAt: Date; [key: string]: unknown } | null;
      }> = [];

      if (req.userRole === 'ADMIN') {
        devices = await prisma.device.findMany({
          include: {
            coldCell: { select: { name: true } },
            heartbeats: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }).then((list) =>
          list.map((d) => {
            const latestHeartbeat = d.heartbeats[0] ?? null;
            const isOnline = latestHeartbeat && latestHeartbeat.createdAt > tenMinutesAgo;
            return {
              id: d.id,
              serialNumber: d.serialNumber,
              coldCellId: d.coldCellId,
              coldCell: d.coldCell,
              firmwareVersion: d.firmwareVersion,
              status: isOnline ? 'ONLINE' : 'OFFLINE',
              lastHeartbeat: latestHeartbeat,
            };
          })
        );
      } else if (req.userRole === 'CUSTOMER' && req.customerId) {
        devices = await prisma.device.findMany({
          where: {
            coldCell: { location: { customerId: req.customerId } },
          },
          include: {
            coldCell: { select: { name: true } },
            heartbeats: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }).then((list) =>
          list.map((d) => {
            const latestHeartbeat = d.heartbeats[0] ?? null;
            const isOnline = latestHeartbeat && latestHeartbeat.createdAt > tenMinutesAgo;
            return {
              id: d.id,
              serialNumber: d.serialNumber,
              coldCellId: d.coldCellId,
              coldCell: d.coldCell,
              firmwareVersion: d.firmwareVersion,
              status: isOnline ? 'ONLINE' : 'OFFLINE',
              lastHeartbeat: latestHeartbeat,
            };
          })
        );
      } else if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        devices = await prisma.device.findMany({
          where: {
            coldCell: {
              location: {
                customer: { linkedTechnicianId: req.technicianId },
              },
            },
          },
          include: {
            coldCell: { select: { name: true } },
            heartbeats: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }).then((list) =>
          list.map((d) => {
            const latestHeartbeat = d.heartbeats[0] ?? null;
            const isOnline = latestHeartbeat && latestHeartbeat.createdAt > tenMinutesAgo;
            return {
              id: d.id,
              serialNumber: d.serialNumber,
              coldCellId: d.coldCellId,
              coldCell: d.coldCell,
              firmwareVersion: d.firmwareVersion,
              status: isOnline ? 'ONLINE' : 'OFFLINE',
              lastHeartbeat: latestHeartbeat,
            };
          })
        );
      }

      res.json({ devices });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/technician
 * Technician global dashboard
 */
router.get(
  '/technician',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
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

      // Group alerts by type
      const alertsByType = allAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        customers: customersWithStats,
        alerts: allAlerts,
        summary: {
          totalCustomers: customers.length,
          totalColdCells: customersWithStats.reduce((sum, c) => sum + c.totalCells, 0),
          totalAlarms: allAlerts.length,
          alertsByType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
