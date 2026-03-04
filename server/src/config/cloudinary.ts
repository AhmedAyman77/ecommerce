import { env } from './env.config';
import cloudinary from 'cloudinary';
import { Readable } from 'stream';

cloudinary.v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploader = cloudinary.v2.uploader;

// Upload a buffer directly to Cloudinary via stream
export const uploadStream = (buffer: Buffer, folder: string): Promise<cloudinary.UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = uploader.upload_stream({ folder }, (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Upload failed'));
            resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });
};