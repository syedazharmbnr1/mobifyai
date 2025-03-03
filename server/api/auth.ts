import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authController from '../controllers/authController';
import { validateLogin, validateRegister } from '../middlewares/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Authentication routes
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Add login logic here
  // Return JWT token
});
router.post('/register', validateRegister, authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/reset-password', authController.resetPassword);

export default router;