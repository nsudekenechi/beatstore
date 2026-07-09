// Client-side: direct browser → Cloudinary upload using a server-issued signature.
// The file never touches our API — only its metadata does.
import axios from "axios";
import { getToken } from "@/lib/util";
import type { UploadSignature } from "./generateSignature";

export interface UploadedAsset {
    publicId: string;
    resourceType: string;
    secureUrl: string;
    // echoed back to the API so it can verify the upload really happened on our cloud
    version: number;
    signature: string;
}

export type CloudinaryResourceType = "image" | "video" | "raw";

interface UploadOptions {
    // "gated" stores behind authenticated delivery (audio/zip); "public" for images
    access: "public" | "gated";
    resourceType: CloudinaryResourceType;
    onProgress?: (fraction: number) => void; // 0..1
}

export async function uploadAsset(file: File, { access, resourceType, onProgress }: UploadOptions): Promise<UploadedAsset> {
    // 1. ask our API to sign the upload params (secret never leaves the server)
    const signatureReq = await axios.post("/api/admin/upload", { access }, getToken());
    const sig: UploadSignature = signatureReq.data.message;

    // 2. send the file straight to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);
    if (sig.type) formData.append("type", sig.type);

    const upload = await axios.post(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
        formData,
        {
            onUploadProgress: (event) => {
                if (onProgress && event.total) onProgress(event.loaded / event.total);
            },
        }
    );

    return {
        publicId: upload.data.public_id,
        resourceType: upload.data.resource_type,
        secureUrl: upload.data.secure_url,
        version: upload.data.version,
        signature: upload.data.signature,
    };
}

// Best-effort removal of an asset that ended up unused (cancelled form, replaced
// file, failed submit). Goes through our API so the secret stays server-side.
export async function deleteUploadedAsset(asset: Pick<UploadedAsset, "publicId" | "resourceType">): Promise<void> {
    try {
        await axios.delete("/api/admin/upload", {
            ...getToken(),
            data: { publicId: asset.publicId, resourceType: asset.resourceType },
        });
    } catch (err) {
        // orphan cleanup should never break the main flow
        console.error("Failed to clean up uploaded asset", asset.publicId, err);
    }
}
