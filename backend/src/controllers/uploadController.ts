// S3/MinIO Upload Controller (AWS SDK v3)
// Required env vars:
// S3_ENDPOINT=http://localhost:9000
// S3_PUBLIC_ENDPOINT=http://localhost:9000 (for public URLs)
// S3_ACCESS_KEY=minioadmin
// S3_SECRET_KEY=minioadmin
// S3_BUCKET=compound-uploads

import { Request, Response } from 'express';
import { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET || 'compound-uploads';

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1', // MinIO ignores region but AWS SDK v3 requires it
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // needed for MinIO
});

// Ensure bucket exists (create if not)
async function ensureBucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch (err: any) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) {
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    } else if (err.name === 'NotFound') {
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
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
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: uploadedFile.data,
      ContentType: uploadedFile.mimetype,
      ACL: 'public-read' as const,
    };
    await s3.send(new PutObjectCommand(putParams));
    // Public URL for MinIO (use public endpoint for browser-accessible URLs)
    const fileUrl = `${S3_PUBLIC_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${fileName}`;
    res.json({
      success: true,
      data: {
        url: fileUrl,
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
