import { env } from './env.config';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
});

export const uploader = cloudinary.v2.uploader;