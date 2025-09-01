/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose'; 

// Define file structure interface
interface FileData {
  file: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface IAudio extends Document {
  title: string;
  audio: FileData; // Object with file properties
  lyrics: FileData; // Object with file properties
  image: FileData; // Object with file properties
  subcategory: Schema.Types.ObjectId;
  artist: Schema.Types.ObjectId; // Added artist field
}

const AudioSchema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  audio: {
    file: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  }, // URL for the audio file (mp3)
  image: {
    file: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  lyrics: {
    file: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
  },
  subcategory: { type: Schema.Types.ObjectId, ref: 'Subcategory', required: true },
  artist: { type: Schema.Types.ObjectId, ref: 'Artist', required: true }, // Added artist reference
});

export default mongoose.model<IAudio>('Audio', AudioSchema);