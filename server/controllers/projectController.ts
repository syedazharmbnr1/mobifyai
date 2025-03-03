import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/error';
import appBuilderService from '../services/appBuilderService';

// Define an interface extending the base Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
  };
}

const prisma = new PrismaClient();

// Project controller
const projectController = {
  // Get all projects
  getProjects: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const projects = await prisma.project.findMany({
        where: { userId }
      });
      
      res.json(projects);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Get project by ID
  getProject: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project) {
        throw new AppError('Project not found', 'NOT_FOUND', 404);
      }
      
      if (project.userId !== userId) {
        throw new AppError('You do not have permission to access this project', 'FORBIDDEN', 403);
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Create project
  createProject: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      // If using template
      if (req.body.templateId) {
        const project = await appBuilderService.createAppFromTemplate(
          userId,
          req.body.templateId,
          req.body.customizations || {}
        );
        
        return res.status(201).json(project);
      }
      
      // If using natural language prompt
      if (req.body.prompt) {
        const project = await appBuilderService.createAppFromPrompt(userId, {
          prompt: req.body.prompt,
          appName: req.body.appName,
          industry: req.body.industry,
          targetPlatforms: req.body.targetPlatforms,
          features: req.body.features,
          designPreferences: req.body.designPreferences,
          technicalRequirements: req.body.technicalRequirements
        });
        
        return res.status(201).json(project);
      }
      
      // If neither template nor prompt
      throw new AppError('Either templateId or prompt is required', 'VALIDATION_ERROR', 400);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        console.error(error);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Update project
  updateProject: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project) {
        throw new AppError('Project not found', 'NOT_FOUND', 404);
      }
      
      if (project.userId !== userId) {
        throw new AppError('You do not have permission to access this project', 'FORBIDDEN', 403);
      }
      
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: req.body
      });
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  },
  
  // Delete project
  deleteProject: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
      }
      
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project) {
        throw new AppError('Project not found', 'NOT_FOUND', 404);
      }
      
      if (project.userId !== userId) {
        throw new AppError('You do not have permission to access this project', 'FORBIDDEN', 403);
      }
      
      await prisma.project.delete({
        where: { id: projectId }
      });
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
      } else {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
      }
    }
  }
};

export default projectController;