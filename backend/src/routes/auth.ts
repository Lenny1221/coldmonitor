import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Customer registration schema
const customerRegisterSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6),
  technicianId: z.string().optional(), // Optional - can be assigned later
});

// Technician registration schema
const technicianRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const data = customerRegisterSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate technician if provided
    if (data.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: data.technicianId },
      });
      if (!technician) {
        return res.status(400).json({ error: 'Invalid technician ID' });
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        linkedTechnicianId: data.technicianId || null,
        emailVerified: false, // Email verification required
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

    // TODO: Send email verification
    // TODO: Send invitation email to technician if assigned

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        customerId: customer.id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

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
      token,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Technician Registration (Admin only in production)
router.post('/register/technician', async (req, res) => {
  try {
    const data = technicianRegisterSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
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

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        technicianId: technician.id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

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
      token,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Technician registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        technicianId,
        customerId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
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
      return res.status(404).json({ error: 'User not found' });
    }

    // Include role-specific data
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
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
