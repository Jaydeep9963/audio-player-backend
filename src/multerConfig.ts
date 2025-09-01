/* eslint-disable prettier/prettier */
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';

    // Check which route the request is coming from and adjust the folder
    if (req.url.includes('/categories')) {
      folder += 'category/image/';
    } else if (req.url.includes('/subcategories')) {
      folder += 'subcategory/image/';
    } else if (req.url.includes('/artists')) {
      folder += 'artist/image/';
    } else if (req.url.includes('/audios')) {
      if (file.mimetype === 'audio/mpeg') {
        // .mp3 files
        folder += 'audio/audioFile/';
      } else if (file.mimetype === 'text/lrc' || file.mimetype === 'application/octet-stream') {
        // Assume lyrics are in .lrc or PDF format
        folder += 'audio/lyricsFile/';
      } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        folder += 'audio/image/';
      }
    }

    // Ensure the directory exists before saving files
    ensureDirectoryExists(folder);

    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  },
});

// File validation: only accept jpg, jpeg, png, mp3, pdf, and lrc
const fileFilter = (_req: any, file: any, cb: any) => {
  // Allowed file extensions
  const allowedFileTypes = /jpeg|jpg|png|mp3|lrc/;

  // Check for valid file extension
  const extname = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedFileTypes.test(extname.slice(1)); // Remove the dot

  // Allowed MIME types
  const allowedMimeTypes = /image\/jpeg|image\/png|audio\/mpeg|application\/octet-stream|text\/lrc/;

  // Check for valid MIME type
  const isValidMime = allowedMimeTypes.test(file.mimetype);

  // Special handling for .lrc files
  if (extname === '.lrc') {
    // Allow .lrc files regardless of the MIME type (since MIME detection may fail for lrc files)
    return cb(null, true);
  }

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .png, .jpg, .jpeg, .mp3, .pdf, and .lrc formats are allowed!'), false);
  }
};

// Initialize multer with storage and file filter
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB file size limit
  fileFilter,
});

export default upload;
