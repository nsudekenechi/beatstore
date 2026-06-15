export interface ITag {
    _id: string;
    name: string;
}

export interface IGenres {
    _id: string;
    name: string;
}

export interface IBeats {
    _id: string;
    name: string;
    bpm: number;  // Changed to number
    key: string;
    genre: string[];
    tags: string[];
    plays: number;
    likes: number;
    files: {
        image: string;
        mp3: string;
        wav?: string;
        trackout?: string;
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
}