"use client";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

interface ImagePreviewProps {
    file?: File | null;
    src?: string; // existing image url (edit mode)
    onRemove: () => void;
}

export default function ImagePreview({ file, src, onRemove }: ImagePreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setObjectUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const previewSrc = objectUrl || src;
    if (!previewSrc) return null;

    return (
        <div className="relative group w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob/signed cloudinary url, not statically optimizable */}
            <img
                src={previewSrc}
                alt="Cover preview"
                className="w-full h-full object-cover rounded-xl duration-300"
            />
            <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 duration-300" />
            <button
                type="button"
                aria-label="Remove image"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-primary rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 duration-300 cursor-pointer"
            >
                <IoClose size={14} />
            </button>
        </div>
    );
}
