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


export interface IOrderLineItem {
    // Original references (for analytics & relationships)
    beatId: mongoose.Types.ObjectId;
    licenseId: mongoose.Types.ObjectId;

    // Snapshot of the beat at purchase time
    beatSnapshot: {
        title: string;
        slug: string;
        coverImage: string;
        bpm: number;
        key: string;
        genre: string;
    };

    // Snapshot of the license at purchase time
    licenseSnapshot: {
        version: number;

        name: string;

        format: ("mp3" | "wav" | "trackout")[];

        territory: "worldwide" | "local";

        state: "Exclusive" | "Non-Exclusive";

        termsOfYears: number;

        distributionCopies: number;

        audioStreams: number;

        freeDownloads: number | "unlimited";

        price: number;
    };

    // Financial
    unitPrice: number;
    quantity: number;
    subtotal: number;

    // Digital assets (stable references, NOT signed URLs)
    deliveredFiles: {
        format: "mp3" | "wav" | "trackout";

        publicId: string;

        resourceType: string;

        originalFilename: string;
    }[];
}

export interface IOrder {
    // Human-readable identifiers
    orderNumber: string;
    invoiceNumber: string;

    // Customer
    customerSnapshot: {
        name?: string;

        email: string;

        phone?: string;
    };

    // Optional account (guest checkout supported)
    userId?: mongoose.Types.ObjectId;

    // Purchased items
    items: IOrderLineItem[];

    // Totals
    subtotal: number;

    discount?: {
        code: string;

        type: "fixed" | "percentage";

        value: number;

        amount: number;
    };


    total: number;

    currency: string;

    // Payment
    payment: {
        provider: "paystack" | "flutterwave" | "stripe";


        status:
        | "pending"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded";

        paidAt?: Date;

        refundedAt?: Date;

        refundReason?: string;
    };


    // Order lifecycle
    orderStatus:
    | "pending"
    | "processing"
    | "completed"
    | "cancelled"
    | "disputed";

    // Prevent duplicate payment processing
    checkoutSessionId: string;

    createdAt: Date;

    updatedAt: Date;
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