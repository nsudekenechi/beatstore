// Server-only: remove an asset from Cloudinary.
import cloudinary from './config';

export const deleteAsset = async (publicId: string, resourceType = 'image'): Promise<void> => {
    try {
        // resource_type/type must match how the asset was uploaded — destroy() defaults to
        // public images and reports "not found" (without throwing) for everything else
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: resourceType === 'image' ? 'upload' : 'authenticated',
        });
        if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(`Cloudinary destroy failed for ${publicId}: ${result.result}`);
        }
    } catch (error) {
        console.error(`Failed to delete ${publicId} from Cloudinary:`, error);
        throw error;
    }
};
