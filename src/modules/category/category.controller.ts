/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import fs from 'fs';

import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import Category from './category.model';
import SubCategory from '../subCategory/subCategory.model';
import Audio from '../audio/audio.model';

// Utility function to check if image file exists
const checkImageExists = (imagePath: string): boolean => {
  try {
    // Remove the leading /uploads/ to get the relative path for fs.existsSync
    const relativePath = imagePath.startsWith('/uploads/') ? imagePath.substring(8) : imagePath;
    return fs.existsSync(relativePath);
  } catch (error) {
    return false;
  }
};

export const getTotalNumbers = catchAsync(async (_req: Request, res: Response) => {
  try {
    const totalNumOfCategory = await Category.count();
    const totalNumOfSubCategory = await SubCategory.count();
    const totalNumOfAudio = await Audio.count();

    res.status(200).json({
      totalNumOfCategory,
      totalNumOfSubCategory,
      totalNumOfAudio,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  try {
    const categoryName = (req.query['categoryName']?.toString().trim().toLowerCase() || '') as string;
    const page = parseInt(req.query['page'] as string, 10) || 1;
    const limit = parseInt(req.query['limit'] as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = categoryName ? { category_name: { $regex: categoryName, $options: 'i' } } : {};

    const categoryList = await Category.find(filter).skip(skip).limit(limit);

    // Filter out categories with missing images and provide default image for missing ones
    const processedCategories = categoryList.map((category) => {
      const categoryObj = category.toObject();

      // Check if image file exists
      if (categoryObj.image && categoryObj.image.file) {
        const imageExists = checkImageExists(categoryObj.image.file);
        if (!imageExists) {
          // Set a default image or null for missing images
          categoryObj.image = {
            file: null,
            fileName: 'default-image.jpg',
            fileType: 'image/jpeg',
            fileSize: 0,
          };
        }
      }

      return categoryObj;
    });

    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).json({
      categories: processedCategories,
      totalCategories,
      totalPages,
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const addCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { categoryName, description } = req.body;

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ category_name: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newCategory = {
      category_name: categoryName,
      image: {
        file: `/uploads/category/image/${req.file?.filename}`, // Use the correct path for static serving
        fileName: req.file?.filename,
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
      },
      description: description ?? '',
    };

    const createdCat = await Category.create(newCategory);

    return res.status(201).json({ success: true, data: createdCat });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { categoryName, description } = req.body;

    const findCategory = await Category.findById(categoryId);
    // Set up the fields to be updated
    const updateCat = {
      category_name: categoryName || findCategory?.category_name,
      image: req.file
        ? {
            file: `/uploads/category/image/${req.file?.filename}`, // Use the correct path for static serving
            fileName: req.file?.filename,
            fileType: req.file?.mimetype,
            fileSize: req.file?.size,
          }
        : findCategory?.image,
      description: description || findCategory?.description,
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      new mongoose.Types.ObjectId(categoryId),
      { $set: updateCat },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const findCat = await Category.findById(categoryId);
    const subcategoryIds = findCat?.subcategories;

    if (subcategoryIds && subcategoryIds.length > 0) {
      // Use Promise.all with map to handle async operations for all subcategories
      await Promise.all(
        subcategoryIds.map(async (subcategoryId) => {
          // Find subcategory
          const subcategory = await SubCategory.findById(subcategoryId);

          if (subcategory) {
            // Get all audio IDs in the subcategory
            const { audios } = subcategory;

            // Delete all audios in the subcategory
            if (audios && audios.length > 0) {
              await Promise.all(
                audios.map(async (audioId) => {
                  await Audio.findByIdAndDelete(audioId);
                })
              );
            }

            // Delete the subcategory itself
            await SubCategory.findByIdAndDelete(subcategoryId);
          }
        })
      );
    }

    const deletedCategory = await Category.findByIdAndRemove(categoryId);
    if (!deletedCategory) {
      // If the category was not found, return a 404 response
      return res.status(404).json({ message: 'Category not found' });
    }

    // If the category was found and deleted
    return res.status(200).json({
      message: 'Category deleted successfully',
      data: deletedCategory,
    });
  } catch (error) {
    // If there's an internal server error, return a 500 response
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});
