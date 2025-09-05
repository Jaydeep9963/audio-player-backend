/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose';

// Define a custom image type
interface IImage {
  file: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface IArtist extends Document {
  name: string;
  bio: string;
  image: IImage;
  audios: Array<Schema.Types.ObjectId>;
}

const ArtistSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  bio: {
    type: String,
    default: ''
  },
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
  audios: [{ type: Schema.Types.ObjectId, ref: 'Audio' }],
}, {
  timestamps: true
});

export default mongoose.model<IArtist>('Artist', ArtistSchema);