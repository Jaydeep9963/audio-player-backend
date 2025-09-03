/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import NotificationToken from './notificationToken.model';

// Store notification token (for users) - No authentication required
export const storeNotificationToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  
  try {
    // Check if token already exists
    const existingToken = await NotificationToken.findOne({ token });
    
    if (existingToken) {
      // Token already exists, don't throw error but return success
      res.status(200).json({ 
        success: true, 
        message: 'Notification token already exists',
        data: existingToken 
      });
      return;
    } else {
      // Create new token
      const notificationToken = new NotificationToken({ token });
      await notificationToken.save();
      res.status(201).json({ 
        success: true, 
        message: 'Notification token created successfully',
        data: notificationToken 
      });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error storing notification token' });
    return;
  }
});

// Get all notification tokens (for admin)
export const getAllNotificationTokens = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  try {
    const tokens = await NotificationToken.find()
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      results: tokens,
      total: tokens.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification tokens' });
  }
});

// Get notification tokens by user (for admin)
export const getNotificationTokensByUser = catchAsync(async (res: Response): Promise<void> => {
  // Parameter kept for backward compatibility but not used
  // const { userId } = req.params;
  
  try {
    // This function is no longer applicable as tokens are not associated with users
    // Returning empty results
    const tokens: any[] = [];
    // const tokens = await NotificationToken.find()
    //   .sort({ createdAt: -1 });
    
    res.status(200).json({
      results: tokens,
      total: tokens.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user notification tokens' });
  }
});

// Delete notification token (for admin)
export const deleteNotificationToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { tokenId } = req.params;
  
  try {
    await NotificationToken.findByIdAndDelete(tokenId);
    res.status(200).json({ message: 'Notification token deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification token' });
  }
});