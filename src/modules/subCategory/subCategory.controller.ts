/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import SubCategory from './subCategory.model';
import { Category } from '../category';
import Audio from '../audio/audio.model';

export const getSubCategories = catchAsync(async (req: Request, res: Response) => {
  try {
    const subcategoryName = (req.query['subcategoryName']?.toString().trim().toLowerCase() || '') as string;
    const page = parseInt(req.query['page'] as string, 10) || 1; // default to page 1 if not provided
    const limit = parseInt(req.query['limit'] as string, 10) || 10; // default to 10 items per page
    const skip = (page - 1) * limit;

    const filter = subcategoryName ? { subcategory_name: { $regex: subcategoryName, $options: 'i' } } : {};

    const subCategoryList = await SubCategory.find(filter)
      .populate({
        path: 'category',
        select: '_id category_name',
      })
      .skip(skip)
      .limit(limit);

    const totalSubCategories = await SubCategory.countDocuments(); // Get total number of categories
    const totalPages = Math.ceil(totalSubCategories / limit);

    if (subCategoryList) {
      res.status(200).json({
        subCategories: subCategoryList,
        totalSubCategories,
        totalPages,
        currentPage: page,
        pageSize: limit,
      });
    } else {
      res.json({ subCategories: [] });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const addSubCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { subCategoryName, categoryId, description } = req.body; // Remove artistId from here

    // Check if a category with the same name already exists
    const findCategory = await Category.findById(new mongoose.Types.ObjectId(categoryId));

    if (!findCategory) res.status(404).json({ message: 'Category does not exist' });

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    // logic for already exist subcategory //

    const newSubCategory = {
      subcategory_name: subCategoryName,
      image: {
        file: `/uploads/subcategory/image/${req.file?.filename}`, // Use the correct path for static serving
        fileName: req.file?.filename,
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
      },
      category: categoryId,
      // Remove artist: artistId || null, line
      audios: [],
      description: description ?? '',
    };

    const createdSubCat = await (
      await SubCategory.create(newSubCategory)
    ).populate({
      path: 'category',
      select: '_id category_name',
    });
    
    if (createdSubCat) {
      findCategory?.subcategories.push(createdSubCat.id);
      findCategory?.save();
    }
    return res.status(201).json({ success: true, data: createdSubCat });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const updateSubCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { subCategoryId } = req.params;
    const { subCategoryName, categoryId: newCategoryID, description } = req.body;
    const findSubCat = await SubCategory.findById(subCategoryId);
    const findCategory = await Category.findById(new mongoose.Types.ObjectId(newCategoryID));
    // Set up the fields to be updated
    const updateSubCat = {
      subcategory_name: subCategoryName || findSubCat?.subcategory_name,
      image: req?.file ? {
        file: `/uploads/subcategory/image/${req.file?.filename}`, // Use the correct path for static serving
        fileName: req.file?.filename,
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
      } : findSubCat?.image,
      category: newCategoryID || findSubCat?.category,
      description: description || findSubCat?.description,
    };

    // remove from old category
    if (findSubCat) {
      const { category: categoryId } = findSubCat;

      // remove from category
      const category = await Category.findById(categoryId);
      if (category) {
        const index = category.subcategories.findIndex((id) => id.toString() === subCategoryId);
        category.subcategories.splice(index, 1);
        await category.save();
      } else {
        return res.status(404).json({ message: 'Category not found for this subcategory' });
      }
    }
    // add in new category
    if (findCategory && subCategoryId) {
      findCategory.subcategories.push(subCategoryId);
      findCategory.save();
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      subCategoryId,
      { $set: updateSubCat },
      { new: true, runValidators: true }
    );
    if (!updatedSubCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    return res.status(200).json({
      message: 'SubCategory updated successfully',
      data: await updatedSubCategory.populate({
        path: 'category',
        select: '_id category_name',
      }),
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const deleteSubCategory = catchAsync(async (req: Request, res: Response) => {
  try {
    const { subCategoryId } = req.params;
    const findSubCat = await SubCategory.findById(subCategoryId);

    const deletedSubCategory = await SubCategory.findByIdAndRemove(subCategoryId);
    if (!deletedSubCategory) {
      // If the category was not found, return a 404 response
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    // delete audios
    const validAudioIds = findSubCat?.audios.map((id) => new mongoose.Types.ObjectId(id));
    await Audio.deleteMany({
      _id: { $in: validAudioIds },
    });

    if (findSubCat) {
      const { category: categoryId } = findSubCat;

      // remove from category
      const category = await Category.findById(categoryId);
      if (category) {
        const index = category.subcategories.findIndex((id) => id.toString() === subCategoryId);
        category.subcategories.splice(index, 1);
        await category.save();
      } else {
        return res.status(404).json({ message: 'Category not found for this subcategory' });
      }
    }

    // If the category was found and deleted
    return res.status(200).json({
      message: 'SubCategory deleted successfully',
      data: deletedSubCategory,
    });
  } catch (error) {
    // If there's an internal server error, return a 500 response
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});
