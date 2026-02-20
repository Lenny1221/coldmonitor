import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { requireAuth, AuthRequest, generateTokens, verifyRefreshToken } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { CustomError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { sendVerificationEmail } from '../../utils/email';

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
 * GET /auth/google
 * Start Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return (res as any).redirect(`${config.frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

/**
 * GET /auth/google/callback
 * Google OAuth callback – redirect naar frontend met token
 */
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const handler = passport.authenticate('google', (err: Error | null, authResult: { user: any } | null) => {
    if (err) {
      logger.error('Google OAuth error: ' + err.message);
      return (res as any).redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
    if (!authResult?.user) {
      return (res as any).redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
    const user = authResult.user;
    const customerId = user.customer?.id;
    const technicianId = user.technician?.id;
    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      customerId,
      technicianId,
    });
    const token = tokens.accessToken || (tokens as any).token;
    return (res as any).redirect(`${config.frontendUrl}/login?oauth=1&token=${token}`);
  });
  handler(req, res, next);
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 uur

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'CUSTOMER',
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: expiresAt,
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
    });

    // E-mail op achtergrond – blokkeer response niet (SMTP kan traag/timeout zijn)
    sendVerificationEmail(data.email, verificationToken, 'customer', data.contactName)
      .then(() => logger.info('Customer registered – verificatie-e-mail verzonden', { customerId: customer.id, email: customer.email }))
      .catch((err) => logger.error('Verificatie-e-mail kon niet worden verzonden', err as Error, { customerId: customer.id }));

    res.status(201).json({
      message: 'Account aangemaakt. Controleer je e-mail om je account te bevestigen.',
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 uur

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'TECHNICIAN',
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    const technician = await prisma.technician.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        emailVerified: false,
      },
    });

    // E-mail op achtergrond – blokkeer response niet (SMTP kan traag/timeout zijn)
    sendVerificationEmail(data.email, verificationToken, 'technician', data.name)
      .then(() => logger.info('Technician registered – verificatie-e-mail verzonden', { technicianId: technician.id, email: technician.email }))
      .catch((err) => logger.error('Verificatie-e-mail kon niet worden verzonden', err as Error, { technicianId: technician.id }));

    res.status(201).json({
      message: 'Account aangemaakt. Controleer je e-mail om je account te bevestigen.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/verify-email
 * Verifieer e-mailadres via token (link in e-mail)
 */
router.get('/verify-email', async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.redirect(`${config.frontendUrl}/login?error=missing_token`);
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.redirect(`${config.frontendUrl}/login?error=invalid_or_expired_token`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    if (user.role === 'CUSTOMER') {
      await prisma.customer.updateMany({
        where: { userId: user.id },
        data: { emailVerified: true },
      });
    } else if (user.role === 'TECHNICIAN') {
      await prisma.technician.updateMany({
        where: { userId: user.id },
        data: { emailVerified: true },
      });
    }

    logger.info('E-mail geverifieerd', { userId: user.id });
    return res.redirect(`${config.frontendUrl}/login?verified=1`);
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

    // Controleer e-mailverificatie
    if (user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      });
      if (technician && !technician.emailVerified) {
        throw new CustomError('Bevestig eerst je e-mailadres via de link in je inbox.', 403, 'EMAIL_NOT_VERIFIED');
      }
    } else if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.id },
      });
      if (customer && !customer.emailVerified) {
        throw new CustomError('Bevestig eerst je e-mailadres via de link in je inbox.', 403, 'EMAIL_NOT_VERIFIED');
      }
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

    // Controleer e-mailverificatie (zelfde check als bij login)
    if (user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      });
      if (technician && !technician.emailVerified) {
        throw new CustomError('Bevestig eerst je e-mailadres via de link in je inbox.', 403, 'EMAIL_NOT_VERIFIED');
      }
    } else if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.id },
      });
      if (customer && !customer.emailVerified) {
        throw new CustomError('Bevestig eerst je e-mailadres via de link in je inbox.', 403, 'EMAIL_NOT_VERIFIED');
      }
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
