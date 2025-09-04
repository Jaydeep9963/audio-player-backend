/* eslint-disable prettier/prettier */
import { parseFile } from "music-metadata";
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
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
      })
      .populate({
        path: 'artist',
        select: '_id name',
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

// Helper function to format seconds to MM:SS format
const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to extract audio duration using music-metadata
const extractAudioDuration = async (filePath: string): Promise<{ seconds: number; formatted: string }> => {
  try {
    console.log('Attempting to extract duration from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Audio file does not exist:', filePath);
      return { seconds: 0, formatted: "00:00" };
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');

    if (stats.size === 0) {
      console.error('Audio file is empty:', filePath);
      return { seconds: 0, formatted: "00:00" };
    }

    // Parse metadata
    const metadata = await parseFile(filePath);
    console.log('Metadata parsed successfully');
    
    const duration = metadata?.format?.duration;
    console.log('Raw duration from metadata:', duration);

    if (duration && duration > 0) {
      const seconds = Math.round(duration);
      const formatted = formatDuration(seconds);
      console.log(`Duration extracted: ${seconds} seconds (${formatted})`);
      return { seconds, formatted };
    } else {
      console.log('No valid duration found in metadata');
      return { seconds: 0, formatted: "00:00" };
    }
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    console.error('Error extracting audio duration:', errorMessage);
    return { seconds: 0, formatted: "00:00" };
  }
};

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

    if (!audioFile) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Extract audio duration
    let audioDurationSeconds = 0;
    let audioDurationFormatted = "00:00";
    
    try {
      const fullPath = path.resolve(audioFile.path);
      console.log('Full file path:', fullPath);
      
      const durationData = await extractAudioDuration(fullPath);
      audioDurationSeconds = durationData.seconds;
      audioDurationFormatted = durationData.formatted;
      
      console.log('Final duration:', audioDurationSeconds, 'seconds,', audioDurationFormatted);
    } catch (durationError) {
      console.error('Duration extraction failed:', durationError);
      audioDurationSeconds = 0;
      audioDurationFormatted = "00:00";
    }

    const newAudio = {
      title,
      audio: {
        file: `uploads/audio/audioFile/${audioFile.filename}`,
        fileName: audioFile.filename,
        fileType: audioFile.mimetype,
        fileSize: audioFile.size,
      },
      image: imageFile
        ? {
            file: `uploads/audio/image/${imageFile.filename}`,
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : null,
      duration: audioDurationSeconds,
      durationFormatted: audioDurationFormatted, // Add formatted duration
      subcategory: subCategoryId,
      artist: artistId,
      lyrics: lyricsFile
        ? {
            file: `uploads/audio/lyricsFile/${lyricsFile.filename}`,
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
    const { title, subCategoryId: newSubCatId, duration: manualDuration } = req.body;

    if (newSubCatId && !mongoose.Types.ObjectId.isValid(newSubCatId)) {
      return res.status(400).json({ message: 'Invalid subCategoryId' });
    }

    const findAudio = await Audio.findById(audioId);

    if (!findAudio) {
      return res.status(404).json({ message: 'audio not found' });
    }

    const findSubCategory = await SubCategory.findById(newSubCatId);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const audioFile = files['audio'] ? files['audio'][0] : null;
    const lyricsFile = files['lyrics'] ? files['lyrics'][0] : null;
    const imageFile = files['image'] ? files['image'][0] : null;

    // Handle duration
    let audioDurationSeconds = findAudio.duration || 0;
    let audioDurationFormatted = formatDuration(audioDurationSeconds);
    
    if (manualDuration && !isNaN(parseFloat(manualDuration))) {
      // Allow manual duration override (expecting seconds)
      audioDurationSeconds = Math.round(parseFloat(manualDuration));
      audioDurationFormatted = formatDuration(audioDurationSeconds);
      console.log('Using manual duration:', audioDurationSeconds, 'seconds');
    } else if (audioFile) {
      // Extract from new audio file
      try {
        const fullPath = path.resolve(audioFile.path);
        console.log('Extracting duration from updated file:', fullPath);
        
        const durationData = await extractAudioDuration(fullPath);
        audioDurationSeconds = durationData.seconds;
        audioDurationFormatted = durationData.formatted;
        
        console.log('Successfully extracted updated duration:', audioDurationSeconds, 'seconds');
      } catch (durationError) {
        console.error('Duration extraction failed during update:', durationError);
        // Keep the existing duration if extraction fails
      }
    }

    // Set up the fields to be updated
    const audio = {
      title: title || findAudio.title,
      audio: audioFile
        ? {
            file: `uploads/audio/audioFile/${audioFile.filename}`,
            fileName: audioFile.filename,
            fileType: audioFile.mimetype,
            fileSize: audioFile.size,
          }
        : findAudio.audio,
      image: imageFile
        ? {
            file: `uploads/audio/image/${imageFile.filename}`,
            fileName: imageFile.filename,
            fileType: imageFile.mimetype,
            fileSize: imageFile.size,
          }
        : findAudio.image,
      duration: audioDurationSeconds,
      durationFormatted: audioDurationFormatted,
      subcategory: newSubCatId || findAudio.subcategory,
      lyrics: lyricsFile
        ? {
            file: `uploads/audio/lyricsFile/${lyricsFile.filename}`,
            fileName: lyricsFile.filename,
            fileType: lyricsFile.mimetype,
            fileSize: lyricsFile.size,
          }
        : findAudio.lyrics,
    };

    const updatedAudio = await (
      await Audio.findByIdAndUpdate(audioId, { $set: audio }, { new: true, runValidators: true })
    )?.populate([
      {
        path: 'subcategory',
        select: '_id subcategory_name',
      },
      {
        path: 'artist',
        select: '_id name',
      }
    ]);

    if (!updatedAudio) {
      return res.status(404).json({ message: 'Audio not found' });
    }

    // remove from old category if category is being changed
    if (newSubCatId && findAudio && findAudio.subcategory.toString() !== newSubCatId) {
      const { subcategory: subcategoryId } = findAudio;

      // remove from old category
      const subCategory = await SubCategory.findById(subcategoryId);
      if (subCategory) {
        const index = subCategory.audios.findIndex((id) => id.toString() === audioId);
        if (index !== -1) {
          subCategory.audios.splice(index, 1);
          await subCategory.save();
        }
      }

      // add to new category
      if (findSubCategory && audioId) {
        findSubCategory.audios.push(audioId);
        await findSubCategory.save();
      }
    }

    return res.status(200).json({
      message: 'Audio updated successfully',
      data: updatedAudio,
    });
  } catch (error) {
    console.log('🚀 ~ updateAudio ~ error:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const deleteAudio = catchAsync(async (req: Request, res: Response) => {
  try {
    const { audioId } = req.params;
    const findAudio = await Audio.findById(audioId);

    if (findAudio) {
      const { subcategory: subcategoryId, artist: artistId } = findAudio;

      // remove from subcategory
      const subcategory = await SubCategory.findById(subcategoryId);
      if (subcategory) {
        const index = subcategory.audios.findIndex((id) => id.toString() === audioId);
        if (index !== -1) {
          subcategory.audios.splice(index, 1);
          await subcategory.save();
        }
      }

      // remove from artist
      if (artistId) {
        const Artist = mongoose.model('Artist');
        const artist = await Artist.findById(artistId);
        if (artist) {
          const index = artist.audios.findIndex((id: any) => id.toString() === audioId);
          if (index !== -1) {
            artist.audios.splice(index, 1);
            await artist.save();
          }
        }
      }
    }

    const deletedAudio = await Audio.findByIdAndRemove(audioId);
    if (!deletedAudio) {
      return res.status(404).json({ message: 'Audio not found' });
    }

    return res.status(200).json({
      message: 'Audio deleted successfully',
      data: deletedAudio,
    });
  } catch (error) {
    console.log('🚀 ~ deleteAudio ~ error:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});