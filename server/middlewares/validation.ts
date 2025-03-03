import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      // Type guard to check if error is a ZodError
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }
      
      // Handle other types of errors
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: 'Unknown validation error',
        },
      });
    }
  };
};

// Login validation schema
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Register validation schema
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Export validation middlewares
export const validateLogin = validateRequest(loginSchema);
export const validateRegister = validateRequest(registerSchema);