import { IBeats, IGenres, ILicense, ITag } from "@/lib/types";
import mongoose from "mongoose";
const tagSchema = new mongoose.Schema<ITag>({
    name: { type: String, required: true, unique: true },
});

const genresSchema = new mongoose.Schema<IGenres>({
    name: { type: String, required: true, unique: true }
});

const licenseSchema = new mongoose.Schema<ILicense>({
    name: { type: String, required: true, unique: true },
    format: [{ type: String, enum: ["mp3", "wav", "trackout"], required: true }],
    price: { type: Number, required: true },
    territory: { type: String, enum: ["worldwide", "local"], required: true, default: "worldwide" },
    state: { type: String, enum: ["Non-Exclusive", "Exclusive"], required: true, default: "Non-Exclusive" },
    termsOfYears: { type: Number, required: true },
    distributionCopies: { type: Number, required: true, default: 5000 },
    audioStreams: { type: Number, required: true, default: 1000000 },
    freeDownloads: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: "unlimited",
        validate: {
            validator: function (value: unknown) {
                return typeof value === "number" || value === "unlimited";
            },
            message: "freeDownloads must be a number or 'unlimited'"
        }
    },
}, { timestamps: true });

const beatSchema = new mongoose.Schema<IBeats>({
    name: { type: String, required: true, unique: true },
    bpm: { type: Number, min: 40, max: 250, required: true },
    key: {
        type: String,
        enum: [
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
            "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
        ],
        default: "C"
    },
    genre: { type: [String], required: true },
    tags: { type: [String], required: true },
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    files: {
        image: { type: String, required: true },
        mp3: { type: String, required: true },
        wav: { type: String },
        trackout: { type: String }
    },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
export const Genres = mongoose.models.Genres || mongoose.model("Genres", genresSchema);
export const License = mongoose.models.License || mongoose.model("License", licenseSchema);
export const Beat = mongoose.models.Beat || mongoose.model("Beat", beatSchema);