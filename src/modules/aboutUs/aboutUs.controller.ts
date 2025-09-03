/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import AboutUs from './aboutUs.model';

export const getAboutUs = catchAsync(async (_req: Request, res: Response) => {
  try {
    const aboutUs = await AboutUs.findOne(); // Fetch the first about us content
    return res.status(200).json(aboutUs);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching about us' });
  }
});

export const postAboutUs = catchAsync(async (req: Request, res: Response) => {
  const { content } = req.body;
  try {
    let aboutUs = await AboutUs.findOne();

    if (aboutUs) {
      // Update existing about us
      aboutUs.content = content;
      aboutUs.lastUpdated = new Date();
      await aboutUs.save();
    } else {
      // Create new about us
      aboutUs = new AboutUs({ content });
      await aboutUs.save();
    }

    res.status(200).json(aboutUs);
  } catch (error) {
    res.status(500).json({ message: 'Error saving about us' });
  }
});

export const deleteAboutUs = catchAsync(async (_req: Request, res: Response) => {
  try {
    await AboutUs.deleteMany(); // Delete all about us content
    res.status(200).json({ message: 'About us deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting about us' });
  }
});

// Alias for backward compatibility
export const updateAboutUs = postAboutUs;