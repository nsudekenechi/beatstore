import mongoose from "mongoose";
import connectDB from "@/lib/db";
import {
    IOrder,
    Order,
    ORDER_STATUSES,
    PAYMENT_PROVIDERS,
    PAYMENT_STATUSES,
} from "@/models/order";

// Thrown for expected failures (bad input, missing order) so the controller can
// map them straight to an HTTP status without inspecting messages.
export class OrderServiceError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = "OrderServiceError";
    }
}

export interface OrderListQuery {
    page?: string;
    limit?: string;
    search?: string;
    paymentStatus?: string;
    orderStatus?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface OrderListRow {
    _id: string;
    orderNumber: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    itemCount: number;
    total: number;
    currency: string;
    provider: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: Date;
}

export interface OrderListResult {
    orders: OrderListRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// whitelist of sortable fields → their path in the document
const SORT_FIELDS: Record<string, string> = {
    createdAt: "createdAt",
    total: "totals.total",
    "payment.paidAt": "payment.paidAt",
};

const parsePositiveInt = (value: string | undefined, fallback: number, label: string): number => {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new OrderServiceError(`Invalid ${label}: must be a positive integer.`, 400);
    }
    return parsed;
};

const parseEnum = (value: string | undefined, allowed: readonly string[], label: string): string | undefined => {
    if (value === undefined || value === "") return undefined;
    if (!allowed.includes(value)) {
        throw new OrderServiceError(`Invalid ${label}: must be one of ${allowed.join(", ")}.`, 400);
    }
    return value;
};

const parseDate = (value: string | undefined, label: string): Date | undefined => {
    if (value === undefined || value === "") return undefined;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
        throw new OrderServiceError(`Invalid ${label}: must be a valid date (e.g. 2026-07-01).`, 400);
    }
    return parsed;
};

// user input goes into a regex — escape it so "j.doe+x@mail.com" matches literally
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getOrders = async (query: OrderListQuery): Promise<OrderListResult> => {
    const page = parsePositiveInt(query.page, 1, "page");
    let limit = parsePositiveInt(query.limit, DEFAULT_LIMIT, "limit");
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const paymentStatus = parseEnum(query.paymentStatus, PAYMENT_STATUSES, "paymentStatus");
    const orderStatus = parseEnum(query.orderStatus, ORDER_STATUSES, "orderStatus");
    const provider = parseEnum(query.provider, PAYMENT_PROVIDERS, "provider");
    const startDate = parseDate(query.startDate, "startDate");
    const endDate = parseDate(query.endDate, "endDate");
    if (startDate && endDate && startDate > endDate) {
        throw new OrderServiceError("Invalid date range: startDate must be before endDate.", 400);
    }

    const sortField = SORT_FIELDS[query.sortBy || "createdAt"];
    if (!sortField) {
        throw new OrderServiceError(`Invalid sortBy: must be one of ${Object.keys(SORT_FIELDS).join(", ")}.`, 400);
    }
    const sortOrder = parseEnum(query.sortOrder, ["asc", "desc"], "sortOrder") ?? "desc";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const match: Record<string, unknown> = {};
    if (paymentStatus) match["payment.status"] = paymentStatus;
    if (orderStatus) match.orderStatus = orderStatus;
    if (provider) match["payment.provider"] = provider;
    if (startDate || endDate) {
        match.createdAt = {
            ...(startDate ? { $gte: startDate } : {}),
            ...(endDate ? { $lte: endDate } : {}),
        };
    }
    if (query.search?.trim()) {
        const pattern = new RegExp(escapeRegex(query.search.trim()), "i");
        match.$or = [
            { orderNumber: pattern },
            { invoiceNumber: pattern },
            { "customerSnapshot.name": pattern },
            { "customerSnapshot.email": pattern },
        ];
    }

    await connectDB();

    // aggregation lets us project the item COUNT without pulling the line items over the wire
    const [orders, total] = await Promise.all([
        Order.aggregate<OrderListRow>([
            { $match: match },
            { $sort: { [sortField]: sortDirection, _id: sortDirection } }, // _id tiebreak keeps pages stable
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $project: {
                    orderNumber: 1,
                    invoiceNumber: 1,
                    customerName: "$customerSnapshot.name",
                    customerEmail: "$customerSnapshot.email",
                    itemCount: { $size: { $ifNull: ["$items", []] } },
                    total: "$totals.total",
                    currency: "$totals.currency",
                    provider: "$payment.provider",
                    paymentStatus: "$payment.status",
                    orderStatus: 1,
                    createdAt: 1,
                },
            },
        ]),
        Order.countDocuments(match),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1 && total > 0,
        },
    };
};

export const getOrderById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new OrderServiceError("Invalid order id.", 400);
    }

    await connectDB();
    const order = await Order.findById(id).lean<IOrder>();
    if (!order) {
        throw new OrderServiceError("Order not found.", 404);
    }

    // shape the response explicitly — internal fields (payment reference, userId)
    // stay out unless the admin UI actually needs them
    return {
        _id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: {
            name: order.customerSnapshot.name,
            email: order.customerSnapshot.email,
            phone: order.customerSnapshot.phone ?? null,
        },
        items: order.items.map((item) => ({
            beat: {
                title: item.beatSnapshot.title,
                slug: item.beatSnapshot.slug,
                coverImage: item.beatSnapshot.coverImage,
                bpm: item.beatSnapshot.bpm,
                key: item.beatSnapshot.key,
                genre: item.beatSnapshot.genre,
            },
            license: {
                version: item.licenseSnapshot.version,
                name: item.licenseSnapshot.name,
                format: item.licenseSnapshot.format,
                territory: item.licenseSnapshot.territory,
                state: item.licenseSnapshot.state,
                termsOfYears: item.licenseSnapshot.termsOfYears,
                distributionCopies: item.licenseSnapshot.distributionCopies,
                audioStreams: item.licenseSnapshot.audioStreams,
                freeDownloads: item.licenseSnapshot.freeDownloads,
                price: item.licenseSnapshot.price,
            },
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            deliveredFiles: item.deliveredFiles.map((file) => ({
                format: file.format,
                originalFilename: file.originalFilename,
                publicId: file.publicId,
                resourceType: file.resourceType,
            })),
        })),
        totals: {
            subtotal: order.totals.subtotal,
            discount: order.totals.discount,
            total: order.totals.total,
            currency: order.totals.currency,
        },
        discount: order.discount
            ? {
                code: order.discount.code,
                type: order.discount.type,
                value: order.discount.value,
                amount: order.discount.amount,
            }
            : null,
        payment: {
            provider: order.payment.provider,
            status: order.payment.status,
            paidAt: order.payment.paidAt ?? null,
            refundedAt: order.payment.refundedAt ?? null,
            refundReason: order.payment.refundReason ?? null,
        },
    };
};
