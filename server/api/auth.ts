import express from 'express';
import authController from '../controllers/authController';
import { validateLogin, validateRegister } from '../middlewares/validation';

const router = express.Router();

// Authentication routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/reset-password', authController.resetPassword);

export default router;