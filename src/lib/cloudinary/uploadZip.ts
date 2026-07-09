// Client-side: gated zip upload (trackout stems — non-media files must go up as "raw").
import { uploadAsset, UploadedAsset } from "./uploadAsset";

export const uploadZip = (file: File, onProgress?: (fraction: number) => void): Promise<UploadedAsset> =>
    uploadAsset(file, { access: "gated", resourceType: "raw", onProgress });
