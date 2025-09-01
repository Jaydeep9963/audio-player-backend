/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../utils';
import { ApiError } from '../errors';
import Artist from './artist.model';
import Audio from '../audio/audio.model';

export const getArtists = catchAsync(async (req: Request, res: Response) => {
  try {
    const artistName = (req.query['artistName']?.toString().trim().toLowerCase() || '') as string;
    const page = parseInt(req.query['page'] as string, 10) || 1; // default to page 1 if not provided
    const limit = parseInt(req.query['limit'] as string, 10) || 10; // default to 10 items per page
    const skip = (page - 1) * limit;

    const filter = artistName ? { name: { $regex: artistName, $options: 'i' } } : {};

    const artistList = await Artist.find(filter)
      .skip(skip)
      .limit(limit);

    const totalArtists = await Artist.countDocuments(filter);
    const totalPages = Math.ceil(totalArtists / limit);

    if (artistList) {
      res.status(200).json({
        artists: artistList,
        totalArtists,
        totalPages,
        currentPage: page,
        pageSize: limit,
      });
    } else {
      res.json({ artists: [] });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const addArtist = catchAsync(async (req: Request, res: Response) => {
  try {
    const { name, bio } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newArtist = {
      name,
      bio: bio || '',
      image: {
        file: `uploads/artist/image/${req.file?.filename}`, // Removed leading slash
        fileName: req.file?.filename,
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
      },
      audios: [],
    };

    const createdArtist = await Artist.create(newArtist);
    return res.status(201).json({ success: true, data: createdArtist });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const getArtistById = catchAsync(async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    
    const artist = await Artist.findById(artistId);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    return res.status(200).json({ success: true, data: artist });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});

export const getArtistSongs = catchAsync(async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const page = parseInt(req.query['page'] as string, 10) || 1;
    const limit = parseInt(req.query['limit'] as string, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Find all audio files with this artist ID directly
    const songs = await Audio.find({ artist: artistId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'subcategory',
        select: '_id subcategory_name',
        populate: {
          path: 'category',
          select: '_id category_name'
        }
      });
    
    const totalSongs = await Audio.countDocuments({ artist: artistId });
    const totalPages = Math.ceil(totalSongs / limit);
    
    // Process songs to remove leading slash from file paths
    const processedSongs = songs.map(song => {
      const songObj = song.toObject();
      
      // Remove leading slash from audio file path if it exists
      if (songObj.audio && songObj.audio.file && songObj.audio.file.startsWith('/')) {
        songObj.audio.file = songObj.audio.file.substring(1);
      }
      
      // Remove leading slash from image file path if it exists
      if (songObj.image && songObj.image.file && songObj.image.file.startsWith('/')) {
        songObj.image.file = songObj.image.file.substring(1);
      }
      
      // Remove leading slash from lyrics file path if it exists
      if (songObj.lyrics && songObj.lyrics.file && songObj.lyrics.file.startsWith('/')) {
        songObj.lyrics.file = songObj.lyrics.file.substring(1);
      }
      
      return songObj;
    });
    
    return res.status(200).json({
      songs: processedSongs,
      totalSongs,
      totalPages,
      currentPage: page,
      pageSize: limit
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
});