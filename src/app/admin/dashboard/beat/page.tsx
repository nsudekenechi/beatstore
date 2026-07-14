"use client";
import  { useCallback, useEffect, useState } from "react";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";
import axios from "axios";
import { toast } from "sonner";
import { getToken } from "@/lib/util";
import BeatForm from "@/components/admin/beat/BeatForm";
import BeatTable from "@/components/admin/beat/BeatTable";
import DeleteModal from "@/components/admin/beat/DeleteModal";
import useAudioPlayer from "@/components/admin/beat/useAudioPlayer";
import { IBeatRow, IBeatSubmitPayload, IOption } from "@/components/admin/beat/types";

export default function Beat() {
    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState<IBeatRow[]>([]);
    const [genres, setGenres] = useState<IOption[]>([]);
    const [tags, setTags] = useState<IOption[]>([]);
    const [selectedBeat, setSelectedBeat] = useState<IBeatRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IBeatRow | null>(null);
    const [selectedDeleteBeat, setSelectedDeleteBeat] = useState<string | null>(null);
    const [togglingBeat, setTogglingBeat] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isLoading, setIsLoading] = useState({
        get: false,
        post: false,
        delete: false,
        options: false,
    });
    // one shared audio element for the table rows and the form's mp3 preview
    const player = useAudioPlayer();

    const handleShowModal = () => {
        setShowModal(true);
    };

    const handleHideModal = () => {
        setShowModal(false);
        if (selectedBeat) {
            setSelectedBeat(null);
        }
    };

    const handleGetBeats = async () => {
        setIsLoading((prev) => ({ ...prev, get: true }));
        try {
            const req = await axios.get("/api/admin/beat", getToken());
            setData(req.data.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Couldn't Get Beats, something went wrong");
            console.error(err);
        } finally {
            setIsLoading((prev) => ({ ...prev, get: false }));
        }
    };

    const handleGetOptions = async () => {
        setIsLoading((prev) => ({ ...prev, options: true }));
        try {
            const [genreReq, tagReq] = await Promise.all([
                axios.get("/api/admin/genre", getToken()),
                axios.get("/api/admin/tag", getToken()),
            ]);
            setGenres(genreReq.data.message);
            setTags(tagReq.data.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Couldn't load genres and tags");
            console.error(err);
        } finally {
            setIsLoading((prev) => ({ ...prev, options: false }));
        }
    };

    // Files were already uploaded straight to Cloudinary by the form — the API only
    // receives this JSON payload. Returns success so the form knows whether its
    // uploads were consumed (kept) or should stay cached for a retry.
    const handleSubmitBeat = async (payload: IBeatSubmitPayload): Promise<boolean> => {
        setIsLoading((prev) => ({ ...prev, post: true }));
        try {
            if (selectedBeat) {
                await axios.patch(`/api/admin/beat?id=${selectedBeat._id}`, payload, getToken());
                toast("Beat Updated Successfully");
            } else {
                await axios.post("/api/admin/beat", payload, getToken());
                toast("Beat Uploaded Successfully");
            }
            // refetch instead of appending locally — cover/mp3 urls are signed server-side
            handleGetBeats();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "An error occurred", { dismissible: true, position: "top-right" });
            console.error(err);
            return false;
        } finally {
            setIsLoading((prev) => ({ ...prev, post: false }));
        }
    };

    const handleDeleteBeat = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id;
        setIsLoading((prev) => ({ ...prev, delete: true }));
        try {
            await axios.delete(`/api/admin/beat?id=${id}`, getToken());
            if (player.activeId === id) player.stop();
            setDeleteTarget(null);
            setSelectedDeleteBeat(id);
            setTimeout(() => {
                setData((prev) => prev.filter((item) => item._id != id));
                setSelectedDeleteBeat(null);
            }, 400);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Couldn't Delete Beat");
            console.error(err.response);
        } finally {
            setIsLoading((prev) => ({ ...prev, delete: false }));
        }
    };

    // stable identities so memoized table rows don't re-render on unrelated state changes
    const handleToggleAvailability = useCallback(async (beat: IBeatRow) => {
        setTogglingBeat(beat._id);
        try {
            await axios.patch(`/api/admin/beat?id=${beat._id}`, { isAvailable: !beat.isAvailable }, getToken());
            setData((prev) => prev.map((item) => (item._id === beat._id ? { ...item, isAvailable: !beat.isAvailable } : item)));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Couldn't Update Availability");
            console.error(err);
        } finally {
            setTogglingBeat(null);
        }
    }, []);

    const handleEditRequest = useCallback((beat: IBeatRow) => {
        setSelectedBeat(beat);
        setShowModal(true);
    }, []);

    const handleDeleteRequest = useCallback((beat: IBeatRow) => setDeleteTarget(beat), []);

    useEffect(() => {
        handleGetBeats();
        handleGetOptions();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-10 ">
                <h1 className="  text-2xl ">Manage Beats</h1>
                <span
                    onClick={handleShowModal}
                    className="bg-accent flex px-10 py-3 text-sm text-white font-secondary rounded-full cursor-pointer"
                >
                    Upload New Beat
                </span>
            </div>

            <div className="mb-6 relative w-full md:w-80 font-display">
                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" size={14} />
                <input
                    type="text"
                    role="searchbox"
                    aria-label="Search beats"
                    placeholder="Search by name, genre, tag, key or BPM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border duration-300 ${searchFocused ? "border-accent" : "border-[#999]"} rounded-full pl-10 pr-9 py-2.5 text-xs outline-none`}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
                {searchQuery && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-primary p-1 rounded-full hover:bg-black/5 duration-200 cursor-pointer"
                    >
                        <RiCloseLine size={14} />
                    </button>
                )}
            </div>

            <BeatTable
                beats={data}
                genres={genres}
                tags={tags}
                isLoading={isLoading.get}
                deletingId={selectedDeleteBeat}
                togglingId={togglingBeat}
                searchQuery={searchQuery}
                player={player}
                onEdit={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
                onToggleAvailability={handleToggleAvailability}
            />

            <BeatForm
                isOpen={showModal}
                editingBeat={selectedBeat}
                genres={genres}
                tags={tags}
                optionsLoading={isLoading.options}
                isSubmitting={isLoading.post}
                player={player}
                onSubmit={handleSubmitBeat}
                onClose={handleHideModal}
            />

            <DeleteModal
                isOpen={!!deleteTarget}
                itemName={deleteTarget?.name}
                isDeleting={isLoading.delete}
                onConfirm={handleDeleteBeat}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
