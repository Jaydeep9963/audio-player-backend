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
    const audioName = (req.query['audioName']?.toString().trim() || '') as string;

    // Changed from prefix match to contains match for Spotify-like search
    // This will match any part of the title, not just the beginning
    const filter = audioName ? { title: { $regex: audioName, $options: 'i' } } : {};

    const audioList = await Audio.find(filter)
      .populate({
        path: 'subcategory',
        select: '_id subcategory_name',
      });

    const totalAudios = await Audio.countDocuments(filter);

    res.status(200).json({
      audios: audioList,
      totalAudios,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});


export default getAudios;

export const addAudio = catchAsync(async (req: Request, res: Response) => {
  try {
    const { title, subCategoryId, artistId } = req.body;
    // Check if a category with the same name already exists
    const findSubcategory = await SubCategory.findById(new mongoose.Types.ObjectId(subCategoryId));

    if (!findSubcategory) {
      return res.status(404).json({ message: 'SubCategory does not exist' });
    }

    // Check if artist exists
    if (artistId) {
      const Artist = mongoose.model('Artist');
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(404).json({ message: 'Artist does not exist' });
      }
    } else {
      return res.status(400).json({ message: 'Artist ID is required' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const audioFile = files['audio'] ? files['audio'][0] : null;
    const lyricsFile = files['lyrics'] ? files['lyrics'][0] : null;
    const imageFile = files['image'] ? files['image'][0] : null;

    const newAudio = {
      title,
      audio: audioFile
        ? {
            file: `uploads/audio/audioFile/${audioFile.filename}`, // Removed leading slash
            fileName: audioFile.filename,
            fileType: audioFile.mimetype,
            fileSize: audioFile.size,
          }
        : null,
      image: imageFile
        ? {
            file: `uploads/audio/image/${imageFile.filename}`, // Removed leading slash
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : null,
      subcategory: subCategoryId,
      artist: artistId,
      lyrics: lyricsFile
        ? {
            file: `uploads/audio/lyricsFile/${lyricsFile.filename}`, // Removed leading slash
            fileName: lyricsFile.filename,
            fileType: lyricsFile.mimetype,
            fileSize: lyricsFile.size,
          }
        : null,
    };

    const createdAudio = await (
      await Audio.create(newAudio)
    ).populate([
      {
        path: 'subcategory',
        select: '_id subcategory_name',
      },
      {
        path: 'artist',
        select: '_id name',
      }
    ]);

    if (createdAudio) {
      // Add audio to subcategory's audios array
      findSubcategory.audios.push(createdAudio.id);
      await findSubcategory.save();
      
      // Add audio to artist's audios array
      const Artist = mongoose.model('Artist');
      const artist = await Artist.findById(artistId);
      if (artist) {
        artist.audios.push(createdAudio.id);
        await artist.save();
      }
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
            file: `uploads/audio/audioFile/${audioFile.filename}`, // Removed leading slash
            fileName: audioFile.filename,
            fileType: audioFile.mimetype,
            fileSize: audioFile.size,
          }
        : findAudio.audio, // Keep existing audio if no new file is uploaded
      image: imageFile
        ? {
            file: `uploads/audio/image/${imageFile.filename}`, // Removed leading slash
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : findAudio.image, // Keep existing image if no new file is uploaded
      subcategory: newSubCatId || findAudio.subcategory, // Keep existing subcategory if not provided
      lyrics: lyricsFile
        ? {
            file: `uploads/audio/lyricsFile/${lyricsFile.filename}`, // Removed leading slash
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
