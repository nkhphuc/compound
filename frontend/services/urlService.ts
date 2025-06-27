// Helper to get the full image/file URL for uploaded files
const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:3002';

export function getImageUrl(url: string) {
  if (url?.startsWith('/uploads/')) {
    return `${FILE_BASE_URL}${url}`;
  }
  return url;
}
