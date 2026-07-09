"use client";
import { useCallback, useRef, useState } from "react";
import { uploadImage } from "@/lib/cloudinary/uploadImage";
import { uploadAudio } from "@/lib/cloudinary/uploadAudio";
import { uploadZip } from "@/lib/cloudinary/uploadZip";
import { deleteUploadedAsset, UploadedAsset } from "@/lib/cloudinary/uploadAsset";

export type UploadKey = "image" | "mp3" | "wav" | "trackout";
export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadState {
    status: UploadStatus;
    progress: number; // 0..1
    error?: string;
}

const KEYS: UploadKey[] = ["image", "mp3", "wav", "trackout"];

const UPLOADERS: Record<UploadKey, (file: File, onProgress?: (f: number) => void) => Promise<UploadedAsset>> = {
    image: uploadImage,
    mp3: uploadAudio,
    wav: uploadAudio,
    trackout: uploadZip,
};

const idleStates = (): Record<UploadKey, UploadState> => ({
    image: { status: "idle", progress: 0 },
    mp3: { status: "idle", progress: 0 },
    wav: { status: "idle", progress: 0 },
    trackout: { status: "idle", progress: 0 },
});

const uploadErrorMessage = (err: any, key: UploadKey) =>
    err?.response?.data?.error?.message // Cloudinary's error shape
    || err?.response?.data?.message // our signature endpoint's shape
    || `Couldn't upload the ${key} file. Check your connection and try again.`;

// Centralized upload state for the beat form. Uploads run sequentially, results are
// cached per File so a retry (or a submit that failed on metadata) never re-uploads
// files that already made it — and unused uploads get cleaned up, not orphaned.
export default function useBeatUploads() {
    const [states, setStates] = useState<Record<UploadKey, UploadState>>(idleStates);
    const [overallProgress, setOverallProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const cacheRef = useRef<Partial<Record<UploadKey, { file: File; asset: UploadedAsset }>>>({});
    // throttle refs: only push state when a whole percent changes
    const lastPercentRef = useRef<Record<string, number>>({});

    const setKeyState = useCallback((key: UploadKey, state: UploadState) => {
        setStates((prev) => ({ ...prev, [key]: state }));
    }, []);

    const uploadAll = useCallback(async (files: Partial<Record<UploadKey, File>>): Promise<Partial<Record<UploadKey, UploadedAsset>> | null> => {
        const keys = KEYS.filter((key) => files[key]);
        const grandTotal = keys.reduce((sum, key) => sum + files[key]!.size, 0);
        const loadedBytes: Record<string, number> = {};
        keys.forEach((key) => {
            loadedBytes[key] = cacheRef.current[key]?.file === files[key] ? files[key]!.size : 0;
        });
        lastPercentRef.current = {};

        const pushOverall = () => {
            const total = grandTotal || 1;
            const loaded = keys.reduce((sum, key) => sum + (loadedBytes[key] || 0), 0);
            const percent = Math.round((loaded / total) * 100);
            if (lastPercentRef.current.overall !== percent) {
                lastPercentRef.current.overall = percent;
                setOverallProgress(percent / 100);
            }
        };

        setIsUploading(true);
        pushOverall();
        try {
            for (const key of keys) {
                const file = files[key]!;
                // already uploaded this exact file (retry / resubmit) — reuse it
                if (cacheRef.current[key]?.file === file) {
                    setKeyState(key, { status: "success", progress: 1 });
                    continue;
                }
                setKeyState(key, { status: "uploading", progress: 0 });
                try {
                    const asset = await UPLOADERS[key](file, (fraction) => {
                        loadedBytes[key] = fraction * file.size;
                        const percent = Math.round(fraction * 100);
                        if (lastPercentRef.current[key] !== percent) {
                            lastPercentRef.current[key] = percent;
                            setKeyState(key, { status: "uploading", progress: fraction });
                        }
                        pushOverall();
                    });
                    cacheRef.current[key] = { file, asset };
                    loadedBytes[key] = file.size;
                    setKeyState(key, { status: "success", progress: 1 });
                    pushOverall();
                } catch (err: any) {
                    console.error(`Upload failed for ${key} ❌`, err);
                    setKeyState(key, { status: "error", progress: 0, error: uploadErrorMessage(err, key) });
                    return null; // stop the process — the beat must not be created
                }
            }
            return Object.fromEntries(keys.map((key) => [key, cacheRef.current[key]!.asset]));
        } finally {
            setIsUploading(false);
        }
    }, [setKeyState]);

    // a field's file changed/was removed — the cached upload (if any) is now unused
    const invalidate = useCallback((key: UploadKey, newFile: File | null) => {
        const cached = cacheRef.current[key];
        if (cached && cached.file !== newFile) {
            deleteUploadedAsset(cached.asset); // fire-and-forget orphan cleanup
            delete cacheRef.current[key];
        }
        setKeyState(key, { status: "idle", progress: 0 });
    }, [setKeyState]);

    // the beat was created/updated — the assets are owned by it now, keep them
    const markConsumed = useCallback(() => {
        cacheRef.current = {};
        setStates(idleStates());
        setOverallProgress(0);
    }, []);

    // form abandoned — clean up whatever was uploaded but never attached to a beat
    const discard = useCallback(() => {
        Object.values(cacheRef.current).forEach((entry) => entry && deleteUploadedAsset(entry.asset));
        cacheRef.current = {};
        setStates(idleStates());
        setOverallProgress(0);
    }, []);

    return { states, overallProgress, isUploading, uploadAll, invalidate, markConsumed, discard };
}
