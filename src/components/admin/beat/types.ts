// Client-side shapes for the Beat admin page.
// The beat API returns genre/tags as ObjectId strings and adds a signed `url`
// to the image + mp3 files on GET (see /api/admin/beat).
import { UploadedAsset } from "@/lib/cloudinary/uploadAsset";

export interface IOption {
    _id: string;
    name: string;
}

interface IBeatFile {
    publicId: string;
    resourceType: string;
    url?: string;
}

export interface IBeatRow {
    _id: string;
    name: string;
    bpm: number;
    key: string;
    genre: string[];
    tags: string[];
    isAvailable: boolean;
    createdAt?: string;
    files: {
        image: IBeatFile;
        mp3: IBeatFile;
        wav: IBeatFile;
        trackout: IBeatFile;
    };
}

export interface IBeatFormValues {
    name: string;
    bpm: string; // kept as string for the input, coerced by the schema
    key: string;
    genre: string[];
    tags: string[];
    image: File | null;
    mp3: File | null;
    wav: File | null;
    trackout: File | null;
    isAvailable: boolean;
}

export type BeatFormErrors = Partial<Record<keyof IBeatFormValues, string>>;

// JSON body sent to the beat API after files were uploaded directly to Cloudinary.
// On edit, `files` only contains the entries that were replaced.
export interface IBeatSubmitPayload {
    name: string;
    bpm: number;
    key: string;
    genre: string[];
    tags: string[];
    isAvailable: boolean;
    files: Partial<Record<"image" | "mp3" | "wav" | "trackout", UploadedAsset>>;
}
