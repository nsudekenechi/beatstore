import { NextResponse } from "next/server";
import { getOrderById, OrderServiceError } from "@/lib/services/orderService";

// GET /api/admin/orders/:id — full order details (snapshots, items, files, payment).
export const GET = async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;
        const order = await getOrderById(id);
        return NextResponse.json({ success: true, message: "Order retrieved successfully.", data: { order } });
    } catch (err: any) {
        if (err instanceof OrderServiceError) {
            return NextResponse.json({ success: false, message: err.message }, { status: err.statusCode });
        }
        console.error("Order retrieval failed ❌", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
};
