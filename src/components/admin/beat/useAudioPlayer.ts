"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// id used by the upload form's mp3 preview so the table and form share one player
export const FORM_MP3_ID = "form-mp3";

export interface AudioPlayer {
    activeId: string | null;
    isPlaying: boolean;
    isLoading: boolean;
    toggle: (id: string, url: string) => void;
    stop: () => void;
    getAudio: () => HTMLAudioElement | null;
}

// One shared <audio> element for the whole page: switching tracks swaps its src,
// which guarantees only one preview plays at a time and avoids an element per row.
// State only changes on play/pause/switch — time updates are read straight off the
// element by <TrackProgress> so playback doesn't re-render the table.
export default function useAudioPlayer(): AudioPlayer {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeIdRef = useRef<string | null>(null);
    const [state, setState] = useState({
        activeId: null as string | null,
        isPlaying: false,
        isLoading: false,
    });

    const getAudio = useCallback(() => audioRef.current, []);

    const ensureAudio = useCallback(() => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio();
        audio.preload = "none";
        audio.addEventListener("playing", () => setState((prev) => ({ ...prev, isPlaying: true, isLoading: false })));
        audio.addEventListener("waiting", () => setState((prev) => ({ ...prev, isLoading: true })));
        audio.addEventListener("pause", () => setState((prev) => ({ ...prev, isPlaying: false })));
        audio.addEventListener("ended", () => setState((prev) => ({ ...prev, isPlaying: false })));
        audio.addEventListener("error", () => {
            if (!audio.getAttribute("src")) return; // clearing src can fire a spurious error
            toast.error("Couldn't play this audio file");
            activeIdRef.current = null;
            setState({ activeId: null, isPlaying: false, isLoading: false });
        });
        audioRef.current = audio;
        return audio;
    }, []);

    const toggle = useCallback((id: string, url: string) => {
        const audio = ensureAudio();
        if (activeIdRef.current === id) {
            if (audio.paused) {
                audio.play().catch(() => { }); // aborted loads reject — the error listener covers real failures
            } else {
                audio.pause();
            }
            return;
        }
        // switching tracks: assigning src aborts the previous load/playback
        activeIdRef.current = id;
        audio.src = url;
        setState({ activeId: id, isPlaying: false, isLoading: true });
        audio.play().catch(() => { });
    }, [ensureAudio]);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        activeIdRef.current = null;
        if (audio) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
        }
        setState({ activeId: null, isPlaying: false, isLoading: false });
    }, []);

    // release the element on unmount so playback doesn't outlive the page
    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            }
            audioRef.current = null;
        };
    }, []);

    return { ...state, toggle, stop, getAudio };
}
