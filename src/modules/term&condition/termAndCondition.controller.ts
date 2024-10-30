/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import TermAndCondition from './termAndCondition.model';

export const getTac = catchAsync(async (_req: Request, res: Response) => {
  try {
    const policy = await TermAndCondition.findOne(); // Fetch the first policy
    return res.status(200).json(policy);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching term&condition' });
  }
});

export const postTac = catchAsync(async (req: Request, res: Response) => {
  const { content } = req.body;
  try {
    let tac = await TermAndCondition.findOne();

    if (tac) {
      // Update existing policy
      tac.content = content;
      tac.lastUpdated = new Date();
      await tac.save();
    } else {
      // Create new policy
      tac = new TermAndCondition({ content });
      await tac.save();
    }

    res.status(200).json(tac);
  } catch (error) {
    res.status(500).json({ message: 'Error saving  term&condition' });
  }
});

export const deleteTac = catchAsync(async (_req: Request, res: Response) => {
  try {
    await TermAndCondition.deleteMany(); // Delete all policies
    res.status(200).json({ message: ' term&condition deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting  term&condition' });
  }
});
