import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.config';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'hirehelper/profiles',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `profile_${Date.now()}`,
    };
  },
});

export const upload = multer({ storage: storage });
