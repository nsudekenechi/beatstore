// Server-only: signing utilities for direct browser → Cloudinary uploads.
import cloudinary from './config';

export interface UploadSignature {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    type?: 'authenticated';
}

// Signs the exact params the browser will send to Cloudinary's upload endpoint.
// access "gated" stores the asset behind authenticated delivery (audio/zip);
// "public" is normal image delivery.
export const generateUploadSignature = (access: 'public' | 'gated', folder = 'beats'): UploadSignature => {
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string | number> = { folder, timestamp };
    if (access === 'gated') params.type = 'authenticated';

    return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        timestamp,
        signature: cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!),
        folder,
        ...(access === 'gated' ? { type: 'authenticated' as const } : {}),
    };
};

// Cloudinary signs its upload responses with sha1(public_id + version + secret).
// Verifying it proves the metadata the browser sends back describes a real upload
// to OUR cloud, without spending an Admin API call per file.
export const verifyUploadResultSignature = (publicId: string, version: string | number, signature: string): boolean => {
    if (!publicId || !version || !signature) return false;
    const expected = cloudinary.utils.api_sign_request(
        { public_id: publicId, version },
        process.env.CLOUDINARY_API_SECRET!
    );
    return expected === signature;
};
