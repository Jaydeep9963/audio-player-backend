/* eslint-disable prettier/prettier */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from "./admin.model";
import { getUserByEmail } from './admin.service';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@123', salt);

    const user = new User({
      email: 'admin@gmail.com', // Set manually
      password: hashedPassword, // Hashed password
    });

    const isExist = await getUserByEmail(user.email)
    if (!isExist) await user.save();
    // eslint-disable-next-line no-console
    console.log("admin saved in db");
    
  } catch (error) {
    mongoose.disconnect();
  }
};

export default createAdminUser;

