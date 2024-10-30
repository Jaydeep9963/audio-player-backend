/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import PrivacyPolicy from './privacyPolicy.model';

export const getPrivacyPolicy = catchAsync(async (_req: Request, res: Response) => {
  try {
    const policy = await PrivacyPolicy.findOne(); // Fetch the first policy
    return res.status(200).json(policy);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching privacy policy' });
  }
});

export const postPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const { content } = req.body;
  try {
    let policy = await PrivacyPolicy.findOne();

    if (policy) {
      // Update existing policy
      policy.content = content;
      policy.lastUpdated = new Date();
      await policy.save();
    } else {
      // Create new policy
      policy = new PrivacyPolicy({ content });
      await policy.save();
    }

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error saving privacy policy' });
  }
});

export const deletePrivacyPolicy = catchAsync(async (_req: Request, res: Response) => {
  try {
    await PrivacyPolicy.deleteMany(); // Delete all policies
    res.status(200).json({ message: 'Privacy policy deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting privacy policy' });
  }
});
