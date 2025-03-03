import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  
  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.status || 500).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }
  
  // Handle generic errors
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

export default errorHandler;
