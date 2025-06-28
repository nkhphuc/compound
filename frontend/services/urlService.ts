// Helper to get the full image/file URL for uploaded files
// Use relative URL for S3 since nginx handles the routing
const S3_PUBLIC_ENDPOINT = '/s3';

export function getImageUrl(url: string) {
  if (!url) return url;

  // If it's already a full URL (starts with http), return as is
  if (url.startsWith('http')) {
    return url;
  }

  // If it's an S3 path (starts with /compound-uploads/), build full URL
  if (url.startsWith('/compound-uploads/')) {
    return `${S3_PUBLIC_ENDPOINT}${url}`;
  }

  // Return as is if it doesn't match any pattern
  return url;
}
