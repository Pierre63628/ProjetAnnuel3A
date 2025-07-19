// Utility functions for handling image URLs

/**
 * Converts a relative image URL to a URL that works with the frontend static serving
 * @param imageUrl - The relative image URL from the backend (e.g., "/uploads/images/filename.jpg")
 * @returns The URL that can be used in the frontend
 */
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Return the relative path as-is since images are served from the public folder
    // The shared volume makes images available at /uploads/images/ in the frontend
    return imageUrl;
};

/**
 * Checks if an image URL is valid and accessible
 * @param imageUrl - The image URL to check
 * @returns Promise that resolves to true if image is accessible
 */
export const isImageAccessible = async (imageUrl: string): Promise<boolean> => {
    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
};
