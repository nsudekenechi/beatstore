import mongoose from "mongoose";

// Orders store SNAPSHOTS of the beat, license, and customer at purchase time —
// never populate the live Beat/License documents; they may have changed or been
// deleted since the sale.

export const PAYMENT_PROVIDERS = ["paystack", "flutterwave", "stripe"] as const;
export const PAYMENT_STATUSES = ["pending", "authorized", "captured", "failed", "refunded"] as const;
export const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled", "disputed"] as const;
export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type OrderStatus = typeof ORDER_STATUSES[number];
export type DiscountType = typeof DISCOUNT_TYPES[number];

export interface IDeliveredFile {
    format: string; // e.g. "mp3" | "wav" | "trackout"
    originalFilename: string;
    publicId: string;
    resourceType: string;
}

export interface IBeatSnapshot {
    beatId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    coverImage: string;
    bpm: number;
    key: string;
    genre: string[]; // genre names at purchase time
}

export interface ILicenseSnapshot {
    licenseId: mongoose.Types.ObjectId;
    version: number;
    name: string;
    format: ("mp3" | "wav" | "trackout")[];
    territory: "worldwide" | "local";
    state: "Non-Exclusive" | "Exclusive";
    termsOfYears: number;
    distributionCopies: number;
    audioStreams: number;
    freeDownloads: number | "unlimited";
    price: number;
}

export interface IOrderItem {
    beatSnapshot: IBeatSnapshot;
    licenseSnapshot: ILicenseSnapshot;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    deliveredFiles: IDeliveredFile[];
}

export interface ICustomerSnapshot {
    userId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
}

export interface IDiscount {
    code: string;
    type: DiscountType;
    value: number; // the configured value (e.g. 10 for 10% or a fixed amount)
    amount: number; // the money actually taken off this order
}

export interface ITotals {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
}

export interface IPayment {
    provider: PaymentProvider;
    status: PaymentStatus;
    reference?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundReason?: string;
}

export interface IOrder {
    _id: mongoose.Types.ObjectId;
    orderNumber: string;
    invoiceNumber: string;
    customerSnapshot: ICustomerSnapshot;
    items: IOrderItem[];
    totals: ITotals;
    discount?: IDiscount;
    payment: IPayment;
    orderStatus: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}

const deliveredFileSchema = new mongoose.Schema<IDeliveredFile>(
    {
        format: { type: String, required: true },
        originalFilename: { type: String, required: true },
        publicId: { type: String, required: true },
        resourceType: { type: String, required: true },
    },
    { _id: false }
);

const beatSnapshotSchema = new mongoose.Schema<IBeatSnapshot>(
    {
        beatId: { type: mongoose.Schema.Types.ObjectId, ref: "Beat", required: true },
        title: { type: String, required: true },
        slug: { type: String, required: true },
        coverImage: { type: String, required: true },
        bpm: { type: Number, required: true },
        key: { type: String, required: true },
        genre: { type: [String], default: [] },
    },
    { _id: false }
);

const licenseSnapshotSchema = new mongoose.Schema<ILicenseSnapshot>(
    {
        licenseId: { type: mongoose.Schema.Types.ObjectId, ref: "License", required: true },
        version: { type: Number, required: true },
        name: { type: String, required: true },
        format: [{ type: String, enum: ["mp3", "wav", "trackout"], required: true }],
        territory: { type: String, enum: ["worldwide", "local"], required: true },
        state: { type: String, enum: ["Non-Exclusive", "Exclusive"], required: true },
        termsOfYears: { type: Number, required: true },
        distributionCopies: { type: Number, required: true },
        audioStreams: { type: Number, required: true },
        freeDownloads: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            validate: {
                validator: (value: unknown) => typeof value === "number" || value === "unlimited",
                message: "freeDownloads must be a number or 'unlimited'",
            },
        },
        price: { type: Number, required: true },
    },
    { _id: false }
);

const orderItemSchema = new mongoose.Schema<IOrderItem>(
    {
        beatSnapshot: { type: beatSnapshotSchema, required: true },
        licenseSnapshot: { type: licenseSnapshotSchema, required: true },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        subtotal: { type: Number, required: true, min: 0 },
        deliveredFiles: { type: [deliveredFileSchema], default: [] },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        invoiceNumber: { type: String, required: true, unique: true },
        customerSnapshot: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            name: { type: String, required: true, index: true },
            email: { type: String, required: true, lowercase: true, trim: true, index: true },
            phone: { type: String },
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items: IOrderItem[]) => items.length > 0,
                message: "An order must contain at least one item",
            },
        },
        totals: {
            subtotal: { type: Number, required: true, min: 0 },
            discount: { type: Number, required: true, min: 0, default: 0 },
            total: { type: Number, required: true, min: 0 },
            currency: { type: String, required: true, default: "USD" },
        },
        discount: {
            type: new mongoose.Schema<IDiscount>(
                {
                    code: { type: String, required: true },
                    type: { type: String, enum: DISCOUNT_TYPES, required: true },
                    value: { type: Number, required: true },
                    amount: { type: Number, required: true },
                },
                { _id: false }
            ),
            required: false,
        },
        payment: {
            provider: { type: String, enum: PAYMENT_PROVIDERS, required: true, index: true },
            status: { type: String, enum: PAYMENT_STATUSES, required: true, default: "pending", index: true },
            reference: { type: String },
            paidAt: { type: Date },
            refundedAt: { type: Date },
            refundReason: { type: String },
        },
        orderStatus: { type: String, enum: ORDER_STATUSES, required: true, default: "pending", index: true },
    },
    { timestamps: true }
);

// admin dashboard lists newest first and sorts/filters by date constantly
orderSchema.index({ createdAt: -1 });

export const Order =
    mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
