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
    console.log(`Checking if bucket ${S3_CONFIG.BUCKET} exists...`);
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
    console.log(`✓ Bucket ${S3_CONFIG.BUCKET} exists`);
  } catch (err: unknown) {
    const error = err as { $metadata?: { httpStatusCode?: number }; name?: string };
    console.log(`Bucket check result:`, {
      statusCode: error.$metadata?.httpStatusCode,
      errorName: error.name,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error.$metadata && error.$metadata.httpStatusCode === 404) {
      console.log(`Creating bucket ${S3_CONFIG.BUCKET}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
      console.log(`✓ Bucket ${S3_CONFIG.BUCKET} created successfully`);
    } else if (error.name === 'NotFound') {
      console.log(`Creating bucket ${S3_CONFIG.BUCKET}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.BUCKET }));
      console.log(`✓ Bucket ${S3_CONFIG.BUCKET} created successfully`);
    } else {
      console.error(`❌ Error with bucket ${S3_CONFIG.BUCKET}:`, error);
      throw err;
    }
  }
}

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation is now handled by middleware, so we can assume file exists
    const uploadedFile = req.files!.file as FileUpload;

    console.log(`Upload request received for file: ${uploadedFile.name}, size: ${uploadedFile.size}, type: ${uploadedFile.mimetype}`);

    // Verify bucket exists and is accessible
    try {
      await ensureBucketExists();
      console.log(`✓ Bucket ${S3_CONFIG.BUCKET} is accessible`);
    } catch (bucketError) {
      console.error('❌ Bucket access error:', bucketError);
      res.status(500).json({
        success: false,
        error: 'Storage service not available. Please check MinIO configuration.'
      });
      return;
    }

    const fileExtension = path.extname(uploadedFile.name);
    const fileName = `${uuidv4()}${fileExtension}`;

    console.log(`Preparing to upload file with key: ${fileName}`);

    const putParams = {
      Bucket: S3_CONFIG.BUCKET,
      Key: fileName,
      Body: uploadedFile.data,
      ContentType: uploadedFile.mimetype,
      ACL: 'public-read' as const,
    };

    console.log(`Uploading to S3/MinIO with params:`, {
      Bucket: putParams.Bucket,
      Key: putParams.Key,
      ContentType: putParams.ContentType,
      ACL: putParams.ACL
    });

    await s3Client.send(new PutObjectCommand(putParams));
    console.log(`✓ File uploaded successfully: ${fileName}`);

    // Save only the file path without bucket name, nginx will handle routing
    const filePath = `/compound-uploads/${fileName}`;

    console.log(`Returning file path: ${filePath}`);

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
    console.error('❌ Error uploading file to S3/MinIO:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    if (error instanceof Error) {
      if (error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to storage service. Please check MinIO permissions.';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'Storage bucket not found. Please check MinIO configuration.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to storage service. Please check MinIO is running.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    let uploadedFiles = req.files!.files as FileUpload[] | FileUpload;
    if (!Array.isArray(uploadedFiles)) {
      // If it's a single file, wrap it in an array
      uploadedFiles = [uploadedFiles];
    }

    console.log(`Multiple upload request received for ${uploadedFiles.length} files`);

    // Verify bucket exists and is accessible
    try {
      await ensureBucketExists();
      console.log(`✓ Bucket ${S3_CONFIG.BUCKET} is accessible for multiple uploads`);
    } catch (bucketError) {
      console.error('❌ Bucket access error for multiple uploads:', bucketError);
      res.status(500).json({
        success: false,
        error: 'Storage service not available. Please check MinIO configuration.'
      });
      return;
    }

    await ensureBucketExists();
    const uploadPromises = uploadedFiles.map(async (file: FileUpload, index: number) => {
      const fileExtension = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExtension}`;

      console.log(`Uploading file ${index + 1}/${uploadedFiles.length}: ${file.name} -> ${fileName}`);

      const putParams = {
        Bucket: S3_CONFIG.BUCKET,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'public-read' as const,
      };

      await s3Client.send(new PutObjectCommand(putParams));
      console.log(`✓ File ${index + 1} uploaded successfully: ${fileName}`);

      return {
        url: `/compound-uploads/${fileName}`,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    const results = await Promise.all(uploadPromises);
    console.log(`✓ All ${results.length} files uploaded successfully`);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Error uploading multiple files to S3/MinIO:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to upload files';
    if (error instanceof Error) {
      if (error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to storage service. Please check MinIO permissions.';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'Storage bucket not found. Please check MinIO configuration.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to storage service. Please check MinIO is running.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    res.status(500).json({ success: false, error: errorMessage });
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
