"use client";
import React from "react";
import { IoPlay, IoPause } from "react-icons/io5";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PlayButtonProps {
    isPlaying: boolean;
    isLoading: boolean;
    label: string; // accessible name, e.g. "Play <beat name> preview"
    onToggle: () => void;
    disabled?: boolean;
    size?: number;
    className?: string;
}

export default function PlayButton({ isPlaying, isLoading, label, onToggle, disabled, size = 14, className = "" }: PlayButtonProps) {
    return (
        <button
            type="button"
            aria-label={isPlaying ? label.replace(/^Play/, "Pause") : label}
            aria-pressed={isPlaying}
            disabled={disabled || isLoading}
            onClick={(e) => {
                e.stopPropagation(); // rows/upload boxes have their own click handlers
                onToggle();
            }}
            className={`flex items-center justify-center cursor-pointer duration-300 disabled:cursor-default ${className}`}
        >
            {isLoading ? (
                <LoadingSpinner size={size} color="currentColor" />
            ) : (
                <span className="relative block" style={{ width: size, height: size }}>
                    <IoPlay size={size} className={`absolute inset-0 duration-200 ${isPlaying ? "opacity-0 scale-50" : "opacity-100 scale-100"}`} />
                    <IoPause size={size} className={`absolute inset-0 duration-200 ${isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} />
                </span>
            )}
        </button>
    );
}
