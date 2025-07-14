import { Request, Response } from 'express';
import { HeadBucketCommand, CreateBucketCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { s3Client, S3_CONFIG } from '../config/s3.js';

// Type for uploaded file (from express-fileupload or similar middleware)
type FileUpload = {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
  mv?: (path: string, callback: (err: Error | null) => void) => void;
};

// Ensure bucket exists (create if not)
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
  } catch (err: unknown) {
    const error = err as { $metadata?: { httpStatusCode?: number }; name?: string };
    if (error.$metadata && error.$metadata.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
    } else if (error.name === 'NotFound') {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
    } else {
      throw err;
    }
  }
}

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation is now handled by middleware, so we can assume file exists
    const uploadedFile = req.files!.file as FileUpload;

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

export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    let uploadedFiles = req.files!.files as FileUpload[] | FileUpload;
    if (!Array.isArray(uploadedFiles)) {
      // If it's a single file, wrap it in an array
      uploadedFiles = [uploadedFiles];
    }

    await ensureBucketExists();
    const uploadPromises = uploadedFiles.map(async (file: FileUpload) => {
      const fileExtension = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExtension}`;
      const putParams = {
        Bucket: S3_CONFIG.BUCKET,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'public-read' as const,
      };
      await s3Client.send(new PutObjectCommand(putParams));
      return {
        url: `/${S3_CONFIG.BUCKET}/${fileName}`,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error uploading multiple files to S3/MinIO:', error);
    res.status(500).json({ success: false, error: 'Failed to upload files' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      res.status(400).json({ success: false, error: 'File URL is required' });
      return;
    }

    // Extract S3 key from file URL
    let s3Key: string | null = null;

    // Handle both legacy full URLs and new path-only format
    if (fileUrl.startsWith('/compound-uploads/')) {
      const parts = fileUrl.split('/');
      if (parts.length >= 3) {
        s3Key = parts.slice(2).join('/'); // Return everything after /compound-uploads/
      }
    } else if (fileUrl.startsWith('http')) {
      // Legacy support: if it's a full URL, try to extract the key
      try {
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 3 && pathParts[1] === S3_CONFIG.BUCKET) {
          s3Key = pathParts.slice(2).join('/'); // Return everything after the bucket name
        }
      } catch {
        // Invalid URL format
      }
    }

    if (!s3Key) {
      res.status(400).json({ success: false, error: 'Invalid file URL format' });
      return;
    }

    // Delete file from S3/MinIO
    await s3Client.send(new DeleteObjectCommand({ Bucket: S3_CONFIG.BUCKET, Key: s3Key }));

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file from S3/MinIO:', error);
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
};
