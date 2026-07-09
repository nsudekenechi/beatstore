// Server-only: signed delivery URLs for stored assets.
import cloudinary from './config';

export const getAssetUrl = (publicId: string, resourceType: string): string => {
    return cloudinary.url(publicId, {
        resource_type: resourceType,
        // images are stored with the default "upload" delivery type ("public" 404s),
        // everything else is gated behind "authenticated"
        type: resourceType === 'image' ? 'upload' : 'authenticated',
        sign_url: true,
    });
};
