import mongoose from "mongoose";

export interface ITag {
    _id: string;
    name: string;
}

export interface IGenres {
    _id: string;
    name: string;
}

interface ICloudinaryFile {
    publicId: string;
    resourceType: string;
}

export interface IBeats {
    _id: string;
    name: string;
    bpm: number;  // Changed to number
    key: string;
    genre: mongoose.Types.ObjectId[];
    tags: mongoose.Types.ObjectId[];
    plays: number;
    likes: number;
    files: {
        image: ICloudinaryFile;
        mp3: ICloudinaryFile;
        wav: ICloudinaryFile;
        trackout: ICloudinaryFile;
    };
    isAvailable: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ILicense {
    name: string;
    format: ("mp3" | "wav" | "trackout")[];
    price: number;
    territory: "worldwide" | "local";
    state: "Non-Exclusive" | "Exclusive";
    termsOfYears: number;
    distributionCopies: number;
    audioStreams: number;
    freeDownloads: number | "unlimited";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
}