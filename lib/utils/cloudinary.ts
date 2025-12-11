/**
 * Utility functions for working with Cloudinary URLs
 */

/**
 * Extracts the original image URL from a Cloudinary URL
 * Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
 * 
 * @param cloudinaryUrl - The Cloudinary URL (e.g., https://res.cloudinary.com/dyh3jmwtd/image/upload/v1763398018/Group_1171275044_tn2ccj.svg)
 * @returns The original image URL without transformations
 */
export function extractOriginalCloudinaryUrl(cloudinaryUrl: string): string {
  try {
    // Check if it's a Cloudinary URL
    if (!cloudinaryUrl.includes('res.cloudinary.com')) {
      return cloudinaryUrl; // Return as-is if not a Cloudinary URL
    }

    // If the URL doesn't have transformations (no version or other params), return as-is
    // A clean URL like: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.png
    // Should be kept as-is if it's already the original
    const url = new URL(cloudinaryUrl);
    const pathParts = url.pathname.split('/').filter(part => part !== '');
    
    // Find the index of 'upload'
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      return cloudinaryUrl; // Return as-is if structure is unexpected
    }

    // Get everything after 'upload'
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    if (afterUpload.length === 0) {
      return cloudinaryUrl;
    }
    
    // Check if there's a version (starts with 'v' followed by numbers)
    // If there's a version, we need to preserve the folder structure
    const hasVersion = afterUpload[0]?.startsWith('v') && /^v\d+$/.test(afterUpload[0]);
    
    // If URL has version and folder, it's already in the correct format - return as-is
    // Format: /upload/v123/folder/file.png
    if (hasVersion && afterUpload.length >= 3) {
      // This is already a properly formatted Cloudinary URL with version and folder
      // Don't extract - return as-is
      return cloudinaryUrl;
    }
    
    // For URLs with transformations (like w_500, h_300, etc.), extract just the file
    // But preserve folder structure if present
    const fileName = afterUpload[afterUpload.length - 1];
    
    // Extract cloud name
    const cloudNameMatch = cloudinaryUrl.match(/res\.cloudinary\.com\/([^\/]+)\//);
    const cloudName = cloudNameMatch?.[1];
    
    if (!cloudName || cloudName === 'image') {
      return cloudinaryUrl; // Return original if we can't extract cloud name
    }
    
    // Reconstruct URL preserving folder if it exists
    // Check if there's a folder before the filename
    let folderPath = '';
    if (afterUpload.length > 1) {
      // Check if second-to-last part is a folder (not a transformation)
      const possibleFolder = afterUpload[afterUpload.length - 2];
      // If it doesn't look like a transformation (no underscore or equals), it might be a folder
      if (possibleFolder && !possibleFolder.includes('_') && !possibleFolder.includes('=')) {
        folderPath = possibleFolder + '/';
      }
    }
    
    const originalPath = `/${cloudName}/image/upload/${folderPath}${fileName}`;
    const finalUrl = `${url.protocol}//${url.host}${originalPath}`;
    
    return finalUrl;
  } catch (error) {
    console.error('Error extracting Cloudinary URL:', error, 'URL:', cloudinaryUrl);
    return cloudinaryUrl; // Return original URL on error
  }
}

/**
 * Validates if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('cloudinary.com');
  } catch {
    return false;
  }
}

/**
 * Extracts the public ID from a Cloudinary URL
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
      return null;
    }

    const url = new URL(cloudinaryUrl);
    const pathParts = url.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return null;
    }

    const afterUpload = pathParts.slice(uploadIndex + 1);
    const fileName = afterUpload[afterUpload.length - 1];
    
    // Remove file extension
    return fileName.split('.')[0];
  } catch {
    return null;
  }
}

