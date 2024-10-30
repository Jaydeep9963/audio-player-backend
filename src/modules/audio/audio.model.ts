/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose'; 

interface IAudio extends Document {
  title: string;
  audio: File; // URL for the .mp3 file
  lyrics: File; // URL for the .lrc file
  image: File; // URL for the image
  subcategory: Schema.Types.ObjectId;
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
});

export default mongoose.model<IAudio>('Audio', AudioSchema);