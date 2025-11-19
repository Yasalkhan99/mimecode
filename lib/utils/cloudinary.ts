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

    // First, try to extract cloud name using regex from the full URL string
    // This works even if the pathname is malformed
    const cloudNameMatch = cloudinaryUrl.match(/res\.cloudinary\.com\/([^\/]+)\//);
    let cloudName: string | null = null;
    
    if (cloudNameMatch && cloudNameMatch[1] && cloudNameMatch[1] !== 'image') {
      cloudName = cloudNameMatch[1];
    }

    // Parse the URL
    const url = new URL(cloudinaryUrl);
    
    // Extract path parts: /{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    // Example: /dyh3jmwtd/image/upload/v1763398018/Group_1171275044_tn2ccj.svg
    const pathParts = url.pathname.split('/').filter(part => part !== ''); // Remove empty strings
    
    console.log('URL extraction debug:', {
      originalUrl: cloudinaryUrl,
      pathname: url.pathname,
      pathParts: pathParts,
      cloudNameFromRegex: cloudName
    });
    
    // Find the index of 'upload'
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      console.warn('No "upload" found in Cloudinary URL:', cloudinaryUrl);
      return cloudinaryUrl; // Return as-is if structure is unexpected
    }

    // Get everything after 'upload' - this includes transformations and the file
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    if (afterUpload.length === 0) {
      console.warn('No file found after "upload" in URL:', cloudinaryUrl);
      return cloudinaryUrl;
    }
    
    // The last part should be the file (public_id.format)
    const fileName = afterUpload[afterUpload.length - 1];
    
    // Use cloud name from regex if available, otherwise try from pathParts
    let finalCloudName = cloudName;
    if (!finalCloudName) {
      // Try to get from pathParts - cloud_name should be before 'image'
      const imageIndex = pathParts.indexOf('image');
      if (imageIndex > 0 && pathParts[imageIndex - 1] !== 'image') {
        finalCloudName = pathParts[imageIndex - 1];
      } else if (pathParts[0] && pathParts[0] !== 'image') {
        finalCloudName = pathParts[0];
      }
    }
    
    if (!finalCloudName || finalCloudName === 'image') {
      console.error('Could not extract cloud name from URL:', cloudinaryUrl);
      // Return original URL if we can't extract cloud name
      return cloudinaryUrl;
    }
    
    // Reconstruct the original URL: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
    const originalPath = `/${finalCloudName}/image/upload/${fileName}`;
    const finalUrl = `${url.protocol}//${url.host}${originalPath}`;
    
    console.log('Extracted URL:', { original: cloudinaryUrl, extracted: finalUrl, cloudName: finalCloudName });
    
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

