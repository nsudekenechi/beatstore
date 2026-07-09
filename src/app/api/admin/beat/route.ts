import { deleteAsset } from "@/lib/cloudinary/deleteAsset";
import { getAssetUrl } from "@/lib/cloudinary/getAssetUrl";
import { verifyUploadResultSignature } from "@/lib/cloudinary/generateSignature";
import connectDB from "@/lib/db";
import { Beat, Genres, Tag } from "@/models/tag";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// Files are uploaded directly from the browser to Cloudinary (signed uploads via
// /api/admin/upload) — this route only ever receives JSON metadata about them.
interface IUploadedFile {
    publicId: string;
    resourceType: string;
    version: string | number;
    signature: string;
}

interface IBeatRequest {
    name: string;
    bpm: number;
    key: string;
    genre: string[];
    tags: string[];
    isAvailable: boolean;
    files: {
        image: IUploadedFile;
        mp3: IUploadedFile;
        wav: IUploadedFile;
        trackout: IUploadedFile;
    };
}

const FILE_KEYS = ["image", "mp3", "wav", "trackout"] as const;
type FileKey = typeof FILE_KEYS[number];

const EXPECTED_RESOURCE_TYPES: Record<FileKey, string> = {
    image: "image",
    mp3: "video", // Cloudinary files audio under "video"
    wav: "video",
    trackout: "raw",
};

// Validates one uploaded-file metadata blob: shape, resource type, and the response
// signature Cloudinary returned at upload time — proving the asset really exists on
// our cloud and wasn't fabricated by the client.
const validateUploadedFile = (file: unknown, key: FileKey): string | null => {
    const f = file as Partial<IUploadedFile> | null | undefined;
    if (!f?.publicId || !f?.resourceType || f?.version === undefined || !f?.signature) {
        return `Missing upload metadata for ${key}.`;
    }
    if (!f.publicId.startsWith("beats/")) return `Invalid ${key} upload.`;
    if (f.resourceType !== EXPECTED_RESOURCE_TYPES[key]) return `Invalid ${key} file type.`;
    if (!verifyUploadResultSignature(f.publicId, f.version, f.signature)) return `Could not verify the ${key} upload.`;
    return null;
};

const toStoredFile = (file: IUploadedFile) => ({ publicId: file.publicId, resourceType: file.resourceType });

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await connectDB();
        if (id) {
            return NextResponse.json({ status: true, message: await Beat.findById(id) })
        }

        return NextResponse.json({
            status: true, message: (await Beat.find({})).map((beat) => {
                const obj = beat.toObject();
                return {
                    ...obj,
                    files: {
                        image: { ...obj.files.image, url: getAssetUrl(obj.files.image.publicId, obj.files.image.resourceType) },
                        mp3: { ...obj.files.mp3, url: getAssetUrl(obj.files.mp3.publicId, obj.files.mp3.resourceType) },
                        wav: obj.files.wav,
                        trackout: obj.files.trackout,
                    }
                };
            })
        })

    } catch (err) {
        console.error('Beat failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}

export const POST = async (request: Request) => {
    try {
        const body: IBeatRequest = await request.json();

        if (!body.name || !body.bpm || !body.key || !body.genre?.length || !body.tags?.length) return NextResponse.json({ status: false, message: "Enter required Inputs!" }, { status: 400 });

        // Validate the uploaded-file metadata before touching the DB
        for (const key of FILE_KEYS) {
            const error = validateUploadedFile(body.files?.[key], key);
            if (error) return NextResponse.json({ status: false, message: error }, { status: 400 });
        }

        await connectDB();

        // check if beat already exists
        if (await Beat.findOne({ name: body.name })) return NextResponse.json({ status: false, message: "Beat already exist, add a different name." }, { status: 400 });

        // Check if bpm is within the valid range
        if (body.bpm < 40 || body.bpm > 250) {
            return NextResponse.json({ status: false, message: "BPM must be between 40 and 250." }, { status: 400 });
        }

        // Check if key is valid
        const validKeys = [
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
            "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
        ];
        if (!validKeys.includes(body.key)) {
            return NextResponse.json({ status: false, message: "Invalid key. Please choose a valid key." }, { status: 400 });
        }

        // Check if genre and tags are valid i.e they match the existing genres and tags in the database
        const isValidObjectIdArray = (arr: string[]) =>
            Array.isArray(arr) && arr.length > 0 && arr.every((id) => mongoose.Types.ObjectId.isValid(id));
        if (!isValidObjectIdArray(body.genre)) {
            return NextResponse.json(
                { status: false, message: "Invalid genre. Please choose a valid option." },
                { status: 400 }
            );
        }

        if (!isValidObjectIdArray(body.tags)) {
            return NextResponse.json(
                { status: false, message: "Invalid tags. Please choose a valid option." },
                { status: 400 }
            );
        }
        // Assuming you have a Genre and Tag model to check against
        const validGenres = await Genres.find({ _id: { $in: body.genre } });
        const validTags = await Tag.find({ _id: { $in: body.tags } });

        if (!validGenres.length || !validTags.length) {
            return NextResponse.json({ status: false, message: "Invalid genre or tags. Please choose valid options." }, { status: 400 });
        }

        const beat = await Beat.create({
            name: body.name,
            bpm: body.bpm,
            key: body.key,
            genre: body.genre,
            tags: body.tags,
            isAvailable: body.isAvailable !== false, // defaults to true
            files: {
                image: toStoredFile(body.files.image),
                mp3: toStoredFile(body.files.mp3),
                wav: toStoredFile(body.files.wav),
                trackout: toStoredFile(body.files.trackout),
            }
        });

        return NextResponse.json({ status: true, message: beat })

    } catch (err: any) {
        console.error('Beat failed ❌', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export const PATCH = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ status: false, message: "Beat id is required!" }, { status: 400 });
        }

        await connectDB();

        const existingBeat = await Beat.findById(id);
        if (!existingBeat) {
            return NextResponse.json({ status: false, message: "Beat not found." }, { status: 404 });
        }

        const body: Partial<IBeatRequest> = await request.json();

        // If renaming, make sure no other beat already has that name
        if (body.name && body.name !== existingBeat.name) {
            const nameTaken = await Beat.findOne({ name: body.name, _id: { $ne: id } });
            if (nameTaken) {
                return NextResponse.json({ status: false, message: "Beat already exist, add a different name." }, { status: 400 });
            }
        }

        // Validate bpm if provided
        if (body.bpm !== undefined && (body.bpm < 40 || body.bpm > 250)) {
            return NextResponse.json({ status: false, message: "BPM must be between 40 and 250." }, { status: 400 });
        }

        // Validate key if provided
        const validKeys = [
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
            "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
        ];
        if (body.key && !validKeys.includes(body.key)) {
            return NextResponse.json({ status: false, message: "Invalid key. Please choose a valid key." }, { status: 400 });
        }

        // Validate genre/tags if provided
        const isValidObjectIdArray = (arr: string[]) =>
            Array.isArray(arr) && arr.length > 0 && arr.every((id) => mongoose.Types.ObjectId.isValid(id));

        if (body.genre) {
            if (!isValidObjectIdArray(body.genre)) {
                return NextResponse.json({ status: false, message: "Invalid genre. Please choose a valid option." }, { status: 400 });
            }
            const validGenres = await Genres.find({ _id: { $in: body.genre } });
            if (!validGenres.length) {
                return NextResponse.json({ status: false, message: "Invalid genre. Please choose valid options." }, { status: 400 });
            }
        }

        if (body.tags) {
            if (!isValidObjectIdArray(body.tags)) {
                return NextResponse.json({ status: false, message: "Invalid tags. Please choose a valid option." }, { status: 400 });
            }
            const validTags = await Tag.find({ _id: { $in: body.tags } });
            if (!validTags.length) {
                return NextResponse.json({ status: false, message: "Invalid tags. Please choose valid options." }, { status: 400 });
            }
        }

        // Validate any replaced files' upload metadata
        const replacedKeys = FILE_KEYS.filter((key) => body.files?.[key]);
        for (const key of replacedKeys) {
            const error = validateUploadedFile(body.files![key], key);
            if (error) return NextResponse.json({ status: false, message: error }, { status: 400 });
        }

        // Build update object, only including fields that were actually provided
        const updateFields: Record<string, any> = {};
        if (body.name) updateFields.name = body.name;
        if (body.bpm !== undefined) updateFields.bpm = body.bpm;
        if (body.key) updateFields.key = body.key;
        if (body.genre) updateFields.genre = body.genre;
        if (body.tags) updateFields.tags = body.tags;
        if (body.isAvailable !== undefined) updateFields.isAvailable = body.isAvailable;
        for (const key of replacedKeys) {
            updateFields[`files.${key}`] = toStoredFile(body.files![key]!);
        }

        const updated = await Beat.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        // A replaced file means a brand-new Cloudinary asset — clean up the old one.
        // Best effort: a leftover asset shouldn't fail an otherwise successful update.
        const oldAssets = replacedKeys
            .map((key) => existingBeat.files?.[key])
            .filter((old, index) => old?.publicId && old.publicId !== body.files![replacedKeys[index]]!.publicId);
        const cleanupResults = await Promise.allSettled(
            oldAssets.map((old) => deleteAsset(old.publicId, old.resourceType))
        );
        cleanupResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to delete replaced asset ${oldAssets[index].publicId} ❌`, result.reason);
            }
        });

        return NextResponse.json({ status: true, message: updated });

    } catch (err: any) {
        console.error('Beat failed ❌', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
};

export const DELETE = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);

        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ status: false, message: "Enter required inputs!" }, { status: 400 });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ status: false, message: "Invalid beat id." }, { status: 400 });
        }

        await connectDB();

        const beat = await Beat.findById(id);
        if (!beat) {
            return NextResponse.json({ status: false, message: "Beat not found." }, { status: 404 });
        }

        // DELETE ALL FILES FROM CLOUDINARY FIRST
        const deletePromises = [
            beat.files?.image?.publicId
                ? deleteAsset(beat.files.image.publicId, beat.files.image.resourceType)
                : Promise.resolve(null),
            beat.files?.mp3?.publicId
                ? deleteAsset(beat.files.mp3.publicId, beat.files.mp3.resourceType)
                : Promise.resolve(null),
            beat.files?.wav?.publicId
                ? deleteAsset(beat.files.wav.publicId, beat.files.wav.resourceType)
                : Promise.resolve(null),
            beat.files?.trackout?.publicId
                ? deleteAsset(beat.files.trackout.publicId, beat.files.trackout.resourceType)
                : Promise.resolve(null),
        ];

        // Use allSettled so one failed file deletion doesn't block the others / the DB delete
        const results = await Promise.allSettled(deletePromises);

        const failures = results
            .map((result, index) => ({ result, index }))
            .filter(({ result }) => result.status === 'rejected');

        if (failures.length) {
            failures.forEach(({ result, index }) => {
                const fileLabels = ['image', 'mp3', 'wav', 'trackout'];
                console.error(`Failed to delete ${fileLabels[index]} from Cloudinary ❌`, (result as PromiseRejectedResult).reason);
            });
            // Files failed to delete from Cloudinary — stop here so we don't delete the
            // DB record and lose the publicIds needed to clean them up later/manually.
            return NextResponse.json(
                { status: false, message: "Failed to delete one or more files from storage. Beat was not deleted." },
                { status: 500 }
            );
        }

        // ONLY DELETE THE DB RECORD ONCE ALL FILES ARE CONFIRMED DELETED
        await Beat.findByIdAndDelete(id);

        return NextResponse.json({ status: true, message: "Beat Deleted" });

    } catch (err: any) {
        console.error('Beat failed ❌', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
};
