import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/error';

const prisma = new PrismaClient();

// Authentication controller
const authController = {
  // Login
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      
      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRATION || '8h' }
      );
      
      // Return user and token
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Register
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new AppError('Email already in use', 'EMAIL_EXISTS', 400);
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });
      
      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRATION || '8h' }
      );
      
      // Return user and token
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error(error);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Logout
  logout: async (req: Request, res: Response) => {
    // In a stateless JWT approach, the client is responsible for removing the token
    res.status(200).json({ message: 'Logged out successfully' });
  },
  
  // Refresh token
  refreshToken: async (req: Request, res: Response) => {
    // Implementation depends on your refresh token strategy
    res.status(200).json({ message: 'Token refreshed' });
  },
  
  // Reset password
  resetPassword: async (req: Request, res: Response) => {
    // Implementation for password reset
    res.status(200).json({ message: 'Password reset email sent' });
  }
};

export default authController;