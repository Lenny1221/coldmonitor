import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthRequest, generateTokens, verifyRefreshToken } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { CustomError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// Customer registration schema
const customerRegisterSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  password: z.string().min(6),
  technicianId: z.string().optional(),
});

// Technician registration schema
const technicianRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required'),
  companyName: z.string().min(1, 'Company name is required'),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * POST /auth/register
 * Customer registration
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const data = customerRegisterSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new CustomError('Email already exists', 400, 'EMAIL_EXISTS');
    }

    if (data.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: data.technicianId },
      });
      if (!technician) {
        throw new CustomError('Invalid technician ID', 400, 'INVALID_TECHNICIAN');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        linkedTechnicianId: data.technicianId || null,
        emailVerified: false,
      },
      include: {
        linkedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      customerId: customer.id,
    });

    logger.info('Customer registered', { customerId: customer.id, email: customer.email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        linkedTechnician: customer.linkedTechnician,
      },
      ...tokens,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register/technician
 * Technician registration
 */
router.post('/register/technician', authRateLimiter, async (req, res, next) => {
  try {
    const data = technicianRegisterSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new CustomError('Email already exists', 400, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'TECHNICIAN',
      },
    });

    const technician = await prisma.technician.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      technicianId: technician.id,
    });

    logger.info('Technician registered', { technicianId: technician.id, email: technician.email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      technician: {
        id: technician.id,
        name: technician.name,
        email: technician.email,
        companyName: technician.companyName,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Get related entity IDs
    let technicianId: string | undefined;
    let customerId: string | undefined;

    if (user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      });
      technicianId = technician?.id;
    } else if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.id },
      });
      customerId = customer?.id;
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      technicianId,
      customerId,
    });

    logger.info('User logged in', { userId: user.id, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const data = refreshTokenSchema.parse(req.body);
    
    const decoded = verifyRefreshToken(data.refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Get related entity IDs
    let technicianId: string | undefined;
    let customerId: string | undefined;

    if (user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      });
      technicianId = technician?.id;
    } else if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.id },
      });
      customerId = customer?.id;
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      technicianId,
      customerId,
    });

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user
 */
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    let profile: any = {};

    if (user.role === 'CUSTOMER' && req.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: req.customerId },
        include: {
          linkedTechnician: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
            },
          },
        },
      });
      profile = customer;
    } else if (user.role === 'TECHNICIAN' && req.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: req.technicianId },
      });
      profile = technician;
    }

    res.json({ ...user, profile });
  } catch (error) {
    next(error);
  }
});

export default router;
