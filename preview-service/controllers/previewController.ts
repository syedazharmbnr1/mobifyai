// preview-service/controllers/previewController.ts

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { Logger } from '../utils/logger';
import { IOSPreviewRenderer } from '../renderers/iosPreviewRenderer';
import { AndroidPreviewRenderer } from '../renderers/androidPreviewRenderer';
import { FlutterPreviewRenderer } from '../renderers/flutterPreviewRenderer';
import { ReactNativePreviewRenderer } from '../renderers/reactNativePreviewRenderer';
import { PreviewRenderer } from '../renderers/previewRenderer';
import config from '../config';

const logger = new Logger('PreviewController');
const PREVIEW_DIR = path.join(process.cwd(), 'public/previews');

class PreviewController {
  /**
   * Generate preview for a project
   */
  async generatePreview(req: Request, res: Response) {
    try {
      const { projectId, appType } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Get project details from database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const appSpec = project.appSpecification;
      const uiDesignSystem = project.uiDesignSystem;

      if (!appSpec || !uiDesignSystem) {
        return res.status(400).json({ error: 'App specification or UI design system not found' });
      }

      // Create renderer based on app type
      const renderer = this.createRenderer(appType || project.appType);
      
      // Generate unique ID for the preview
      const previewId = uuidv4();
      
      // Create preview directory if it doesn't exist
      const previewDirPath = path.join(PREVIEW_DIR, previewId);
      fs.mkdirSync(previewDirPath, { recursive: true });
      
      // Generate preview
      const previewResult = await renderer.generatePreview({
        projectId,
        previewId,
        previewDir: previewDirPath,
        appSpec,
        uiDesignSystem
      });
      
      // Create preview record in database
      const preview = await prisma.preview.create({
        data: {
          id: previewId,
          projectId,
          previewUrl: `${config.serviceUrl}/previews/${previewId}/${previewResult.entryFile}`,
          previewData: previewResult,
          createdAt: new Date(),
        }
      });
      
      // Update project with preview URL
      await prisma.project.update({
        where: { id: projectId },
        data: {
          previewUrl: preview.previewUrl,
          updatedAt: new Date(),
        }
      });
      
      res.status(200).json({
        previewId,
        previewUrl: preview.previewUrl
      });
    } catch (error) {
      logger.error('Error generating preview', error);
      res.status(500).json({ error: error.message || 'Failed to generate preview' });
    }
  }

  /**
   * Get preview by ID
   */
  async getPreview(req: Request, res: Response) {
    try {
      const { previewId } = req.params;

      if (!previewId) {
        return res.status(400).json({ error: 'Preview ID is required' });
      }

      const preview = await prisma.preview.findUnique({
        where: { id: previewId },
      });

      if (!preview) {
        return res.status(404).json({ error: 'Preview not found' });
      }

      res.status(200).json(preview);
    } catch (error) {
      logger.error('Error getting preview', error);
      res.status(500).json({ error: error.message || 'Failed to get preview' });
    }
  }

  /**
   * Delete preview by ID
   */
  async deletePreview(req: Request, res: Response) {
    try {
      const { previewId } = req.params;

      if (!previewId) {
        return res.status(400).json({ error: 'Preview ID is required' });
      }

      // Check if preview exists
      const preview = await prisma.preview.findUnique({
        where: { id: previewId },
      });

      if (!preview) {
        return res.status(404).json({ error: 'Preview not found' });
      }

      // Delete preview files
      const previewDirPath = path.join(PREVIEW_DIR, previewId);
      if (fs.existsSync(previewDirPath)) {
        fs.rmSync(previewDirPath, { recursive: true, force: true });
      }

      // Delete preview record from database
      await prisma.preview.delete({
        where: { id: previewId },
      });

      res.status(200).json({ message: 'Preview deleted successfully' });
    } catch (error) {
      logger.error('Error deleting preview', error);
      res.status(500).json({ error: error.message || 'Failed to delete preview' });
    }
  }

  /**
   * Create appropriate renderer based on app type
   */
  private createRenderer(appType: string): PreviewRenderer {
    switch (appType) {
      case 'IOS':
        return new IOSPreviewRenderer();
      case 'ANDROID':
        return new AndroidPreviewRenderer();
      case 'FLUTTER':
        return new FlutterPreviewRenderer();
      case 'REACT_NATIVE':
      default:
        return new ReactNativePreviewRenderer();
    }
  }
}

export default new PreviewController();