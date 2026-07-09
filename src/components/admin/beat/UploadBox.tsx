"use client";
import React, { useEffect, useRef, useState } from "react";
import { RiUploadCloud2Line, RiCheckboxCircleFill, RiCloseLine } from "react-icons/ri";
import { FileRule } from "./schema";
import ImagePreview from "./ImagePreview";
import PlayButton from "./PlayButton";
import TrackProgress from "./TrackProgress";
import { AudioPlayer } from "./useAudioPlayer";
import { UploadState } from "./useBeatUploads";

interface UploadBoxProps {
    rule: FileRule;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    // true when editing a beat that already has this file uploaded
    hasExistingFile?: boolean;
    existingImageUrl?: string; // edit mode preview for the cover image
    showImagePreview?: boolean;
    // audio preview (mp3 box): shared page player + a stable id for this box
    audioPlayer?: AudioPlayer;
    audioId?: string;
    existingAudioUrl?: string; // edit mode: preview the file already on record
    // direct-to-Cloudinary upload state for this file
    upload?: UploadState;
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`);

export default function UploadBox({ rule, file, onChange, error, hasExistingFile, existingImageUrl, showImagePreview, audioPlayer, audioId, existingAudioUrl, upload }: UploadBoxProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const wantsAudio = !!(audioPlayer && audioId);

    // object URL for previewing a freshly selected audio file; replacing or removing
    // the file stops any preview of the old one and revokes its URL
    useEffect(() => {
        if (!wantsAudio) return;
        if (audioPlayer!.activeId === audioId) audioPlayer!.stop();
        if (!file) {
            setObjectUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only the file matters; player/id are stable per box
    }, [file, wantsAudio]);

    const handleFiles = (files: FileList | null) => {
        if (files?.[0]) onChange(files[0]);
    };

    const openBrowser = () => inputRef.current?.click();

    const showPreview = showImagePreview && (file || existingImageUrl);

    const isUploadingFile = upload?.status === "uploading";
    const displayError = error || (upload?.status === "error" ? upload.error : undefined);

    const previewAudioUrl = file ? objectUrl : existingAudioUrl;
    const isAudioActive = wantsAudio && audioPlayer!.activeId === audioId;
    const audioButton = wantsAudio && previewAudioUrl && (
        <PlayButton
            isPlaying={isAudioActive && audioPlayer!.isPlaying}
            isLoading={isAudioActive && audioPlayer!.isLoading}
            label={`Play ${rule.label} preview`}
            onToggle={() => audioPlayer!.toggle(audioId!, previewAudioUrl)}
            size={12}
            className="shrink-0 w-7 h-7 rounded-full bg-accent/10 text-accent hover:bg-accent/20"
        />
    );

    return (
        <div className="grid gap-1 text-xs min-w-0">
            <span>
                {rule.label}
                <span className="text-[#999] ml-1.5 normal-case">
                    {rule.extensions.join(", ")}
                    {rule.maxSize ? ` · max ${Math.round(rule.maxSize / 1024 / 1024)}MB` : ""}
                </span>
            </span>

            <div
                role="button"
                tabIndex={0}
                aria-label={`Upload ${rule.label}`}
                onClick={openBrowser}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openBrowser();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
                className={`border border-dashed rounded-xl duration-300 cursor-pointer outline-none focus-visible:border-accent group min-w-0
                    ${displayError ? "border-red-400 bg-red-50/50" : upload?.status === "success" ? "border-green-500/40 bg-green-50/40" : isDragging ? "border-accent bg-accent/5" : file || hasExistingFile ? "border-accent/40 bg-accent/2" : "border-[#999] hover:border-accent hover:bg-accent/2"}
                    ${showPreview ? "h-32 overflow-hidden p-1" : "px-3 py-4"}`}
            >
                {showPreview ? (
                    <ImagePreview file={file} src={existingImageUrl} onRemove={() => onChange(null)} />
                ) : file ? (
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <RiCheckboxCircleFill className="text-accent shrink-0" size={18} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate" title={file.name}>{file.name}</p>
                                <p className="text-[#999]">{formatSize(file.size)}</p>
                            </div>
                            {audioButton}
                            <button
                                type="button"
                                aria-label={`Remove ${rule.label}`}
                                disabled={isUploadingFile}
                                className="text-[#999] hover:text-primary p-1 rounded-full hover:bg-black/5 duration-200 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-default"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(null);
                                }}
                            >
                                <RiCloseLine size={16} />
                            </button>
                        </div>
                        {isAudioActive && <TrackProgress getAudio={audioPlayer!.getAudio} className="mt-2" />}
                    </div>
                ) : hasExistingFile && wantsAudio && existingAudioUrl ? (
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            {audioButton}
                            <p className="flex-1 min-w-0 truncate text-[#777]">
                                <span className="text-accent">Uploaded</span> — drop a file to replace
                            </p>
                        </div>
                        {isAudioActive && <TrackProgress getAudio={audioPlayer!.getAudio} className="mt-2" />}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-center text-[#777]">
                        <RiUploadCloud2Line size={20} className="group-hover:-translate-y-0.5 duration-300" />
                        {hasExistingFile ? (
                            <p>
                                <span className="text-accent">Uploaded</span> — drop a file to replace
                            </p>
                        ) : (
                            <p>
                                <span className="text-accent">Browse</span> or drag & drop
                            </p>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={rule.extensions.join(",")}
                className="hidden"
                onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = ""; // allow re-selecting the same file
                }}
            />

            {isUploadingFile && (
                <div className="flex items-center gap-2" role="progressbar" aria-valuenow={Math.round(upload.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${rule.label}`}>
                    <div className="h-1 flex-1 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full duration-200" style={{ width: `${Math.round(upload.progress * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-[#999] tabular-nums shrink-0">{Math.round(upload.progress * 100)}%</span>
                </div>
            )}
            {upload?.status === "success" && !isUploadingFile && (
                <span className="text-green-600 flex items-center gap-1">
                    <RiCheckboxCircleFill size={12} /> Uploaded
                </span>
            )}
            {displayError && <span className="text-red-500">{displayError}</span>}
        </div>
    );
}
