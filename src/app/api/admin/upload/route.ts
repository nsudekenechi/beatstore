import { NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary/generateSignature";
import { deleteAsset } from "@/lib/cloudinary/deleteAsset";

// Issues signed params for direct browser → Cloudinary uploads.
// Auth is enforced by the /api/admin middleware; the API secret never leaves the server.
export const POST = async (request: Request) => {
    try {
        const body = await request.json().catch(() => ({}));
        const access = body?.access === "gated" ? "gated" : "public";

        return NextResponse.json({ status: true, message: generateUploadSignature(access) });
    } catch (err: any) {
        console.error('Upload signature failed ❌', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
};

// Cleans up an uploaded asset that never made it into a beat (cancelled form,
// replaced file, failed submit) so failed flows don't orphan storage.
export const DELETE = async (request: Request) => {
    try {
        const body = await request.json().catch(() => null);
        const publicId = body?.publicId?.toString();
        const resourceType = body?.resourceType?.toString();

        if (!publicId || !resourceType) {
            return NextResponse.json({ status: false, message: "publicId and resourceType are required!" }, { status: 400 });
        }
        // only allow cleaning up inside the beats upload folder
        if (!publicId.startsWith("beats/")) {
            return NextResponse.json({ status: false, message: "Invalid asset." }, { status: 400 });
        }

        await deleteAsset(publicId, resourceType);
        return NextResponse.json({ status: true, message: "Asset deleted" });
    } catch (err: any) {
        console.error('Asset cleanup failed ❌', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
};
