"use client";
import React, { useEffect, useState } from "react";

interface TrackProgressProps {
    getAudio: () => HTMLAudioElement | null;
    className?: string;
}

const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

// Subscribes to the shared audio element directly so per-second time updates
// only re-render this small component, never the table rows around it.
export default function TrackProgress({ getAudio, className = "" }: TrackProgressProps) {
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        const sync = () => {
            setTime(audio.currentTime);
            setDuration(audio.duration || 0);
        };
        sync();
        audio.addEventListener("timeupdate", sync);
        audio.addEventListener("loadedmetadata", sync);
        audio.addEventListener("durationchange", sync);
        return () => {
            audio.removeEventListener("timeupdate", sync);
            audio.removeEventListener("loadedmetadata", sync);
            audio.removeEventListener("durationchange", sync);
        };
    }, [getAudio]);

    return (
        <div className={`flex items-center gap-2 normal-case ${className}`}>
            <div className="h-0.75 flex-1 bg-black/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-accent rounded-full duration-300"
                    style={{ width: `${duration ? Math.min((time / duration) * 100, 100) : 0}%` }}
                />
            </div>
            <span className="text-[10px] text-[#999] tabular-nums shrink-0">
                {formatTime(time)} / {formatTime(duration)}
            </span>
        </div>
    );
}
