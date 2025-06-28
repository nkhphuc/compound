// S3/MinIO Upload Controller (AWS SDK v3)
// Required env vars:
// S3_ENDPOINT=http://localhost:9000
// S3_ACCESS_KEY=minioadmin
// S3_SECRET_KEY=minioadmin
// S3_BUCKET=compound-uploads

import { Request, Response } from 'express';
import { HeadBucketCommand, CreateBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { s3Client, S3_CONFIG } from '../config/s3';

// Ensure bucket exists (create if not)
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
  } catch (err: any) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
    } else if (err.name === 'NotFound') {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
    } else {
      throw err;
    }
  }
}

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation is now handled by middleware, so we can assume file exists
    const uploadedFile = req.files!.file as any;

    await ensureBucketExists();
    const fileExtension = path.extname(uploadedFile.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const putParams = {
      Bucket: S3_CONFIG.BUCKET,
      Key: fileName,
      Body: uploadedFile.data,
      ContentType: uploadedFile.mimetype,
      ACL: 'public-read' as const,
    };
    await s3Client.send(new PutObjectCommand(putParams));

    // Save only the file path, not the full URL
    const filePath = `/${S3_CONFIG.BUCKET}/${fileName}`;

    res.json({
      success: true,
      data: {
        url: filePath,
        filename: fileName,
        originalName: uploadedFile.name,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
      },
    });
  } catch (error) {
    console.error('Error uploading file to S3/MinIO:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
};
