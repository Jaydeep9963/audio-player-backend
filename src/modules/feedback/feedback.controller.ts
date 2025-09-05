/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import Feedback from './feedback.model';

// Submit rating only (for users)
export const submitRating = catchAsync(async (req: Request, res: Response) => {
  try {
    const { name, rating } = req.body;
    
    if (!name || !rating) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name and rating are required');
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5');
    }
    
    const feedback = await Feedback.create({
      name,
      rating,
      type: 'rating',
      createdAt: new Date()
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

// Submit feedback only (for users)
export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
  try {
    const { name, comment } = req.body;
    
    if (!name || !comment) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name and comment are required');
    }
    
    const feedback = await Feedback.create({
      name,
      comment,
      type: 'feedback',
      createdAt: new Date()
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

// Submit both rating and feedback (for users)
export const submitRatingAndFeedback = catchAsync(async (req: Request, res: Response) => {
  try {
    const { name, rating, comment } = req.body;
    
    if (!name || !rating || !comment) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name, rating, and comment are required');
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5');
    }
    
    const feedback = await Feedback.create({
      name,
      rating,
      comment,
      type: 'both',
      createdAt: new Date()
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

// Get all feedback (for admin)
export const getAllFeedback = catchAsync(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string, 10) || 1;
    const limit = parseInt(req.query['limit'] as string, 10) || 10;
    const skip = (page - 1) * limit;
    const type = req.query['type'] as string || null;
    const search = req.query['search'] as string || '';
    
    // Build filter object based on type and search parameters
    let filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    // Create aggregation pipeline for sorting by search relevance
    let feedbackList;
    
    if (search) {
      // If search parameter exists, use aggregation to sort by name relevance
      feedbackList = await Feedback.aggregate([
        { $match: filter },
        { $addFields: {
          // Add a score field based on how closely the name matches the search term
          // Exact matches get highest priority
          nameMatchScore: {
            $cond: [
              { $eq: [{ $toLower: "$name" }, search.toLowerCase()] },
              3,  // Exact match (case insensitive)
              {
                $cond: [
                  { $regexMatch: { input: { $toLower: "$name" }, regex: `^${search.toLowerCase()}` } },
                  2,  // Starts with search term
                  1   // Contains search term somewhere
                ]
              }
            ]
          }
        }},
        { $sort: { nameMatchScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
    } else {
      // If no search parameter, use regular find with sort by creation date
      feedbackList = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
    
    const totalFeedback = await Feedback.countDocuments(filter);
    const totalPages = Math.ceil(totalFeedback / limit);
    
    res.status(200).json({
      feedback: feedbackList,
      totalFeedback,
      totalPages,
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export default {
  submitRating,
  submitFeedback,
  submitRatingAndFeedback,
  getAllFeedback
};