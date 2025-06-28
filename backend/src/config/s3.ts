// Shared S3/MinIO Configuration
import { S3Client } from '@aws-sdk/client-s3';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET || 'compound-uploads';

// Shared S3 client instance
export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1', // MinIO ignores region but AWS SDK v3 requires it
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // needed for MinIO
  // Additional MinIO-specific configurations
  maxAttempts: 3,
  retryMode: 'adaptive',
  // Disable SSL verification for local development
  ...(S3_ENDPOINT.includes('localhost') && {
    requestHandler: {
      httpOptions: {
        timeout: 30000,
      },
    },
  }),
});

// Export configuration constants
export const S3_CONFIG = {
  ENDPOINT: S3_ENDPOINT,
  ACCESS_KEY: S3_ACCESS_KEY,
  SECRET_KEY: S3_SECRET_KEY,
  BUCKET: S3_BUCKET,
};
