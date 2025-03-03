import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/error';

const prisma = new PrismaClient();

// User controller
const userController = {
  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new AppError('User not found', 'NOT_FOUND', 404);
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Update current user
  updateCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const { name, email, avatar } = req.body;
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          avatar
        }
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  }
};

export default userController;