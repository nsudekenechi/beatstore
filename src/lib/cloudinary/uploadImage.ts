// Client-side: publicly-delivered image upload (cover art).
import { uploadAsset, UploadedAsset } from "./uploadAsset";

export const uploadImage = (file: File, onProgress?: (fraction: number) => void): Promise<UploadedAsset> =>
    uploadAsset(file, { access: "public", resourceType: "image", onProgress });
