import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// For now, we'll implement a simple local file storage
// In production, you'd want to use cloud storage like AWS S3, Google Cloud Storage, etc.
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- S3 Upload Snippet (for future use) ---
//
// import AWS from 'aws-sdk';
//
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION
// });
// const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
//
// export const uploadFile = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.files || Object.keys(req.files).length === 0) {
//       res.status(400).json({ success: false, error: 'No file uploaded' });
//       return;
//     }
//     const uploadedFile = req.files.file as any;
//     if (Array.isArray(uploadedFile)) {
//       res.status(400).json({ success: false, error: 'Only single file uploads are supported' });
//       return;
//     }
//     const fileExtension = path.extname(uploadedFile.name);
//     const fileName = `${uuidv4()}${fileExtension}`;
//     const params = {
//       Bucket: S3_BUCKET,
//       Key: fileName,
//       Body: uploadedFile.data,
//       ContentType: uploadedFile.mimetype,
//       ACL: 'public-read'
//     };
//     const s3Result = await s3.upload(params).promise();
//     res.json({
//       success: true,
//       data: {
//         url: s3Result.Location,
//         filename: fileName,
//         originalName: uploadedFile.name,
//         size: uploadedFile.size,
//         mimetype: uploadedFile.mimetype
//       }
//     });
//   } catch (error) {
//     console.error('Error uploading file to S3:', error);
//     res.status(500).json({ success: false, error: 'Failed to upload file' });
//   }
// };

// --- End S3 Upload Snippet ---

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const uploadedFile = req.files.file as any;

    if (Array.isArray(uploadedFile)) {
      res.status(400).json({
        success: false,
        error: 'Only single file uploads are supported'
      });
      return;
    }

    // Generate unique filename
    const fileExtension = path.extname(uploadedFile.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Move file to upload directory
    await uploadedFile.mv(filePath);

    // In production, you would upload to cloud storage and return the cloud URL
    // For now, we'll return a local URL that the frontend can use
    const fileUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        originalName: uploadedFile.name,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};
