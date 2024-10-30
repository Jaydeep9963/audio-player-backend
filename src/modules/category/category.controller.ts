/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import Category from './category.model';
import SubCategory from '../subCategory/subCategory.model';
import Audio from '../audio/audio.model';

export const getTotalNumbers = catchAsync(async (_req: Request, res: Response) => {
  try {
    const totalNumOfCategory = await Category.count();
    const totalNumOfSubCategory = await SubCategory.count();
    const totalNumOfAudio = await Audio.count();
    if (totalNumOfCategory && totalNumOfSubCategory && totalNumOfAudio){
      res.status(200).json({ totalNumOfCategory, totalNumOfSubCategory, totalNumOfAudio });
    }else{
      res.status(404).json({message: "Not found"});
    }
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

    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).json({
      categories: categoryList,
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
      image: { file: req.file?.path, fileName: req.file?.filename, fileType: req.file?.mimetype, fileSize: req.file?.size },
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
      image: req.file ? {
        file: req.file?.path,
        fileName: req.file?.filename,
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
      } : findCategory?.image,
      description : description || findCategory?.description,
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
