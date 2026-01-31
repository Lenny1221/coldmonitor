import express from 'express';
import { PrismaClient, AlarmStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const updateAlarmSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED']).optional(),
  message: z.string().optional(),
});

// Get all alarms (filtered by role)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    let alarms;

    if (req.userRole === 'ADMIN') {
      alarms = await prisma.alarm.findMany({
        include: {
          device: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { triggeredAt: 'desc' },
      });
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            include: {
              devices: {
                include: {
                  alarms: {
                    include: {
                      device: {
                        include: {
                          client: {
                            include: {
                              user: {
                                select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                },
                              },
                            },
                          },
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

      alarms = technician?.technicianClients
        .flatMap(client => client.devices)
        .flatMap(device => device.alarms) || [];
    } else {
      // Customer - only their own alarms
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
        include: {
          devices: {
            include: {
              alarms: {
                include: {
                  device: {
                    include: {
                      client: {
                        include: {
                          user: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                            },
                          },
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

      alarms = client?.devices.flatMap(device => device.alarms) || [];
    }

    res.json(alarms);
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

// Get active alarms
router.get('/active', requireAuth, async (req: AuthRequest, res) => {
  try {
    let alarms;

    if (req.userRole === 'ADMIN') {
      alarms = await prisma.alarm.findMany({
        where: { status: 'ACTIVE' },
        include: {
          device: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { triggeredAt: 'desc' },
      });
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            include: {
              devices: {
                include: {
                  alarms: {
                    where: { status: 'ACTIVE' },
                    include: {
                      device: {
                        include: {
                          client: {
                            include: {
                              user: {
                                select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                },
                              },
                            },
                          },
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

      alarms = technician?.technicianClients
        .flatMap(client => client.devices)
        .flatMap(device => device.alarms) || [];
    } else {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
        include: {
          devices: {
            include: {
              alarms: {
                where: { status: 'ACTIVE' },
                include: {
                  device: {
                    include: {
                      client: {
                        include: {
                          user: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                            },
                          },
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

      alarms = client?.devices.flatMap(device => device.alarms) || [];
    }

    res.json(alarms);
  } catch (error) {
    console.error('Error fetching active alarms:', error);
    res.status(500).json({ error: 'Failed to fetch active alarms' });
  }
});

// Get alarms for a device
router.get('/device/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { status } = req.query;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check permissions
    if (req.userRole === 'CUSTOMER') {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
      });
      if (device.clientId !== client?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            select: { id: true },
          },
        },
      });
      const hasAccess = technician?.technicianClients.some(c => c.id === device.clientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const where: any = { deviceId: device.id };
    if (status) {
      where.status = status;
    }

    const alarms = await prisma.alarm.findMany({
      where,
      orderBy: { triggeredAt: 'desc' },
    });

    res.json(alarms);
  } catch (error) {
    console.error('Error fetching device alarms:', error);
    res.status(500).json({ error: 'Failed to fetch device alarms' });
  }
});

// Update alarm (resolve/manually update)
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateAlarmSchema.parse(req.body);

    const alarm = await prisma.alarm.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });

    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    // Check permissions
    if (req.userRole === 'CUSTOMER') {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
      });
      if (alarm.device.clientId !== client?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            select: { id: true },
          },
        },
      });
      const hasAccess = technician?.technicianClients.some(c => c.id === alarm.device.clientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updateData: any = { ...data };
    if (data.status === 'RESOLVED' && !alarm.resolvedAt) {
      updateData.resolvedAt = new Date();
    } else if (data.status === 'ACTIVE' && alarm.resolvedAt) {
      updateData.resolvedAt = null;
    }

    const updatedAlarm = await prisma.alarm.update({
      where: { id },
      data: updateData,
      include: {
        device: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(updatedAlarm);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating alarm:', error);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

export default router;
