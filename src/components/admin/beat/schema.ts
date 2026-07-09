import { z } from "zod";
import { BeatFormErrors, IBeatFormValues } from "./types";

// Mirrors the server-side rules in /api/admin/beat so users get instant
// feedback instead of a failed round-trip.
export const VALID_KEYS = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
] as const;

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export interface FileRule {
    label: string;
    extensions: string[];
    mimeTypes: string[];
    maxSize?: number;
}

export const FILE_RULES: Record<"image" | "mp3" | "wav" | "trackout", FileRule> = {
    image: { label: "Cover Image", extensions: [".png", ".jpg", ".jpeg"], mimeTypes: ["image/png", "image/jpeg"], maxSize: MAX_IMAGE_SIZE },
    mp3: { label: "MP3", extensions: [".mp3"], mimeTypes: ["audio/mpeg", "audio/mp3"] },
    wav: { label: "WAV", extensions: [".wav"], mimeTypes: ["audio/wav", "audio/x-wav", "audio/wave"] },
    trackout: { label: "Trackout ZIP", extensions: [".zip"], mimeTypes: ["application/zip", "application/x-zip-compressed"] },
};

// Returns an error message, or null when the file passes the rule.
export const validateFile = (file: File, rule: FileRule): string | null => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!rule.extensions.includes(extension)) {
        return `${rule.label} must be a ${rule.extensions.join(" / ")} file`;
    }
    if (rule.maxSize && file.size > rule.maxSize) {
        return `${rule.label} must be ${Math.round(rule.maxSize / 1024 / 1024)}MB or less`;
    }
    return null;
};

const fileField = (rule: FileRule, required: boolean) =>
    z
        .custom<File | null>((value) => value === null || value instanceof File)
        .superRefine((file, ctx) => {
            if (!file) {
                if (required) ctx.addIssue({ code: "custom", message: `${rule.label} is required` });
                return;
            }
            const error = validateFile(file, rule);
            if (error) ctx.addIssue({ code: "custom", message: error });
        });

// When editing, files are optional — leaving one empty keeps the current upload.
export const makeBeatSchema = (isEditing: boolean) =>
    z.object({
        name: z.string().trim().min(1, "Beat name is required"),
        bpm: z
            .string()
            .min(1, "BPM is required")
            .refine((value) => !isNaN(Number(value)), "BPM must be a number")
            .refine((value) => Number(value) > 0, "BPM must be a positive number")
            .refine((value) => Number(value) >= 40 && Number(value) <= 250, "BPM must be between 40 and 250"),
        key: z.string().refine((value) => (VALID_KEYS as readonly string[]).includes(value), "Choose a musical key"),
        genre: z.array(z.string()).min(1, "Select at least one genre"),
        tags: z.array(z.string()).min(1, "Select at least one tag"),
        image: fileField(FILE_RULES.image, !isEditing),
        mp3: fileField(FILE_RULES.mp3, !isEditing),
        wav: fileField(FILE_RULES.wav, !isEditing),
        trackout: fileField(FILE_RULES.trackout, !isEditing),
        isAvailable: z.boolean(),
    });

export const validateBeatForm = (values: IBeatFormValues, isEditing: boolean): BeatFormErrors => {
    const result = makeBeatSchema(isEditing).safeParse(values);
    if (result.success) return {};

    const errors: BeatFormErrors = {};
    result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof IBeatFormValues;
        if (field && !errors[field]) errors[field] = issue.message;
    });
    return errors;
};
