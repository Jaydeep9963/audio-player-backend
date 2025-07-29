/* eslint-disable prettier/prettier */
// import mm from "music-metadata";
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import Audio from './audio.model';
import { SubCategory } from '../subCategory';

export const getAudios = catchAsync(async (req: Request, res: Response) => {
  try {
    const audioName = (req.query['audioName']?.toString().trim().toLowerCase() || '') as string;
    const page = parseInt(req.query['page'] as string, 10) || 1;
    const limit = parseInt(req.query['limit'] as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = audioName ? { title: { $regex: audioName, $options: 'i' } } : {};
    const audioList = await Audio.find(filter)
      .populate({
        path: 'subcategory',
        select: '_id subcategory_name',
      })
      .skip(skip)
      .limit(limit);

    const totalAudios = await Audio.countDocuments();
    const totalPages = Math.ceil(totalAudios / limit);

    if (audioList) {
      res.status(200).json({
        audios: audioList,
        totalAudios,
        totalPages,
        currentPage: page,
        pageSize: limit,
      });
    } else {
      res.json({ audios: [] });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export default getAudios;

export const addAudio = catchAsync(async (req: Request, res: Response) => {
  try {
    const { title, subCategoryId } = req.body;
    // Check if a category with the same name already exists
    const findSubcategory = await SubCategory.findById(new mongoose.Types.ObjectId(subCategoryId));

    if (!findSubcategory) {
      return res.status(404).json({ message: 'SubCategory does not exist' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const audioFile = files['audio'] ? files['audio'][0] : null;
    const lyricsFile = files['lyrics'] ? files['lyrics'][0] : null;
    const imageFile = files['image'] ? files['image'][0] : null;

   
    // const parser = await mm.parseFile("./uploads/audio/audioFile/1733749853348-Dil Tenu De Dita_128-(PagalWorld).mp3");
    // console.log("🚀 ~ addAudio ~ parser:", parser)

    const newAudio = {
      title,
      audio: audioFile
        ? {
            file: audioFile.path,
            fileName: audioFile.filename,
            fileType: audioFile.mimetype,
            fileSize: audioFile.size,
          }
        : null,
      image: imageFile
        ? {
            file: imageFile.path,
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : null,
      subcategory: subCategoryId,
      lyrics: lyricsFile
        ? {
            file: lyricsFile.path,
            fileName: lyricsFile.filename,
            fileType: lyricsFile.mimetype,
            fileSize: lyricsFile.size,
          }
        : null,
    };

    const createdAudio = await (
      await Audio.create(newAudio)
    ).populate({
      path: 'subcategory',
      select: '_id subcategory_name',
    });

    if (createdAudio) {
      findSubcategory.audios.push(createdAudio.id);
      findSubcategory.save();
    }
    return res.status(201).json({ success: true, data: createdAudio });
  } catch (error) {
    console.log('🚀 ~ addAudio ~ error:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const updateAudio = catchAsync(async (req: Request, res: Response) => {
  try {
    const { audioId } = req.params;
    const { title, subCategoryId: newSubCatId } = req.body;

    if (newSubCatId && !mongoose.Types.ObjectId.isValid(newSubCatId)) {
      return res.status(400).json({ message: 'Invalid subCategoryId' });
    }

    const findAudio = await Audio.findById(audioId);

    if (!findAudio) {
      return res.status(404).json({ message: 'audio not found' });
    }

    const findSubCategory = await SubCategory.findById(newSubCatId);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }; // Type assertion

    const audioFile = files['audio'] ? files['audio'][0] : null;
    const lyricsFile = files['lyrics'] ? files['lyrics'][0] : null;
    const imageFile = files['image'] ? files['image'][0] : null;

    // Set up the fields to be updated
    const audio = {
      title: title || findAudio.title, // Keep existing title if not provided
      audio: audioFile
        ? {
            file: audioFile.path,
            fileName: audioFile.filename,
            fileType: audioFile.mimetype,
            fileSize: audioFile.size,
          }
        : findAudio.audio, // Keep existing audio if no new file is uploaded
      image: imageFile
        ? {
            file: imageFile.path,
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : findAudio.image, // Keep existing image if no new file is uploaded
      subcategory: newSubCatId || findAudio.subcategory, // Keep existing subcategory if not provided
      lyrics: lyricsFile
        ? {
            file: lyricsFile.path,
            fileName: lyricsFile.filename,
            fileType: lyricsFile.mimetype,
            fileSize: lyricsFile.size,
          }
        : findAudio.lyrics, // Keep existing lyrics if no new file is uploaded
    };

    const updatedAudio = await (
      await Audio.findByIdAndUpdate(audioId, { $set: audio }, { new: true, runValidators: true })
    )?.populate({
      path: 'subcategory',
      select: '_id subcategory_name',
    });
    if (!updatedAudio) {
      return res.status(404).json({ message: 'Audio not found' });
    }
    // remove from old category
    if (findAudio) {
      const { subcategory: subcategoryId } = findAudio;

      // remove from category
      const subCategory = await SubCategory.findById(subcategoryId);
      if (subCategory) {
        const index = subCategory.audios.findIndex((id) => id.toString() === audioId);
        subCategory.audios.splice(index, 1);
        await subCategory.save();
      } else {
        return res.status(404).json({ message: 'SubCategory not found for this audio' });
      }
    }
    // add in new category
    if (findSubCategory && audioId) {
      findSubCategory.audios.push(audioId);
      findSubCategory.save();
    }

    return res.status(200).json({
      message: 'Audio updated successfully',
      data: updatedAudio,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const deleteAudio = catchAsync(async (req: Request, res: Response) => {
  try {
    const { audioId } = req.params;
    const findAudio = await Audio.findById(audioId);

    if (findAudio) {
      const { subcategory: subcategoryId } = findAudio;

      // remove from category
      const subcategory = await SubCategory.findById(subcategoryId);
      if (subcategory) {
        const index = subcategory.audios.findIndex((id) => id.toString() === audioId);
        subcategory.audios.splice(index, 1);
        await subcategory.save();
      } else {
        return res.status(404).json({ message: 'SubCategory not found for this audio' });
      }
    }

    const deletedAudio = await Audio.findByIdAndRemove(audioId);
    if (!deletedAudio) {
      // If the category was not found, return a 404 response
      return res.status(404).json({ message: 'Audio not found' });
    }

    // If the category was found and deleted
    return res.status(200).json({
      message: 'Audio deleted successfully',
      data: deletedAudio,
    });
  } catch (error) {
    // If there's an internal server error, return a 500 response
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});
