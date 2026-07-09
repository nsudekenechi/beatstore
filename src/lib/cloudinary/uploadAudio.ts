// Client-side: gated audio upload (mp3/wav — Cloudinary files audio under "video").
import { uploadAsset, UploadedAsset } from "./uploadAsset";

export const uploadAudio = (file: File, onProgress?: (fraction: number) => void): Promise<UploadedAsset> =>
    uploadAsset(file, { access: "gated", resourceType: "video", onProgress });
