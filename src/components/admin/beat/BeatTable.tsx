"use client";
import React, { useCallback, useMemo } from "react";
import { TbEdit } from "react-icons/tb";
import { RiDeleteBinLine, RiMusic2Line } from "react-icons/ri";
import LoadingSpinner from "@/components/LoadingSpinner";
import PlayButton from "./PlayButton";
import TrackProgress from "./TrackProgress";
import { AudioPlayer } from "./useAudioPlayer";
import { IBeatRow, IOption } from "./types";

interface BeatTableProps {
    beats: IBeatRow[];
    genres: IOption[];
    tags: IOption[];
    isLoading: boolean;
    deletingId: string | null; // row currently animating out
    togglingId: string | null; // row whose availability is being updated
    player: AudioPlayer;
    onEdit: (beat: IBeatRow) => void;
    onDeleteRequest: (beat: IBeatRow) => void;
    onToggleAvailability: (beat: IBeatRow) => void;
}

const COLS = 9;

function BeatSkeletonRow() {
    return (
        <tr className="h-15 border-b border-black/20 text-sm font-display">
            <td><span className="pl-10"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></span></td>
            <td><div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" /></td>
            <td><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
            <td className="hidden md:table-cell"><div className="h-4 w-10 animate-pulse rounded bg-gray-200" /></td>
            <td className="hidden md:table-cell"><div className="h-4 w-8 animate-pulse rounded bg-gray-200" /></td>
            <td className="hidden lg:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
            <td className="hidden lg:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
            <td><div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="hidden md:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
            <td><div className="flex gap-3"><div className="h-4.5 w-4.5 animate-pulse rounded bg-gray-200" /><div className="h-4.5 w-4.5 animate-pulse rounded bg-gray-200" /></div></td>
        </tr>
    );
}

// older records may predate the genre/tags fields — guard against missing arrays
const resolveNames = (ids: string[] | undefined, lookup: Map<string, string>) =>
    (ids ?? []).map((id) => lookup.get(id)).filter(Boolean).join(", ") || "—";

const formatDate = (date?: string) =>
    date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : "—";

interface BeatRowProps {
    beat: IBeatRow;
    genreNames: Map<string, string>;
    tagNames: Map<string, string>;
    isDeleting: boolean;
    isToggling: boolean;
    // playback state for this row only, so memoized siblings don't re-render
    isActive: boolean;
    isPlaying: boolean;
    isAudioLoading: boolean;
    getAudio: () => HTMLAudioElement | null;
    onTogglePlay: (beat: IBeatRow) => void;
    onEdit: (beat: IBeatRow) => void;
    onDeleteRequest: (beat: IBeatRow) => void;
    onToggleAvailability: (beat: IBeatRow) => void;
}

const BeatRow = React.memo(function BeatRow({ beat, genreNames, tagNames, isDeleting, isToggling, isActive, isPlaying, isAudioLoading, getAudio, onTogglePlay, onEdit, onDeleteRequest, onToggleAvailability }: BeatRowProps) {
    const hasPreview = !!beat.files?.mp3?.url;
    return (
        <tr
            className={`h-15 border-b border-black/20 text-sm font-display capitalize ${isDeleting ? "translate-x-full opacity-0 duration-500" : "translate-x-0"}`}
        >
            <td>
                <span className="pl-10">
                    <input type="checkbox" className="accent-accent" checked={isDeleting} onChange={() => { }} />
                </span>
            </td>

            <td>
                <span className="py-2 flex">
                    <span className="relative h-10 w-10 group/cover shrink-0">
                        {beat.files?.image?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element -- signed cloudinary url */
                            <img
                                src={beat.files.image.url}
                                alt={`${beat.name} cover`}
                                className="h-10 w-10 rounded-lg object-cover shadow-sm"
                            />
                        ) : (
                            <span className="h-10 w-10 rounded-lg bg-[#f1f1f1] flex items-center justify-center text-[#999]">
                                <RiMusic2Line size={16} />
                            </span>
                        )}
                        {hasPreview && (
                            <PlayButton
                                isPlaying={isActive && isPlaying}
                                isLoading={isActive && isAudioLoading}
                                label={`Play ${beat.name} preview`}
                                onToggle={() => onTogglePlay(beat)}
                                size={16}
                                className={`absolute inset-0 rounded-lg bg-black/45 text-white duration-300 focus-visible:opacity-100 max-md:opacity-100 ${isActive ? "opacity-100" : "opacity-0 group-hover/cover:opacity-100"}`}
                            />
                        )}
                    </span>
                </span>
            </td>

            <td>
                <span className="block truncate max-w-40 lg:max-w-56" title={beat.name}>{beat.name}</span>
                {isActive && <TrackProgress getAudio={getAudio} className="mt-1 max-w-40 pr-2" />}
            </td>
            <td className="hidden md:table-cell"><span>{beat.bpm}</span></td>
            <td className="hidden md:table-cell"><span>{beat.key}</span></td>
            <td className="hidden lg:table-cell"><span className="text-[#555]">{resolveNames(beat.genre, genreNames)}</span></td>
            <td className="hidden lg:table-cell"><span className="text-[#555]">{resolveNames(beat.tags, tagNames)}</span></td>

            <td>
                <button
                    type="button"
                    aria-label={`Mark ${beat.name} as ${beat.isAvailable ? "unavailable" : "available"}`}
                    disabled={isToggling}
                    onClick={() => onToggleAvailability(beat)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-secondary duration-300 cursor-pointer disabled:opacity-60 ${beat.isAvailable ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-[#f1f1f1] text-[#777] hover:bg-[#e5e5e5]"}`}
                >
                    {isToggling ? (
                        <LoadingSpinner size={12} />
                    ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${beat.isAvailable ? "bg-green-500" : "bg-[#bbb]"}`} />
                    )}
                    {beat.isAvailable ? "Available" : "Unavailable"}
                </button>
            </td>

            <td className="hidden md:table-cell"><span className="text-[#555]">{formatDate(beat.createdAt)}</span></td>

            <td className="text-[#555]">
                <div className="flex gap-3 items-center">
                    <button type="button" aria-label={`Edit ${beat.name}`} className="cursor-pointer hover:text-accent duration-200" onClick={() => onEdit(beat)}>
                        <TbEdit size={18} />
                    </button>
                    <button type="button" aria-label={`Delete ${beat.name}`} className="cursor-pointer hover:text-red-500 duration-200" onClick={() => onDeleteRequest(beat)}>
                        <RiDeleteBinLine size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export default function BeatTable({ beats, genres, tags, isLoading, deletingId, togglingId, player, onEdit, onDeleteRequest, onToggleAvailability }: BeatTableProps) {
    const genreNames = useMemo(() => new Map(genres.map((genre) => [genre._id, genre.name])), [genres]);
    const tagNames = useMemo(() => new Map(tags.map((tag) => [tag._id, tag.name])), [tags]);

    const { activeId, isPlaying, isLoading: isAudioLoading, toggle, getAudio } = player;
    const onTogglePlay = useCallback((beat: IBeatRow) => {
        if (beat.files?.mp3?.url) toggle(beat._id, beat.files.mp3.url);
    }, [toggle]);

    return (
        <table className="w-full border-t border-black/20 overflow-hidden">
            <thead className="bg-[#f1f1f1] h-12.5 font-secondary">
                <tr className="text-sm">
                    <td className="w-[5%]"><span className="pl-10"></span></td>
                    <td className="w-[8%]"><span>Cover</span></td>
                    <td><span>Name</span></td>
                    <td className="hidden md:table-cell"><span>BPM</span></td>
                    <td className="hidden md:table-cell"><span>Key</span></td>
                    <td className="hidden lg:table-cell"><span>Genres</span></td>
                    <td className="hidden lg:table-cell"><span>Tags</span></td>
                    <td><span>Available</span></td>
                    <td className="hidden md:table-cell"><span>Created</span></td>
                    <td><span className="pr-10">Action</span></td>
                </tr>
            </thead>

            <tbody className="overflow-hidden">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, key) => <BeatSkeletonRow key={key} />)
                ) : beats.length > 0 ? (
                    beats.map((beat) => (
                        <BeatRow
                            key={beat._id}
                            beat={beat}
                            genreNames={genreNames}
                            tagNames={tagNames}
                            isDeleting={deletingId === beat._id}
                            isToggling={togglingId === beat._id}
                            isActive={activeId === beat._id}
                            isPlaying={activeId === beat._id && isPlaying}
                            isAudioLoading={activeId === beat._id && isAudioLoading}
                            getAudio={getAudio}
                            onTogglePlay={onTogglePlay}
                            onEdit={onEdit}
                            onDeleteRequest={onDeleteRequest}
                            onToggleAvailability={onToggleAvailability}
                        />
                    ))
                ) : (
                    <tr>
                        <td colSpan={COLS + 1}>
                            <div className="py-14 border-b flex flex-col items-center gap-2 text-center text-[#777]">
                                <RiMusic2Line size={28} className="text-[#bbb]" />
                                <p className="font-display">No beats uploaded yet</p>
                                <p className="text-xs">Click &ldquo;Upload New Beat&rdquo; to add your first one.</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
