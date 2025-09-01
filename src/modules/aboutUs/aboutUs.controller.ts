/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import AboutUs from './aboutUs.model';

// Get about us content (for users)
export const getAboutUs = catchAsync(async (_req: Request, res: Response) => {
  try {
    const aboutUs = await AboutUs.findOne().sort({ lastUpdated: -1 });

    if (!aboutUs) {
      return res.status(404).json({ message: 'About us content not found' });
    }

    return res.status(200).json(aboutUs);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

// Create or update about us content (for admin)
export const updateAboutUs = catchAsync(async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Content is required');
    }
    
    // Find the most recent about us content
    const existingAboutUs = await AboutUs.findOne().sort({ lastUpdated: -1 });
    
    let aboutUs;
    
    if (existingAboutUs) {
      // Update existing content
      existingAboutUs.content = content;
      existingAboutUs.lastUpdated = new Date();
      aboutUs = await existingAboutUs.save();
    } else {
      // Create new content
      aboutUs = await AboutUs.create({
        content,
        lastUpdated: new Date()
      });
    }
    
    res.status(200).json(aboutUs);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export default {
  getAboutUs,
  updateAboutUs
};