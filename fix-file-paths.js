const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost:27017/your-database-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import your models
const Category = require('./dist/modules/category/category.model').default;
const SubCategory = require('./dist/modules/subCategory/subCategory.model').default;
const Audio = require('./dist/modules/audio/audio.model').default;

async function fixFilePaths() {
  try {
    console.log('Starting file path fix...');

    // Fix Category file paths
    const categories = await Category.find({});
    for (const category of categories) {
      if (category.image && category.image.file && !category.image.file.startsWith('/uploads/')) {
        const oldPath = category.image.file;
        const filename = path.basename(oldPath);
        const newPath = `/uploads/category/image/${filename}`;
        
        // Check if file exists at the new location
        const relativePath = `uploads/category/image/${filename}`;
        if (fs.existsSync(relativePath)) {
          await Category.updateOne(
            { _id: category._id },
            { $set: { 'image.file': newPath } }
          );
          console.log(`Fixed category: ${category.category_name} - ${oldPath} -> ${newPath}`);
        } else {
          console.log(`File not found for category: ${category.category_name} - ${relativePath}`);
        }
      }
    }

    // Fix SubCategory file paths
    const subCategories = await SubCategory.find({});
    for (const subCategory of subCategories) {
      if (subCategory.image && subCategory.image.file && !subCategory.image.file.startsWith('/uploads/')) {
        const oldPath = subCategory.image.file;
        const filename = path.basename(oldPath);
        const newPath = `/uploads/subcategory/image/${filename}`;
        
        // Check if file exists at the new location
        const relativePath = `uploads/subcategory/image/${filename}`;
        if (fs.existsSync(relativePath)) {
          await SubCategory.updateOne(
            { _id: subCategory._id },
            { $set: { 'image.file': newPath } }
          );
          console.log(`Fixed subcategory: ${subCategory.subcategory_name} - ${oldPath} -> ${newPath}`);
        } else {
          console.log(`File not found for subcategory: ${subCategory.subcategory_name} - ${relativePath}`);
        }
      }
    }

    // Fix Audio file paths
    const audios = await Audio.find({});
    for (const audio of audios) {
      let updated = false;
      
      // Fix audio file path
      if (audio.audio && audio.audio.file && !audio.audio.file.startsWith('/uploads/')) {
        const oldPath = audio.audio.file;
        const filename = path.basename(oldPath);
        const newPath = `/uploads/audio/audioFile/${filename}`;
        
        const relativePath = `uploads/audio/audioFile/${filename}`;
        if (fs.existsSync(relativePath)) {
          await Audio.updateOne(
            { _id: audio._id },
            { $set: { 'audio.file': newPath } }
          );
          console.log(`Fixed audio file: ${audio.title} - ${oldPath} -> ${newPath}`);
          updated = true;
        } else {
          console.log(`Audio file not found: ${audio.title} - ${relativePath}`);
        }
      }

      // Fix image file path
      if (audio.image && audio.image.file && !audio.image.file.startsWith('/uploads/')) {
        const oldPath = audio.image.file;
        const filename = path.basename(oldPath);
        const newPath = `/uploads/audio/image/${filename}`;
        
        const relativePath = `uploads/audio/image/${filename}`;
        if (fs.existsSync(relativePath)) {
          await Audio.updateOne(
            { _id: audio._id },
            { $set: { 'image.file': newPath } }
          );
          console.log(`Fixed audio image: ${audio.title} - ${oldPath} -> ${newPath}`);
          updated = true;
        } else {
          console.log(`Audio image not found: ${audio.title} - ${relativePath}`);
        }
      }

      // Fix lyrics file path
      if (audio.lyrics && audio.lyrics.file && !audio.lyrics.file.startsWith('/uploads/')) {
        const oldPath = audio.lyrics.file;
        const filename = path.basename(oldPath);
        const newPath = `/uploads/audio/lyricsFile/${filename}`;
        
        const relativePath = `uploads/audio/lyricsFile/${filename}`;
        if (fs.existsSync(relativePath)) {
          await Audio.updateOne(
            { _id: audio._id },
            { $set: { 'lyrics.file': newPath } }
          );
          console.log(`Fixed audio lyrics: ${audio.title} - ${oldPath} -> ${newPath}`);
          updated = true;
        } else {
          console.log(`Audio lyrics not found: ${audio.title} - ${relativePath}`);
        }
      }
    }

    console.log('File path fix completed!');
  } catch (error) {
    console.error('Error fixing file paths:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixFilePaths(); 