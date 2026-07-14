import { NextResponse } from "next/server";
import { getOrders, OrderListQuery, OrderServiceError } from "@/lib/services/orderService";

// GET /api/admin/orders — paginated order list with search, filters, and sorting.
// Auth is enforced by the /api/admin middleware. Read-only by design; all query
// parsing/business logic lives in the order service.
export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const query: OrderListQuery = {
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            search: searchParams.get("search") ?? undefined,
            paymentStatus: searchParams.get("paymentStatus") ?? undefined,
            orderStatus: searchParams.get("orderStatus") ?? undefined,
            provider: searchParams.get("provider") ?? undefined,
            startDate: searchParams.get("startDate") ?? undefined,
            endDate: searchParams.get("endDate") ?? undefined,
            sortBy: searchParams.get("sortBy") ?? undefined,
            sortOrder: searchParams.get("sortOrder") ?? undefined,
        };

        const data = await getOrders(query);
        return NextResponse.json({ success: true, message: "Orders retrieved successfully.", data });
    } catch (err: any) {
        if (err instanceof OrderServiceError) {
            return NextResponse.json({ success: false, message: err.message }, { status: err.statusCode });
        }
        console.error("Orders retrieval failed ❌", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
};
