"use client";
import React, { useEffect, useState } from "react";
import { RiApps2AddLine } from "react-icons/ri";
import { IoChevronDown } from "react-icons/io5";
import LoadingSpinner from "@/components/admin//LoadingSpinner";
import MultiSelect from "./MultiSelect";
import UploadBox from "./UploadBox";
import AvailabilitySelect from "./AvailabilitySelect";
import { FILE_RULES, VALID_KEYS, validateBeatForm, validateFile } from "./schema";
import { BeatFormErrors, IBeatFormValues, IBeatRow, IBeatSubmitPayload, IOption } from "./types";
import { AudioPlayer, FORM_MP3_ID } from "./useAudioPlayer";
import useBeatUploads, { UploadKey } from "./useBeatUploads";

interface BeatFormProps {
    isOpen: boolean;
    editingBeat: IBeatRow | null;
    genres: IOption[];
    tags: IOption[];
    optionsLoading: boolean;
    isSubmitting: boolean;
    player: AudioPlayer;
    // resolves true when the API accepted the beat — lets the form keep (or clean up) its uploads
    onSubmit: (payload: IBeatSubmitPayload) => Promise<boolean>;
    onClose: () => void;
}

const emptyValues: IBeatFormValues = {
    name: "",
    bpm: "",
    key: "",
    genre: [],
    tags: [],
    image: null,
    mp3: null,
    wav: null,
    trackout: null,
    isAvailable: true,
};

export default function BeatForm({ isOpen, editingBeat, genres, tags, optionsLoading, isSubmitting, player, onSubmit, onClose }: BeatFormProps) {
    const [values, setValues] = useState<IBeatFormValues>(emptyValues);
    const [errors, setErrors] = useState<BeatFormErrors>({});
    const [nameFocused, setNameFocused] = useState(false);
    const [bpmFocused, setBpmFocused] = useState(false);
    // edit mode: hides the current cover preview once the user removes it, so the drop zone shows again
    const [showExistingImage, setShowExistingImage] = useState(true);
    // direct browser → Cloudinary uploads (caches results so retries never re-upload)
    const uploads = useBeatUploads();

    // populate / reset the form whenever the modal opens
    useEffect(() => {
        if (!isOpen) return;
        setErrors({});
        setShowExistingImage(true);
        if (editingBeat) {
            setValues({
                ...emptyValues,
                name: editingBeat.name,
                bpm: String(editingBeat.bpm),
                key: editingBeat.key,
                genre: editingBeat.genre ?? [],
                tags: editingBeat.tags ?? [],
                isAvailable: editingBeat.isAvailable ?? true,
            });
        } else {
            setValues(emptyValues);
        }
    }, [isOpen, editingBeat]);

    // the modal stays mounted while hidden, so stop the form's audio preview on close
    useEffect(() => {
        if (!isOpen && player.activeId === FORM_MP3_ID) player.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- player methods are stable
    }, [isOpen, player.activeId]);

    // closing an abandoned form cleans up any uploads that never became a beat
    // (a successful submit calls markConsumed() first, making this a no-op)
    useEffect(() => {
        if (!isOpen) uploads.discard();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- discard is stable
    }, [isOpen]);

    const setField = <K extends keyof IBeatFormValues>(field: K, value: IBeatFormValues[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    // validates immediately on selection so bad files are rejected on the spot
    const setFileField = (field: UploadKey, file: File | null) => {
        uploads.invalidate(field, file); // a replaced/removed file orphans its cached upload
        if (field === "image" && !file) setShowExistingImage(false);
        if (file) {
            const error = validateFile(file, FILE_RULES[field]);
            if (error) {
                setValues((prev) => ({ ...prev, [field]: null }));
                setErrors((prev) => ({ ...prev, [field]: error }));
                return;
            }
        }
        setField(field, file);
    };

    const isBusy = isSubmitting || uploads.isUploading;

    const handleClose = () => {
        if (isBusy) return; // closing mid-upload would leave things half-done
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isBusy) return;
        const validationErrors = validateBeatForm(values, !!editingBeat);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;

        // 1. upload files straight to Cloudinary (already-uploaded ones are reused)
        const selectedFiles: Partial<Record<UploadKey, File>> = {};
        if (values.image) selectedFiles.image = values.image;
        if (values.mp3) selectedFiles.mp3 = values.mp3;
        if (values.wav) selectedFiles.wav = values.wav;
        if (values.trackout) selectedFiles.trackout = values.trackout;
        const assets = await uploads.uploadAll(selectedFiles);
        if (!assets) return; // an upload failed — errors shown per box, submit again to retry

        // 2. only metadata goes to our API
        const succeeded = await onSubmit({
            name: values.name,
            bpm: Number(values.bpm),
            key: values.key,
            genre: values.genre,
            tags: values.tags,
            isAvailable: values.isAvailable,
            files: assets,
        });
        if (succeeded) {
            uploads.markConsumed(); // the beat owns the assets now — don't clean them up
            onClose();
        }
        // on failure the cached uploads stay, so fixing the error and resubmitting is instant
    };

    return (
        <div
            className={`fixed bg-black/20 backdrop-blur-[2px] w-full h-full z-50 top-0 left-0 flex justify-center items-center ${!isOpen ? "scale-0 delay-300" : "scale-100"}`}
            onClick={handleClose}
        >
            <div
                className={`${!isOpen ? "scale-0 translate-y-full" : "scale-100 translate-y-0"} duration-300 w-[92%] md:w-[70%] lg:w-[55%] max-h-[90vh] bg-white rounded-4xl overflow-auto shadow-2xl shadow-black/5 py-10`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={editingBeat ? "Edit Beat" : "Upload a Beat"}
            >
                <div className="mb-5 flex items-center justify-center flex-col font-primary">
                    <RiApps2AddLine size={30} />
                    <h1 className="text-[#777]">{editingBeat ? "Edit Beat" : "Upload a Beat"}</h1>
                </div>

                <form
                    className="w-full flex items-center justify-center flex-col font-display gap-5 text-primary"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="w-[85%] md:w-[80%] grid md:grid-cols-2 gap-x-4 gap-y-5">
                        {/* Beat name */}
                        <div className="grid gap-1 text-xs md:col-span-2">
                            <span>Beat Name</span>
                            <div className={`border duration-300 ${errors.name ? "border-red-400 " : nameFocused ? "border-accent " : "border-[#999] "}px-4 py-3 rounded-xl`}>
                                <input
                                    type="text"
                                    aria-label="Beat name"
                                    className={`capitalize outline-none duration-500 w-full ${nameFocused ? "pl-1" : ""}`}
                                    placeholder="Enter Beat Name"
                                    value={values.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    onFocus={() => setNameFocused(true)}
                                    onBlur={() => setNameFocused(false)}
                                />
                            </div>
                            {errors.name && <span className="text-red-500">{errors.name}</span>}
                        </div>

                        {/* BPM */}
                        <div className="grid gap-1 text-xs">
                            <span>BPM</span>
                            <div className={`border duration-300 ${errors.bpm ? "border-red-400 " : bpmFocused ? "border-accent " : "border-[#999] "}px-4 py-3 rounded-xl`}>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    aria-label="BPM"
                                    className={`outline-none duration-500 w-full ${bpmFocused ? "pl-1" : ""}`}
                                    placeholder="e.g. 140"
                                    value={values.bpm}
                                    onChange={(e) => setField("bpm", e.target.value)}
                                    onFocus={() => setBpmFocused(true)}
                                    onBlur={() => setBpmFocused(false)}
                                />
                            </div>
                            {errors.bpm && <span className="text-red-500">{errors.bpm}</span>}
                        </div>

                        {/* Musical key */}
                        <div className="grid gap-1 text-xs">
                            <span>Musical Key</span>
                            <div className={`border duration-300 ${errors.key ? "border-red-400" : "border-[#999] focus-within:border-accent"} px-4 rounded-xl relative`}>
                                <select
                                    aria-label="Musical key"
                                    className="outline-none w-full py-3 appearance-none bg-transparent cursor-pointer"
                                    value={values.key}
                                    onChange={(e) => setField("key", e.target.value)}
                                >
                                    <option value="" disabled>
                                        Select a key
                                    </option>
                                    {VALID_KEYS.map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                                <IoChevronDown size={14} className="text-[#999] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {errors.key && <span className="text-red-500">{errors.key}</span>}
                        </div>

                        {/* Genre + tags */}
                        <MultiSelect
                            label="Genre"
                            placeholder="Search genres..."
                            options={genres}
                            selected={values.genre}
                            onChange={(ids) => setField("genre", ids)}
                            error={errors.genre}
                            isLoading={optionsLoading}
                        />
                        <MultiSelect
                            label="Tags"
                            placeholder="Search tags..."
                            options={tags}
                            selected={values.tags}
                            onChange={(ids) => setField("tags", ids)}
                            error={errors.tags}
                            isLoading={optionsLoading}
                        />

                        {/* Files */}
                        <div className="md:col-span-2 grid md:grid-cols-2 gap-x-4 gap-y-5">
                            <UploadBox
                                rule={FILE_RULES.image}
                                file={values.image}
                                onChange={(file) => setFileField("image", file)}
                                error={errors.image}
                                hasExistingFile={!!editingBeat}
                                existingImageUrl={showExistingImage ? editingBeat?.files?.image?.url : undefined}
                                showImagePreview
                                upload={uploads.states.image}
                            />
                            <div className="grid gap-5 content-start">
                                <UploadBox
                                    rule={FILE_RULES.mp3}
                                    file={values.mp3}
                                    onChange={(file) => setFileField("mp3", file)}
                                    error={errors.mp3}
                                    hasExistingFile={!!editingBeat}
                                    audioPlayer={player}
                                    audioId={FORM_MP3_ID}
                                    existingAudioUrl={editingBeat?.files?.mp3?.url}
                                    upload={uploads.states.mp3}
                                />
                                <UploadBox
                                    rule={FILE_RULES.wav}
                                    file={values.wav}
                                    onChange={(file) => setFileField("wav", file)}
                                    error={errors.wav}
                                    hasExistingFile={!!editingBeat}
                                    upload={uploads.states.wav}
                                />
                            </div>
                            <UploadBox
                                rule={FILE_RULES.trackout}
                                file={values.trackout}
                                onChange={(file) => setFileField("trackout", file)}
                                error={errors.trackout}
                                hasExistingFile={!!editingBeat}
                                upload={uploads.states.trackout}
                            />
                            <AvailabilitySelect value={values.isAvailable} onChange={(value) => setField("isAvailable", value)} />
                        </div>
                    </div>

                    {uploads.isUploading && (
                        <div className="w-[85%] md:w-[80%] flex items-center gap-3 text-xs text-[#777]" aria-live="polite">
                            <span className="shrink-0">Uploading files…</span>
                            <div className="h-1 flex-1 bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full duration-200" style={{ width: `${Math.round(uploads.overallProgress * 100)}%` }} />
                            </div>
                            <span className="tabular-nums shrink-0">{Math.round(uploads.overallProgress * 100)}%</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isBusy}
                        className="bg-accent w-50 px-10 h-10 flex items-center justify-center text-sm text-white font-secondary rounded-full cursor-pointer disabled:opacity-70"
                    >
                        {uploads.isUploading ? (
                            `Uploading… ${Math.round(uploads.overallProgress * 100)}%`
                        ) : isSubmitting ? (
                            <LoadingSpinner color="white" />
                        ) : editingBeat ? (
                            "Save Changes"
                        ) : (
                            "Continue"
                        )}
                    </button>
                    <span
                        className={`text-sm ${isBusy ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                        onClick={handleClose}
                    >
                        Cancel
                    </span>
                </form>
            </div>
        </div>
    );
}
