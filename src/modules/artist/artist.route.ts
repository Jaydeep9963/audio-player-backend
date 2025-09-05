/* eslint-disable prettier/prettier */
import express, { Router } from 'express';
import { getArtists, getArtistById, getArtistSongs, addArtist, updateArtist } from './artist.controller';
import upload from '../../multerConfig';
import authenticateToken from '../../routes/v1/authenticationMiddleware';

const router: Router = express.Router();

router.get('/', getArtists);
router.post('/', authenticateToken, upload.single('image'), addArtist);
router.put('/:artistId', authenticateToken, upload.single('image'), updateArtist);
router.get('/:artistId', getArtistById);
router.get('/:artistId/songs', getArtistSongs);

export default router;